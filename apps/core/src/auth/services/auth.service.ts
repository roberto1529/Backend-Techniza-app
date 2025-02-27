import { Injectable, Res } from '@nestjs/common';
import { QueryTypes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import * as conf from '../data/consulting.json'; // Importar archivo JSON
import { AuthInterface, MailInterface } from '../types/auth.interfaces';
import { ValidatorSqlService } from 'apps/shared/services/Validator/injector.service';
import * as crypto from 'crypto'; // Importamos el módulo crypto
import { EncryptionService } from 'apps/shared/services/cypress/crypto.service';
import { Auth2FA } from './2fa.service';
import { Response } from 'express';
import { MailService } from 'apps/shared/services/mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private sequelize: Sequelize,
    private validator: ValidatorSqlService,
    private crytoService: EncryptionService,
    private _2fa: Auth2FA,
    private _mail: MailService,
  ) {}

  public async auth_validar_usuarios(data: AuthInterface, res?: Response) {
    const transaction = await this.sequelize.transaction();
    let response;

    // Validar que los datos no contengan patrones de inyección SQL
    if (
      (await !this.validator.isValidInput(data.usuario)) ||
      (await !this.validator.isValidInput(data.passcryto))
    ) {
      console.error('Entrada no válida: posible intento de inyección SQL');
      response = {
        status: 505,
        data: 'Tu cuenta sera bloqueda para proteger tus datos.',
      };
      return response;
    }

    try {
      const query = conf['$user_value'];
      let data_response;
      const result: any = await this.sequelize.query(query, {
        type: QueryTypes.SELECT,
        replacements: {
          us: data.usuario,
          pw: data.passcryto,
        },
        raw: true,
      });
      data_response = result;

      if (result.length > 0) {
        /* paso 1 generear el token services */
        let tk = await this._2fa.TokenGenator();
        let exp = await this._2fa.ExpirationToken();
        /* se guardar token generado con la informacion del usuario en la base de datos */
        await this.GuardarToken(
          data_response.map((x) => parseInt(x.id)),
          tk,
          exp,
        );
        /* Enviamos el correo al usuario */
        let datamap = data_response.map((x) => x);

        let _ml: MailInterface = {
          correo: datamap[0].correo,
          asunto: '2FA Auteticación de dos pasos (ERP)',
          contenido: {
            usuaio: datamap[0].usuario,
            token: tk,
          },
        };
        await this.SendMail(_ml);

        data_response = {
          token: tk,
          expiracion: exp,
        };
        response = {
          status: 200,
          data: result,
        };
      } else {
        response = {
          status: 500,
          data: 'Error usuario y/o clave invalida.',
        };
      }

      await transaction.commit();
      response = await this.crytoService.encryptData(response);

      return res.status(200).json(response);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  private async GuardarToken(user, token, date) {
    try {
      let _user = user[0];
      const query_token = conf['$bloquearToken'];
      await this.sequelize.query(query_token, {
        type: QueryTypes.INSERT,
        replacements: {
          us: _user,
        },
        raw: true,
      });
      const query = conf['$_2facTokenValue'];
      await this.sequelize.query(query, {
        type: QueryTypes.INSERT,
        replacements: {
          tk: token,
          us: _user,
          init: date.init,
          fin: date.fin,
        },
        raw: true,
      });

      return true;
    } catch (error) {
      return error;
    }
  }

  private SendMail(cuerpo: MailInterface) {
   return this._mail.sendEmail(cuerpo);
  }
}
