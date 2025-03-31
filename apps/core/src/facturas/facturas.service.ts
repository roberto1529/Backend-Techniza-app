import { Injectable } from '@nestjs/common';
import { EncryptionService } from 'apps/shared/services/cypress/crypto.service';
import { ValidatorSqlService } from 'apps/shared/services/Validator/injector.service';
import { Sequelize } from 'sequelize-typescript'; // O desde '@nestjs/sequelize', según tu configuración
import { QueryTypes } from 'sequelize';
import { Response } from 'express';
import { InjectConnection } from '@nestjs/sequelize';
import { MailService } from 'apps/shared/services/mail/mail.service';
import { MailInterface } from '../auth/types/auth.interfaces';
import { DataProductos, Formulario } from './types/dto.formulario';

@Injectable()
export class FacturasService {
  constructor(
    @InjectConnection() private readonly sequelize: Sequelize, // Inyección correcta de la conexión
    private readonly validatorSqlService: ValidatorSqlService,
    private readonly encryptionService: EncryptionService,
    private readonly _mail: MailService,
  ) {}

  async all(res: Response) {
    const transaction = await this.sequelize.transaction();
    try {
      const DatosQuery = await this.sequelize.query(
        `select fm.id, fm.id_cliente, uc.nombre as cliente, uc.correo, uc.direccion, uc.telefono ,fm.id_estado, pe.estado_nombre , fc.subtotal, fc.iva, fc.total,fm.estado,
      (select count(*) from fact_venta_item sf where sf.id_factura  = fm.id and sf.estado = true) as cantidad,
      (current_date::text || ' ' || fm.fecha_reg::text) as fecha_reg
      from fact_maestro fm
      join fact_venta_costo fc on fc.id_factura = fm.id
      join usu_cliente uc on uc.id = fm.id_cliente
      join para_estado pe  on pe.id  = fm.id_estado;`,
        {
          type: QueryTypes.SELECT,
          transaction,
        },
      );

      const SubQuery = await this.sequelize.query(
        `select pe.id, pe.estado from para_estado pe where pe.estado = true;`,
        {
          type: QueryTypes.SELECT,
          transaction,
        },
      );

      const SubCliQuery = await this.sequelize.query(
        `select uc.id,uc.nombre from usu_cliente uc where uc.estado_cliente = true;`,
        {
          type: QueryTypes.SELECT,
          transaction,
        },
      );

      const SubProQuery = await this.sequelize.query(
        `select p.id, concat(p.modelo,'-', pm.marca) as modelo, p.modelo as modelos, p.descripcion, pm.marca, p.venta as precio from producto p join para_marca pm on pm.id  = p.id_marca  where p.estado  = true;`,
        {
          type: QueryTypes.SELECT,
          transaction,
        },
      );

      let response: any = {
        data: {
          datos: DatosQuery,
          estados: SubQuery,
          clientes: SubCliQuery,
          productos: SubProQuery,
        },
        status: 200,
      };
      response = await this.encryptionService.encryptData(response);

      await transaction.commit();
      return res.status(200).json(response);
    } catch (error) {
      await transaction.rollback();
      console.log(error);
    }
  }

  async ProductosVendidos(data: any, res: Response) {
    const transaction = await this.sequelize.transaction();
    try {
      const DatosQuery = await this.sequelize.query(
        `select p.modelo, p.descripcion, pm.marca, fi.cantidad 
      from producto p 
      join para_marca pm on pm.id  = p.id_marca 
      join fact_venta_item fi on fi.id_producto = p.id
      where fi.id_factura  = :id and p.estado = true;`,
        {
          type: QueryTypes.SELECT,
          replacements: {
            id: data.id,
          },
          transaction,
        },
      );

      let response: any = {
        data: {
          datos: DatosQuery,
        },
        status: 200,
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
    if (sys !== null || sys !== undefined) {
      response = { data:{msj: 'Producto registrado con exito', id: sys }, Status: 200 };
      response = await this.encryptionService.encryptData(response);
      return res.status(200).json(response);
    }
  }

  protected async Crearystema(data: Formulario) {
    const transaction = await this.sequelize.transaction();
    try {
      const result = await this.sequelize.query(
        `INSERT INTO fact_maestro
        (id_cliente, id_estado) VALUES(:cl, :es) RETURNING id`,
        {
          type: QueryTypes.INSERT,
          replacements: {
            cl: data.cliente,
            es: 1,
          },
          transaction,
        },
      );
      const id = result[0][0].id;
      await transaction.commit();
      await this.Factitem(id, data.productos);
      await this.FactGastos(id, data);

      
      return id;
    } catch (error) {
      await transaction.rollback();
      console.log(error);
    }
  }

  private async Factitem(id: number, items: any): Promise<void> {
    const transaction = await this.sequelize.transaction();
    try {
      for (const dta of items) {
        await this.sequelize.query(
          ` INSERT INTO fact_venta_item (id_factura, id_producto, cantidad) VALUES(:fa, :pr, :ct);`,
          {
            type: QueryTypes.INSERT,
            replacements: {
              fa: id,
              pr: dta.producto,
              ct: dta.cantidad,
            },
            transaction,
          },
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.log(error);
    }
  }

  private async FactGastos(id: number, data: Formulario): Promise<void> {
    const transaction = await this.sequelize.transaction();
    try {
      
        await this.sequelize.query(
          `INSERT INTO public.fact_venta_costo (id_factura, subtotal, iva, total) 
          VALUES(:id, :sb, :iv, :tl);`,
          {
            type: QueryTypes.INSERT,
            replacements: {
              id: id,
              sb: data.subtotal.toString(),
              iv: data.iva.toString(),
              tl: data.total.toString(),
            },
            transaction,
          },
        );
      

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.log(error);
    }
  }

  public async Estado(data, res) {
    const transaction = await this.sequelize.transaction();
    try {
      await this.sequelize.query(
        `UPDATE public.producto SET estado=:es WHERE id=:id`,
        {
          type: QueryTypes.UPDATE,
          replacements: {
            es: data.estado,
            id: data.id,
          },
          transaction,
        },
      );

      let response: any = { data: 'Estado actulizado con exito.', status: 200 };
      response = await this.encryptionService.encryptData(response);

      await transaction.commit();
      return res.status(200).json(response);
    } catch (error) {
      await transaction.rollback();
      console.log(error);
    }
  }

  async CargaDatos(datos: Formulario, res: Response) {
    let data = datos;
    let response;
    let sys = await this.Crearystema(data);
    if (sys !== null || sys !== undefined) {
      response = { data:{msj: 'Producto registrado con exito', id: sys }, Status: 200 };
      response = await this.encryptionService.encryptData(response);
      return res.status(200).json(response);
    }
  }

  public async EditarCliente(data: any, res: Response) {
    const transaction = await this.sequelize.transaction();
    let response;
    try {
      await this.sequelize.query(
        `UPDATE producto
          SET id_marca=:idm, 
              modelo=:md, 
              descripcion=:ds, 
              costo=:ct, 
              ganacia=:gn, 
              utilidad=:ut, 
              venta=:vt
          WHERE id=:id;`,
        {
          type: QueryTypes.UPDATE,
          replacements: {
            idm: data.marca,
            md: data.modelo,
            ds: data.descripcion,
            ct: data.costo,
            gn: data.ganancia,
            ut: data.utilidad,
            vt: data.venta,
            id: data.id,
          },
          transaction,
        },
      );

      await transaction.commit();
      response = { data: 'Producto editado con exito', Status: 200 };
      response = await this.encryptionService.encryptData(response);
      return res.status(200).json(response);
    } catch (error) {
      await transaction.rollback();
      console.log(error);
      throw error; // Lanzamos el error para que pueda manejarse en otro nivel
    }
  }
}
