import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { EmpleadosService } from './empleados.service';
import { EmpleadosController } from './empleados.controller';
import { ValidatorSqlService } from 'apps/shared/services/Validator/injector.service';
import { EncryptionService } from 'apps/shared/services/cypress/crypto.service';
import { DatabaseModule } from 'apps/shared/database/conected.module';
import { MailService } from 'apps/shared/services/mail/mail.service';

@Module({
  imports: [
    DatabaseModule,
  ],
  controllers: [EmpleadosController],
  providers: [EmpleadosService, ValidatorSqlService, EncryptionService, MailService],
})
export class EmpleadosModule {}
