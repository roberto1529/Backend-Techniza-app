import { Body, Controller, Get, Post, Put, Res } from '@nestjs/common';
import { EmpleadosService } from './empleados.service';
import { Response } from 'express';
import { EncryptionService } from 'apps/shared/services/cypress/crypto.service';

@Controller('empleados')
export class EmpleadosController {
  constructor(private readonly empleadosService: EmpleadosService, 
              private readonly cryptoService: EncryptionService) {}

  @Get('')
  public AllEmplados(@Res() res: Response){
    return this.empleadosService.allEmpleados(res);
  }

  @Get('usuarios')
  public AllUsuarios(@Res() res: Response){
    return this.empleadosService.AllUsuarios(res);
  }

  @Post('CrearUsu')
  public async Crearusuario(@Body() data:any,@Res() res: Response){
    const datos = await this.cryptoService.decryptData(data.data);
    return this.empleadosService.CrearUsaurios(datos, res);
  }

  @Put('UpdateEstado')
  public async UpdateEstado(@Body() data:any,@Res() res: Response){
    const datos = await this.cryptoService.decryptData(data.data);
    return this.empleadosService.usuarioEstado(datos, res);
  }

  @Put('ActualizarUsu')
  public async ActualizarUsu(@Body() data:any,@Res() res: Response){
    const datos = await this.cryptoService.decryptData(data.data);
    return this.empleadosService.EditarUsuarios(datos, res);
  }
}
