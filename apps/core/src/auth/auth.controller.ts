import { Body, Controller, Post, Res } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { EncryptionService } from 'apps/shared/services/cypress/crypto.service';
import { Response } from 'express';
import { Auth2FAService } from './services/auth2fa.service';

@Controller('auth/v1/')
export class AuthController {
  constructor(
    private readonly service: AuthService,
    private cryptoService: EncryptionService,
    private _2fa: Auth2FAService,
  ) {}

  @Post('')
  async Login(@Body() datos: any, @Res() res: Response) {
    const data = this.cryptoService.decryptData(datos.data);
    return this.service.auth_validar_usuarios(data, res); // Usa los datos desencriptados
  }

  @Post('verificar_2fa')
  async auth2fa(@Body() datos: any, @Res() res: Response) {
    const data = this.cryptoService.decryptData(datos.data);
    return this._2fa.VerificarToke(data, res);
  }
}
