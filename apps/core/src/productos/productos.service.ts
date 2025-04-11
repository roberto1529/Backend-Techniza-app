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

      
      const MarcasQuerylist = await this.sequelize.query(`select pm.id, pm.marca, pm.estado from para_marca pm`, {
        type: QueryTypes.SELECT,
        transaction,
      }
      );
      let response: any = {
        data: {
          productos: productosQuery,
          marcas: MarcasQuery,
          marcaslist: MarcasQuerylist
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
      await this.sequelize.query(`UPDATE public.producto SET estado=:es WHERE id=:id`, {
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

  public async EditarCliente(data: Formulario, res: Response) {
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
            idm:data.marca,
            md: data.modelo,
            ds: data.descripcion,
            ct: data.costo,
            gn: data.ganancia,
            ut: data.utilidad,
            vt: data.venta,
            id: data.id 
          },
          transaction,
        }
      );

      await transaction.commit();
      response = { data: 'Producto editado con exito', Status: 200 }
      response = await this.encryptionService.encryptData(response);
      return res.status(200).json(response);
    } catch (error) {
      await transaction.rollback();
      console.log(error);
      throw error; // Lanzamos el error para que pueda manejarse en otro nivel
    }
  }

  public async Crearmarca(data: Formulario, res: Response) {

    const transaction = await this.sequelize.transaction();
    try {
      await this.sequelize.query(`INSERT INTO para_marca 
        (marca) VALUES (:mr);`, {
        type: QueryTypes.INSERT,
        replacements: {
          mr: data.marca,
        },
        transaction,
      }
      );
      await transaction.commit();
      let response: any = { data: 'Marca creada con exito', Status: 200 }
      response = await this.encryptionService.encryptData(response);
      return res.status(200).json(response);
    } catch (error) {
      await transaction.rollback();
      console.log(error);
    }
  }

  public async Editarmarca(data: Formulario, res: Response) {
    console.log('formulario', data);
    
    const transaction = await this.sequelize.transaction();
    try {
      await this.sequelize.query(`UPDATE para_marca
      SET marca= :md
      WHERE id= :id;`, {
        type: QueryTypes.UPDATE,
        replacements: {
          id: data.id,
          md: data.marca,
        },
        transaction,
      }
      );
      await transaction.commit();
      let response: any = { data: 'Marca editada con exito', Status: 200 }
      response = await this.encryptionService.encryptData(response);
      return res.status(200).json(response);
    } catch (error) {
      await transaction.rollback();

      console.log(error);
    }
  }

  public async EditarMarcaEstado(data, res) {

    const transaction = await this.sequelize.transaction();
    try {
      await this.sequelize.query(`UPDATE para_marca SET estado=:es WHERE id=:id`, {
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

  async analytics(res: Response) {
    const transaction = await this.sequelize.transaction();
    try {
      const MetricQuery = await this.sequelize.query(`SELECT 
            TO_CHAR(TO_TIMESTAMP(CONCAT(CURRENT_DATE, ' ', fm.fecha_reg), 'YYYY-MM-DD HH24:MI:SS'), 'YYYY-MM') AS mes, 
            COUNT(fm.id) AS cotizaciones, 
            SUM(fvc.total::NUMERIC) AS total_ventas
          FROM fact_maestro fm 
          JOIN usu_cliente uc ON fm.id_cliente = uc.id
          JOIN fact_venta_costo fvc ON fm.id = fvc.id_factura
          WHERE fm.estado = TRUE 
          AND DATE_TRUNC('month', TO_TIMESTAMP(CONCAT(CURRENT_DATE, ' ', fm.fecha_reg), 'YYYY-MM-DD HH24:MI:SS')) = DATE_TRUNC('month', CURRENT_DATE)
          GROUP BY mes
          ORDER BY mes;`,
        {
          type: QueryTypes.SELECT,
          transaction,
        }
      );

      const ClienteQuery = await this.sequelize.query(`select COUNT(*) as cli from usu_cliente where estado_cliente = true`, {
        type: QueryTypes.SELECT,
        transaction,
      }
      );
      
      const ProQuery= await this.sequelize.query(`select COUNT(*) as pro from producto where estado = true`, {
        type: QueryTypes.SELECT,
        transaction,
      }
      );

      let response: any = {
        data: {
          ventas: MetricQuery,
          clientes: ClienteQuery,
          productos: ProQuery
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

  async Grafics(res: Response) {
    const transaction = await this.sequelize.transaction();
    try {
      const MetricQuery = await this.sequelize.query(`SELECT 
              uc.id AS id_cliente,
              uc.nombre AS cliente,
              COUNT(fm.id) AS total_cotizaciones
          FROM fact_maestro fm
          JOIN usu_cliente uc ON fm.id_cliente = uc.id
          WHERE fm.estado = TRUE
            AND DATE_TRUNC('month', CURRENT_DATE) = DATE_TRUNC('month', TO_TIMESTAMP(CONCAT(CURRENT_DATE::text, ' ', fm.fecha_reg::text), 'YYYY-MM-DD HH24:MI:SS'))
          GROUP BY uc.id, uc.nombre
          ;`,
        {
          type: QueryTypes.SELECT,
          transaction,
        }
      );

      let response: any = {
        data: {
          datos: MetricQuery,
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
}
