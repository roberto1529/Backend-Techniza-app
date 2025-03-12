import { Injectable, Res } from '@nestjs/common';
import { QueryTypes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { AuthInterface, MailInterface } from '../types/auth.interfaces';
import { ValidatorSqlService } from 'apps/shared/services/Validator/injector.service';
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
    if ((await !this.validator.isValidInput(data.usuario)) || (await !this.validator.isValidInput(data.passcryto))) {
      console.error('Entrada no válida: posible intento de inyección SQL');
      response = {
        status: 505,
        data: 'Tu cuenta sera bloqueda para proteger tus datos.',
      };
      return response;
    }

    try {
 
      let data_response;
      const result =  await this.sequelize.query(`select us.id, ue.nombre, ue.apellido1, ue.correo, us.usuario
        FROM public.usu_sys us
        JOIN public.usu_pass up ON up.id_usu = us.id
        JOIN public.usu_info_emp ue ON ue.id_usu = us.id
        where us.usuario = :us and up.pass = :pw  and us.estado = true;`, {
        type: QueryTypes.SELECT,
        replacements: {
          us: data.usuario,
          pw: data.passcryto,
        },

      },
    );
      data_response = result;

      if (result.length > 0) {
        /* paso 1 generear el token services */
        let tk = await this._2fa.TokenGenator()
        await this.GuardarToken(
          data_response.map((x) => parseInt(x.id)),
          tk
        );
        /* Enviamos el correo al usuario */
        let datamap = data_response.map((x) => x);

        let _ml: MailInterface = {
          correo: datamap[0].correo,
          asunto: '2FA Autenticación de dos pasos',
          contenido: {
            usuaio: datamap[0].nombre +' '+datamap[0].apellido1,
            token: tk,
            mensaje: 'por favor ingresa el código que recibiste en el portal de acceso.'
          },
        };
        await this.SendMail(_ml);

        data_response = { token: tk };
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
      console.log(error);
      
      await transaction.rollback();
      throw error;
    }
  }

  private async GuardarToken(user, token) {
    try {
      let _user = user[0];
  
      await this.sequelize.query(`UPDATE usu_2fa_reg ufr  SET  estado = false, estado_verificado =  3 
      WHERE  id_usu  = :us and estado_verificado = 1;`, {
        type: QueryTypes.UPDATE,
        replacements: {
          us: _user,
        },
        raw: true,
      });
      const query = `INSERT INTO usu_2fa_reg (id_usu, "token") VALUES(:us,:tk);`;
      await this.sequelize.query(query, {
        type: QueryTypes.INSERT,
        replacements: {
          tk: token,
          us: _user
        },
        raw: true,
      });

      return true;
    } catch (error) {
      console.error('Error en la consulta:', error);
    }
  }

  private SendMail(cuerpo: MailInterface) {
   return this._mail.sendEmail(cuerpo);
  }
}
