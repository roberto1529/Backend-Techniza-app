import { Module } from '@nestjs/common';
import { ValidatorSqlService } from 'apps/shared/services/Validator/injector.service';
import { EncryptionService } from 'apps/shared/services/cypress/crypto.service';
import { DatabaseModule } from 'apps/shared/database/conected.module';
import { MailService } from 'apps/shared/services/mail/mail.service';
import { FacturasService } from './facturas.service';
import { FacturasController } from './facturas.controller';



@Module({
  imports: [
    DatabaseModule,
  ],
  controllers: [FacturasController],
  providers: [FacturasService, ValidatorSqlService, EncryptionService, MailService],
})
export class FacturasModule {}
