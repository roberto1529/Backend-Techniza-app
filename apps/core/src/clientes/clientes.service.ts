import { Injectable } from '@nestjs/common';
import { EncryptionService } from 'apps/shared/services/cypress/crypto.service';
import { ValidatorSqlService } from 'apps/shared/services/Validator/injector.service';
import { Sequelize } from 'sequelize-typescript'; // O desde '@nestjs/sequelize', según tu configuración
import { QueryTypes } from 'sequelize';
import { Response } from 'express';
import { InjectConnection } from '@nestjs/sequelize';
import { MailService } from 'apps/shared/services/mail/mail.service';
import { MailInterface } from '../auth/types/auth.interfaces';

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
      const queryResult = await this.sequelize.query(`select uc.id, uc.nombre, uc.apellido1, uc.apellido2, uc.correo, uc.telefono, uc.empresa, uc.rfc,
      uc.direccion, uc.id_pais, pp.nopmbre as pais, uc.id_ciudad, pc.nombre as ciudad, uc.codigo_postal, 
      uc.estado_cliente as estado ,uc.id_usu_reg, concat(uc2.nombre,' ', uc2.apellido1) as empleado,
      (current_date::text || ' ' || uc.fecha_reg::text) as fecha_reg
      from usu_cliente uc
      join para_pais pp on pp.id = uc.id_pais
      join para_ciudad pc on pc.id  = uc.id_ciudad
      join usu_cliente uc2 on uc2.id = uc.id_usu_reg`,
              {
          type: QueryTypes.SELECT,
          transaction,
        }
      );

      let response: any = { data: queryResult, status: 200 };
      response = await this.encryptionService.encryptData(response);

      await transaction.commit();
      return res.status(200).json(response);
    } catch (error) {
      await transaction.rollback();
      console.log(error);
    }
  }


  async AllUsuarios(res: Response) {
    const transaction = await this.sequelize.transaction();
    try {
      const queryResult = await this.sequelize.query(
        `select us.id, us.usuario from usu_sys us `,
        {
          type: QueryTypes.SELECT,
          transaction,
        }
      );

      let response: any = { data: queryResult, status: 200 };
      response = await this.encryptionService.encryptData(response);

      await transaction.commit();
      return res.status(200).json(response);
    } catch (error) {
      await transaction.rollback();
      return res.status(500).send(error);
    }
  }

  async CrearUsaurios(datos: any, res: Response){
    let data = datos;
        let response;
        let sys = await this.usuarioSystema(data);
        
        let pass: any = await this.usuarioPass(sys, data);
    
        if (pass === true) {
          await this.usuarioInfo(sys, data);
          let dataMail: MailInterface = {
            asunto: 'Credenciales de acceso',
            correo: data.correo,
            contenido: {
              mensaje: 'Por favor, ingresa tu usuario y contraseña para acceder a la plataforma.',
              token: `<b>Usario: ${data.usuario} <br> Clave: ${data.pass}</b>`,
              usuaio: data.nombre +' '+ data.apellido1
            }
          }
          response = { data: 'Usuario registrado con exito', Status: 200 }
          await this.EniviarNotificacion(dataMail)
          response = await this.encryptionService.encryptData(response);

          return res.status(200).json(response);

        }


  }

  protected async usuarioSystema(data){

    const transaction = await this.sequelize.transaction();
    try {
      const result: any = await  this.sequelize.query( `INSERT INTO public.usu_sys (usuario, tipo) VALUES (:us, :tp) RETURNING id;`,{
          type: QueryTypes.INSERT,
          replacements: {
            us: data.usuario,
            tp: data.rol
          },
          transaction,
        }
      );
      
      const insertedId = result[0][0].id;
      await transaction.commit();
      return insertedId;
    } catch (error) {
      await transaction.rollback();
      console.log(error);
    }
  }
  
  protected async usuarioInfo(id,data){

    const transaction = await this.sequelize.transaction();
    try {
    await  this.sequelize.query(`INSERT INTO usu_info_emp
      (id_usu, nombre, apellido1, apellido2, correo)
      VALUES(:id, :nb, :app, :aps, :ml)`,{
        type: QueryTypes.INSERT,
        replacements: {
          id: id,
          nb: data.nombre,
          app: data.papellido,
          aps: data.sapellido,
          ml: data.correo
        },
        transaction,
      }
    );
    await transaction.commit();
    return true;
    } catch (error) {
      console.log(error);
    }

  }

  protected async usuarioPass(id,data) {

    const transaction = await this.sequelize.transaction();
    try {
      await this.sequelize.query( `UPDATE usu_pass SET estado=false WHERE id_usu=:us;`,{
          type: QueryTypes.UPDATE,
          replacements: {
            us: id
          },
          transaction,
      });
      await this.sequelize.query(`INSERT INTO public.usu_pass(id_usu, pass, estado) VALUES(:us,:ky, true);`,{
          type: QueryTypes.INSERT,
          replacements: {
            us: id,
            ky: data.passcryto
          },
          transaction,
      });

      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      console.log(error);
    }
  }

  protected async EniviarNotificacion(data: MailInterface){
      return this._mail.sendEmail(data);
  }

  public async usuarioEstado(data, res) {
    
    const transaction = await this.sequelize.transaction();
    try {
      await this.sequelize.query( `UPDATE usu_sys SET estado=:es WHERE id=:id;`,{
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

  async EditarUsuarios(datos: any, res: Response) {
    let data = datos;
    let response;
  
    // Actualiza la tabla de sistema (usu_sys) usando el id recibido
    let sys = await this.usuarioSystemaEditar(data);
    
    // Actualiza la contraseña, si es que se recibe un nuevo valor
    let pass: any = await this.usuarioPass(sys, data);
  
    if (pass === true) {
      // Actualiza la información personal
      await this.usuarioInfoEditar(sys, data);
      
      response = { data: 'Usuario actualizado con éxito', Status: 200 };
      response = await this.encryptionService.encryptData(response);
  
      return res.status(200).json(response);
    }
  }

  protected async usuarioSystemaEditar(data: any) {
    const transaction = await this.sequelize.transaction();
    try {
      await this.sequelize.query(
        `UPDATE public.usu_sys SET usuario = :us, tipo = :tp WHERE id = :id;`,
        {
          type: QueryTypes.UPDATE,
          replacements: {
            us: data.usuario,
            tp: data.rol,
            id: data.id  // Se debe enviar el id del usuario a editar
          },
          transaction,
        }
      );
      await transaction.commit();
      return data.id; // Retornamos el id que se utilizará en las demás actualizaciones
    } catch (error) {
      await transaction.rollback();
      console.log(error);
    }
  }


  protected async usuarioInfoEditar(id: number, data: any) {
    const transaction = await this.sequelize.transaction();
    try {
      await this.sequelize.query(
        `UPDATE usu_info_emp
         SET nombre = :nb,
             apellido1 = :app,
             apellido2 = :aps,
             correo = :ml
         WHERE id_usu = :id;`,
        {
          type: QueryTypes.UPDATE,
          replacements: {
            id: id,
            nb: data.nombre,
            app: data.papellido,
            aps: data.sapellido,
            ml: data.correo
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
  
  
  
}
