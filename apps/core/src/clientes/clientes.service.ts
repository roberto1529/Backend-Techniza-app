import { Injectable } from '@nestjs/common';
import { EncryptionService } from 'apps/shared/services/cypress/crypto.service';
import { ValidatorSqlService } from 'apps/shared/services/Validator/injector.service';
import { Sequelize } from 'sequelize-typescript'; // O desde '@nestjs/sequelize', según tu configuración
import { QueryTypes } from 'sequelize';
import { Response } from 'express';
import { InjectConnection } from '@nestjs/sequelize';
import { MailService } from 'apps/shared/services/mail/mail.service';
import { MailInterface } from '../auth/types/auth.interfaces';
import { ClienteFormulario } from './types/empleado';

@Injectable()
export class ClientesService {
  constructor(
    @InjectConnection() private readonly sequelize: Sequelize, // Inyección correcta de la conexión
    private readonly validatorSqlService: ValidatorSqlService,
    private readonly encryptionService: EncryptionService,
    private readonly _mail: MailService
  ) {}

  async all(res: Response) {
    const transaction = await this.sequelize.transaction();
    try {
      const clientesQuery = await this.sequelize.query(`select uc.id, uc.nombre, uc.correo, uc.telefono, uc.empresa, uc.rfc,
      uc.direccion, uc.id_pais, pp.nopmbre as pais, uc.id_ciudad, pc.nombre as ciudad, uc.codigo_postal, 
      uc.estado_cliente as estado ,uc.id_usu_reg, concat(uc2.nombre,' ', uc2.apellido1) as empleado,
      (current_date::text || ' ' || uc.fecha_reg::text) as fecha_reg
      from usu_cliente uc
      join para_pais pp on pp.id = uc.id_pais
      join para_ciudad pc on pc.id  = uc.id_ciudad
      join usu_info_emp  uc2 on uc2.id_usu = uc.id_usu_reg`,
              {
          type: QueryTypes.SELECT,
          transaction,
        }
      );
      
      const PaisQuery = await this.sequelize.query(`select pp.id, pp.nopmbre from para_pais pp`,{
            type: QueryTypes.SELECT,
            transaction,
          }
      );

      const CuidadQuery = await this.sequelize.query(`select pc.id, pc.nombre as ciudad, pc.id_pais from para_ciudad pc`,{
        type: QueryTypes.SELECT,
        transaction,
          }
      );


      let response: any = { data: {
        usuario: clientesQuery,
        pais: PaisQuery,
        cuidades: CuidadQuery
      }, status: 200 };
      response = await this.encryptionService.encryptData(response);

      await transaction.commit();
      return res.status(200).json(response);
    } catch (error) {
      await transaction.rollback();
      console.log(error);
    }
  }


  async Crear(datos: ClienteFormulario, res: Response){
    let data = datos;
        let response;
        let sys = await this.Crearystema(data);
        if (sys === true) {
          response = { data: 'Cliente registrado con exito', Status: 200 }
          response = await this.encryptionService.encryptData(response);
          return res.status(200).json(response);
        }
  }

  protected async Crearystema(data: ClienteFormulario){

    const transaction = await this.sequelize.transaction();
    try {
      await  this.sequelize.query( `INSERT INTO usu_cliente
      (nombre, correo, telefono, empresa, rfc, direccion, id_pais, id_ciudad, codigo_postal,id_usu_reg)
      VALUES(:nm, :ml, :tl, :em, :rfc, :dr, :ps, :ci, :cp,:emp);`,{
          type: QueryTypes.INSERT,
          replacements: {
            nm: data.nombre,
            ml: data.correo,
            tl: data.telefono,
            em: data.empresa, 
            rfc: data.rfc,
            ps: data.pais,
            ci: data.ciudad,
            cp: data.codpostal,
            dr: data.direccion,
            emp: data.idempleado
          },
          transaction,
        }
      );
      
      
      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      console.log(error);
    }
  }
  


  public async Estado(data, res) {
    
    const transaction = await this.sequelize.transaction();
    try {
      await this.sequelize.query(`UPDATE usu_cliente SET estado_cliente=:es WHERE id=:id;`,{
          type: QueryTypes.UPDATE,
          replacements: {
            es: data.estado,
            id: data.id
          },
          transaction,
      });

      let response: any = { data: 'Estado actulizado con exito.', status: 200 };
      response = await this.encryptionService.encryptData(response);

      await transaction.commit();
      return res.status(200).json(response);
    } catch (error) {
      await transaction.rollback();
      console.log(error);
    }
  }



  public async EditarCliente(data: any, res: Response) {
    const transaction = await this.sequelize.transaction();
    let response;
    try {
      await this.sequelize.query(
        `UPDATE usu_cliente 
         SET nombre = :nm, 
             correo = :ml, 
             telefono = :tl, 
             empresa = :em, 
             rfc = :rfc, 
             direccion = :dr, 
             id_pais = :ps, 
             id_ciudad = :ci, 
             codigo_postal = :cp
         WHERE id = :id;`,
        {
          type: QueryTypes.UPDATE,
          replacements: {
            nm: data.nombre,
            ml: data.correo,
            tl: data.telefono,
            em: data.empresa, 
            rfc: data.rfc,
            dr: data.direccion,
            ps: data.pais,
            ci: data.ciudad,
            cp: data.codpostal,
            emp: data.idempleado,
            id: data.id // ID del cliente a actualizar
          },
          transaction,
        }
      );
  
      await transaction.commit();
      response = { data: 'Cliente editado con exito', Status: 200 }
      response = await this.encryptionService.encryptData(response);
      return res.status(200).json(response);
    } catch (error) {
      await transaction.rollback();
      console.log(error);
      throw error; // Lanzamos el error para que pueda manejarse en otro nivel
    }
  }
  

 
  
  
}
