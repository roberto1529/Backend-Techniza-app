import { Module } from '@nestjs/common';
import { ValidatorSqlService } from 'apps/shared/services/Validator/injector.service';
import { EncryptionService } from 'apps/shared/services/cypress/crypto.service';
import { DatabaseModule } from 'apps/shared/database/conected.module';
import { MailService } from 'apps/shared/services/mail/mail.service';
import { ProductosService } from './productos.service';
import { ProductosController } from './productos.controller';


@Module({
  imports: [
    DatabaseModule,
  ],
  controllers: [ProductosController],
  providers: [ProductosService, ValidatorSqlService, EncryptionService, MailService],
})
export class ProductosModule {}
