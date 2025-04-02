import { Body, Controller, Get, Post, Put, Res } from '@nestjs/common';

import { Response } from 'express';
import { EncryptionService } from 'apps/shared/services/cypress/crypto.service';
import { ProductosService } from './productos.service';

@Controller('productos')
export class ProductosController {
  constructor(private readonly service: ProductosService, 
              private readonly cryptoService: EncryptionService) {}

  @Get('')
  public All(@Res() res: Response){
    return this.service.all(res);
  }

  @Post('CrearDatos')
  public async Crear(@Body() data:any,@Res() res: Response){
    const datos = await this.cryptoService.decryptData(data.data);
    return this.service.Crear(datos, res);
  }

  @Put('UpdateEstado')
  public async Editar(@Body() data:any,@Res() res: Response){
    const datos = await this.cryptoService.decryptData(data.data);
    return this.service.Estado(datos, res);
  }

  @Put('ActualizarDatos')
  public async ActualizarEstado(@Body() data:any,@Res() res: Response){
    const datos = await this.cryptoService.decryptData(data.data);
    return this.service.EditarCliente(datos, res);
  }

  @Post('CrearMarca')
  public async CrearMarca(@Body() data:any,@Res() res: Response){
    const datos = await this.cryptoService.decryptData(data.data);
    return this.service.Crearmarca(datos, res);
  }

  @Put('EditarMarca')
  public async EditarMarca(@Body() data:any,@Res() res: Response){
    const datos = await this.cryptoService.decryptData(data.data);
    return this.service.Editarmarca(datos, res);
  }

  @Put('EditarMarcaEstado')
  public async EditarMarcaEstado(@Body() data:any,@Res() res: Response){
    const datos = await this.cryptoService.decryptData(data.data);
    return this.service.EditarMarcaEstado(datos, res);
  }
}
