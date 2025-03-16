import { Injectable } from '@nestjs/common';
import { EncryptionService } from 'apps/shared/services/cypress/crypto.service';
import { ValidatorSqlService } from 'apps/shared/services/Validator/injector.service';
import { Sequelize } from 'sequelize-typescript'; // O desde '@nestjs/sequelize', según tu configuración
import { QueryTypes } from 'sequelize';
import { Response } from 'express';
import { InjectConnection } from '@nestjs/sequelize';
import { MailService } from 'apps/shared/services/mail/mail.service';
import { MailInterface } from '../auth/types/auth.interfaces';
import { Formulario } from './types/dto.formulario';


@Injectable()
export class ProductosService {
  constructor(
    @InjectConnection() private readonly sequelize: Sequelize, // Inyección correcta de la conexión
    private readonly validatorSqlService: ValidatorSqlService,
    private readonly encryptionService: EncryptionService,
    private readonly _mail: MailService
  ) { }

  async all(res: Response) {
    const transaction = await this.sequelize.transaction();
    try {
      const productosQuery = await this.sequelize.query(`select p.id, p.id_marca, pm.marca ,p.modelo, p.descripcion, p.costo, p.ganacia as ganancia, p.utilidad,p.venta, p.estado, 
      (current_date::text || ' ' || p.fecha_reg::text) as fecha_reg
      from producto p
      join para_marca pm on pm.id = p.id_marca and pm.estado = true`,
        {
          type: QueryTypes.SELECT,
          transaction,
        }
      );

      const MarcasQuery = await this.sequelize.query(`select pm.id, pm.marca from para_marca pm where pm.estado = true`, {
        type: QueryTypes.SELECT,
        transaction,
      }
      );

      let response: any = {
        data: {
          productos: productosQuery,
          marcas: MarcasQuery
        }, status: 200
      };
      response = await this.encryptionService.encryptData(response);

      await transaction.commit();
      return res.status(200).json(response);
    } catch (error) {
      await transaction.rollback();
      console.log(error);
    }
  }


  async Crear(datos: Formulario, res: Response) {
    let data = datos;
    let response;
    let sys = await this.Crearystema(data);
    if (sys === true) {
      response = { data: 'Producto registrado con exito', Status: 200 }
      response = await this.encryptionService.encryptData(response);
      return res.status(200).json(response);
    }
  }

  protected async Crearystema(data: Formulario) {

    const transaction = await this.sequelize.transaction();
    try {
      await this.sequelize.query(`INSERT INTO public.producto
        (id_marca, modelo, descripcion, costo, ganacia, utilidad, venta)
        VALUES(:ma,:ml,:de,:co,:ga,:ut,:ve);`, {
        type: QueryTypes.INSERT,
        replacements: {
          ma: data.marca,
          ml: data.modelo,
          de: data.descripcion,
          co: data.costo,
          ga: data.ganancia,
          ut: data.utilidad,
          ve: data.venta,
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
      await this.sequelize.query(`UPDATE usu_cliente SET estado_cliente=:es WHERE id=:id;`, {
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
