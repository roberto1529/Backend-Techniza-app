import { Injectable } from '@nestjs/common';
import { QueryTypes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import * as conf from '../data/consulting.json'; // Importar archivo JSON
import { ValidatorSqlService } from 'apps/shared/services/Validator/injector.service';
import * as crypto from 'crypto'; // Importamos el módulo crypto
import { EncryptionService } from 'apps/shared/services/cypress/crypto.service';
import { Response } from 'express';

@Injectable()
export class Auth2FAService {
  constructor(
    private sequelize: Sequelize,
    private validator: ValidatorSqlService,
    private crytoService: EncryptionService,
  ) {}


  public async VerificarToke(data: any, res: Response) {
    console.log('Data en Auth2FAService', data);
    let response;  
    let valido = await this.Validar_Activo(data);
    
    if (valido.status != true) {
         let res = await this.GuardarSesionActiva(valido)
        response = { data: res, Status: 200 }
     }else{
      response = { mensaje: 'Codigo Invalido', Status: 500 }
     }

     response = await this.crytoService.encryptData(response);

     return res.status(200).json(response);
  }

  private async Validar_Activo(data: any) {
    const transaction = await this.sequelize.transaction();
    try {
      const sql = conf['$consultar_tokenActivo'];     
      const qy = await this.sequelize.query(sql, {
        type: QueryTypes.SELECT,
        replacements: {
          us: Number(data.id_user),
          tk: Number(data.token),
        },
        transaction: transaction || undefined, 
      });

      console.log('Resultado:', qy.length);
      if (qy.length > 0) {
        return {status:false , datos:qy}
      } else{
        return {status:true , datos:qy}
      }
    } catch (error) {
      console.log(error);
      transaction.rollback()     
    }

    
      
  }

  private async GuardarSesionActiva(data) {
    try {
      
      let dato = data.datos.map(x => x).flat();
      console.log('Datos de session', dato[0].id_usuario);      
      
      const dapp = dato[0].id_usuario.toString();
      const hash = crypto.createHash('sha256');
      hash.update(dapp);
      // Obtenemos el hash en formato hexadecimal
      const fullHash = hash.digest('hex');
      const sha = fullHash.slice(0, 16);
    
      // await this.sequelize.query(conf['$insert_session'], {
      //   type: QueryTypes.INSERT,
      //   replacements: {
      //     id_user: data.id_user,
      //     sha: sha,
      //   },
      //   raw: true,
      // });
      
      // await this.sequelize.query(conf['$TokenConfimado'], {
      //   type: QueryTypes.UPDATE,
      //   replacements: {
      //     id: datos.id,
      //     sha: sha,
      //   },
      //   raw: true,
      // });



      return sha;
    } catch (error) {
      console.log(error);
      
    }
  }
}
