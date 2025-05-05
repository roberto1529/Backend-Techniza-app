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
  ) { }

  async all(res: Response) {
    const transaction = await this.sequelize.transaction();
    try {
      const DatosQuery = await this.sequelize.query(
        `select fm.id, LPAD(fm.id::text, 5, '0') AS code_fact, fm.id_cliente, uc.nombre as cliente, uc.correo, uc.direccion, uc.telefono ,fm.id_estado, pe.estado_nombre , fc.subtotal,
        fc.iva, fc.total,fm.estado,(select count(*) from fact_venta_item sf where sf.id_factura  = fm.id and sf.estado = true) as cantidad,
        (current_date::text || ' ' || fm.fecha_reg::text) as fecha_reg
        from fact_maestro fm
        join fact_venta_costo fc on fc.id_factura = fm.id
        join usu_cliente uc on uc.id = fm.id_cliente
        join para_estado pe  on pe.id  = fm.id_estado 	order by fm.id asc`,
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
    console.log(datos);
    
    let response;
    let sys = await this.Crearystema(data);
    if (sys !== null || sys !== undefined) {
      response = { data: { msj: 'Producto registrado con exito', id: sys }, Status: 200 };
      response = await this.encryptionService.encryptData(response);
      return res.status(200).json(response);
    }
  }

  protected async Crearystema(data: Formulario) {
    const transaction = await this.sequelize.transaction();
    try {
      const result = await this.sequelize.query(
        `INSERT INTO fact_maestro
        (id_cliente, id_estado, nota) VALUES(:cl, :es, :nt) RETURNING id`,
        {
          type: QueryTypes.INSERT,
          replacements: {
            cl: data.cliente,
            nt: data.nota,
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
    const transaction = await this.sequelize.transaction();
    try {
      const DatosQuery = await this.sequelize.query(
        `select fi.id_factura, fi.id_producto , p.descripcion,  fi.cantidad, p.venta as costo_uni, (CAST(p.venta AS NUMERIC) * fi.cantidad) AS subtotalItem
          from fact_venta_item fi
          join producto p on p.id = fi.id_producto
          where fi.id_factura = :id`,
        {
          type: QueryTypes.SELECT,
          replacements: { id: datos.id },
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

  public async EditarFactura(data: any, res: Response) {
    const transaction = await this.sequelize.transaction();
    try {
      // 1. Actualizar datos principales de la factura
      await this.sequelize.query(
        `UPDATE fact_maestro 
         SET id_cliente = :cl 
         WHERE id = :id`,
        {
          type: QueryTypes.UPDATE,
          replacements: {
            cl: data.cliente,
            id: data.id
          },
          transaction,
        }
      );

      // 2. Actualizar los costos (subtotal, iva, total)
      await this.actualizarCostos(data.id, data, transaction);

      // 3. Manejar los items de la factura
      await this.actualizarItemsFactura(data.id, data.productos, transaction);

      await transaction.commit();

      // Enviar respuesta de éxito
      let response: any = {
        data: {
          msj: 'Factura actualizada correctamente',
          id: data.id
        },
        Status: 200
      };
      response = await this.encryptionService.encryptData(response);
      return res.status(200).json(response);

    } catch (error) {
      await transaction.rollback();
      console.error('Error al editar factura:', error);

      // Enviar respuesta de error
      const errorResponse = {
        data: {
          msj: 'Error al actualizar la factura',
          error: error.message
        },
        Status: 500
      };
      return res.status(500).json(errorResponse);
    }
  }

  private async actualizarCostos(
    id: number,
    data: Formulario,
    transaction: any
  ): Promise<void> {
    // Verificar si ya existe un registro de costos
    const [existeCosto] = await this.sequelize.query(
      `SELECT id FROM fact_venta_costo WHERE id_factura = :id LIMIT 1`,
      {
        type: QueryTypes.SELECT,
        replacements: { id },
        transaction,
      }
    );

    if (existeCosto) {
      // Actualizar registro existente
      await this.sequelize.query(
        `UPDATE fact_venta_costo 
         SET subtotal = :sb, iva = :iv, total = :tl 
         WHERE id_factura = :id`,
        {
          type: QueryTypes.UPDATE,
          replacements: {
            sb: data.subtotal.toString(),
            iv: data.iva.toString(),
            tl: data.total.toString(),
            id
          },
          transaction,
        }
      );
    } else {
      // Crear nuevo registro
      await this.sequelize.query(
        `INSERT INTO fact_venta_costo 
         (id_factura, subtotal, iva, total) 
         VALUES(:id, :sb, :iv, :tl)`,
        {
          type: QueryTypes.INSERT,
          replacements: {
            id,
            sb: data.subtotal.toString(),
            iv: data.iva.toString(),
            tl: data.total.toString()
          },
          transaction,
        }
      );
    }
  }

  private async actualizarItemsFactura(
    idFactura: number,
    items: any[],
    transaction: any
  ): Promise<void> {
    // 1. Obtener items actuales
    const itemsActuales = await this.sequelize.query(
      `SELECT id, id_producto FROM fact_venta_item 
       WHERE id_factura = :idFactura`,
      {
        type: QueryTypes.SELECT,
        replacements: { idFactura },
        transaction,
      }
    );

    // 2. Identificar items a eliminar
    const idsActuales = itemsActuales.map((item: any) => item.id_producto);
    const idsNuevos = items.map((item: any) => item.producto);

    const itemsAEliminar: any = itemsActuales.filter(
      (item: any) => !idsNuevos.includes(item.id_producto)
    );

    // Eliminar items que ya no están
    for (const item of itemsAEliminar) {
      await this.sequelize.query(
        `DELETE FROM fact_venta_item WHERE id = :id`,
        {
          type: QueryTypes.DELETE,
          replacements: { id: item.id },
          transaction,
        }
      );
    }

    // 3. Actualizar/insertar items
    for (const item of items) {
      const itemExistente: any = itemsActuales.find(
        (i: any) => i.id_producto === item.producto
      );

      if (itemExistente) {
        // Actualizar cantidad
        await this.sequelize.query(
          `UPDATE fact_venta_item 
           SET cantidad = :cantidad 
           WHERE id = :id`,
          {
            type: QueryTypes.UPDATE,
            replacements: {
              cantidad: item.cantidad,
              id: itemExistente.id
            },
            transaction,
          }
        );
      } else {
        // Insertar nuevo item
        await this.sequelize.query(
          `INSERT INTO fact_venta_item 
           (id_factura, id_producto, cantidad) 
           VALUES(:idFactura, :idProducto, :cantidad)`,
          {
            type: QueryTypes.INSERT,
            replacements: {
              idFactura,
              idProducto: item.producto,
              cantidad: item.cantidad
            },
            transaction,
          }
        );
      }
    }
  }

  // seccion de machotes 

  async allMachote(res: Response) {
    const transaction = await this.sequelize.transaction();
    try {
      const DatosQuery = await this.sequelize.query(
        `select pc.id, pc.nombre, pc.id_cliente, uc.nombre as cliente, (select count(*) from produto_combo_item pi       
		    join producto p on p.id = pi.id_producto
        where pi.id_combo = pc.id) as conteo, pc.estado
        from produto_combo pc
        join usu_cliente uc on uc.id = pc.id_cliente
        where pc.estado = true;`,
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

  async ProductosPlantilla(data: any, res: Response) {
    const transaction = await this.sequelize.transaction();
    try {
      const DatosQuery = await this.sequelize.query(
        `select p.modelo, p.descripcion, pm.marca, pci.cantidad 
      from producto p 
      join para_marca pm on pm.id  = p.id_marca 
      join produto_combo_item pci on pci.id_producto = p.id
      join produto_combo pc  on pci.id_combo  = pc.id
      where pc.id  = :id and p.estado = true;`,
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

  async CargaDatosPlantilla(datos: Formulario, res: Response) {
    const transaction = await this.sequelize.transaction();
    try {
      const DatosQuery = await this.sequelize.query(`select pc.id, pc.nombre, pc.id_cliente, uc.nombre as cliente, (select count(*) from produto_combo_item pi       
		    join producto p on p.id = pi.id_producto
        where pi.id_combo = pc.id) as conteo, pc.estado
        from produto_combo pc
        join usu_cliente uc on uc.id = pc.id_cliente
        where pc.id  = :id and  pc.estado = true;`,
        {
          type: QueryTypes.SELECT,
          replacements: { id: datos.id },
          transaction,
        },
      );

      const DatosQueryProd = await this.sequelize.query(`select p.id as id_producto, p.modelo as producto, pci.cantidad
        from produto_combo_item pci 
        join producto p on pci.id_producto = p.id
        where  pci.id_combo = :id;`,
        {
          type: QueryTypes.SELECT,
          replacements: { id: datos.id },
          transaction,
        },
      );

      let response: any = {
        data: {
          datos: DatosQuery,
          productos: DatosQueryProd
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

  async CrearPlantilla(data: any, res: Response) {
    const transaction = await this.sequelize.transaction();
    let response;
    try {
      const result = await this.sequelize.query(
        `INSERT INTO produto_combo (nombre, id_cliente) VALUES(:nm, :cl) RETURNING id`,
        {
          type: QueryTypes.INSERT,
          replacements: {
            nm: data.Nonbre,
            cl: data.cliente,
          },
          transaction,
        },
      );
      const id = result[0][0].id;

      console.log('Elementos en productos', data.productos);
      await this.FactitemPlantilla(id, data.productos, transaction);

      await transaction.commit();
      response = { data: { msj: 'Plantilla registrada con exito' }, Status: 200 };
      response = await this.encryptionService.encryptData(response);
      return res.status(200).json(response);
    } catch (error) {
      await transaction.rollback();
      console.log(error);
    }
  }

  private async FactitemPlantilla(id: number, items: any, transaction: any): Promise<void> {
    try {
      for (const dta of items) {
        await this.sequelize.query(
          `INSERT INTO produto_combo_item (id_producto, id_combo, cantidad) VALUES(:ip, :ic, :ct);`,
          {
            type: QueryTypes.INSERT,
            replacements: {
              ip: dta.producto,
              ic: id,
              ct: dta.cantidad,
            },
            transaction,
          },
        );
      }
    } catch (error) {
      throw error; // para que el rollback ocurra en el bloque principal
    }
  }

  async EditarPlantilla(data: any, res: Response) {
    const transaction = await this.sequelize.transaction();
    let response;
    try {
      // 1. Actualizar nombre y cliente
      await this.sequelize.query(
        `UPDATE produto_combo SET nombre = :nm, id_cliente = :cl WHERE id = :id`,
        {
          type: QueryTypes.UPDATE,
          replacements: {
            nm: data.Nonbre,
            cl: data.cliente,
            id: data.id,
          },
          transaction,
        },
      );

      // 2. Eliminar ítems anteriores
      await this.sequelize.query(
        `DELETE FROM produto_combo_item WHERE id_combo = :id`,
        {
          type: QueryTypes.DELETE,
          replacements: { id: data.id },
          transaction,
        },
      );

      // 3. Insertar los nuevos ítems
      await this.FactitemPlantilla(data.id, data.productos, transaction);

      // 4. Confirmar transacción
      await transaction.commit();
      response = { data: { msj: 'Plantilla actualizada con éxito' }, Status: 200 };
      response = await this.encryptionService.encryptData(response);
      return res.status(200).json(response);
    } catch (error) {
      await transaction.rollback();
      console.log(error);
      return res.status(500).json({ error: 'Error al actualizar plantilla' });
    }
  }

    public async UpdateEstadoPlantilla(data, res) {
    const transaction = await this.sequelize.transaction();
    try {
      await this.sequelize.query(
        `UPDATE produto_combo SET estado=:es WHERE id=:id`,
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

}
