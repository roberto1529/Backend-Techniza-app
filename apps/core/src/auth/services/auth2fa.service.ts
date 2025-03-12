import { Injectable } from '@nestjs/common';
import { QueryTypes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';import { ValidatorSqlService } from 'apps/shared/services/Validator/injector.service';
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
         let res = await this.GuardarSesionActiva(valido, data.token)
        response = { data: {tk: res, data: valido}, Status: 200 }
     }else{
      response = { mensaje: 'Codigo Invalido', Status: 500 }
     }

     response = await this.crytoService.encryptData(response);

     return res.status(200).json(response);
  }

  private async Validar_Activo(data: any) {
    const transaction = await this.sequelize.transaction();
    try {
      const sql = `select * from usu_2fa_reg c join usu_sys  ie on ie.id = c.id_usu where c.id_usu = :us and c.token = :tk`;
      const qy = await this.sequelize.query(sql, {
        type: QueryTypes.SELECT,
        replacements: {
          us: Number(data.id_user),
          tk: data.token,
        },
        transaction: transaction || undefined, 
      });

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

  private async GuardarSesionActiva(data, tk) {
    try {
      console.log('Datos de session',data);
      let ids = data.datos.map(d => d.id_usu);
      ids = ids[0];
      const hash = crypto.createHash('sha256');
      // Obtenemos el hash en formato hexadecimal
      const fullHash = hash.digest('hex');
      const sha = fullHash.slice(0, 16);
      
      await this.sequelize.query(`UPDATE usu_2fa_reg SET estado_verificado=2 WHERE "token"=:tk and id_usu = :id;`, {
         type: QueryTypes.UPDATE,
         replacements: {
           id: ids,
           tk: tk,
         },
         raw: true,
      });


      return sha;
    } catch (error) {
      console.log(error);
      
    }
  }
}
