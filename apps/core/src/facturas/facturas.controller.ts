import { Body, Controller, Get, Post, Put, Res } from '@nestjs/common';

import { Response } from 'express';
import { EncryptionService } from 'apps/shared/services/cypress/crypto.service';
import { FacturasService } from './facturas.service';

@Controller('facturas')
export class FacturasController {
  constructor(private readonly service: FacturasService, 
              private readonly cryptoService: EncryptionService) {}

  @Get('')
  public All(@Res() res: Response){
    return this.service.all(res);
  }

  @Post('facturdos')
  public async ProductosVendidos(@Body() data:any, @Res() res: Response){
    const datos = await this.cryptoService.decryptData(data.data);
    return this.service.ProductosVendidos(datos, res);
  }

  @Post('CrearDatos')
  public async Crear(@Body() data:any,@Res() res: Response){
    const datos = await this.cryptoService.decryptData(data.data);
    return this.service.Crear(datos, res);
  }

  @Post('CargadorProductos')
  public async CargaDatos(@Body() data:any,@Res() res: Response){
    const datos = await this.cryptoService.decryptData(data.data);
    return this.service.CargaDatos(datos, res);
  }
  @Put('UpdateEstado')
  public async Editar(@Body() data:any,@Res() res: Response){
    const datos = await this.cryptoService.decryptData(data.data);
    return this.service.Estado(datos, res);
  }

  @Put('ActualizarDatos')
  public async ActualizarEstado(@Body() data:any,@Res() res: Response){
    const datos = await this.cryptoService.decryptData(data.data);
    return this.service.EditarFactura(datos, res);
  }
}
