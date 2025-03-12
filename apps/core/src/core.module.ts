import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { EmpleadosModule } from './empleados/empleados.module';
import { MailService } from 'apps/shared/services/mail/mail.service';
@Module({
  imports: [
     AuthModule,
     EmpleadosModule,
  ],
    controllers: [],
    providers: [],
})

export class CoreModule { }
