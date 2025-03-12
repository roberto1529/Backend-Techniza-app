import { Module } from '@nestjs/common';
import { ValidatorSqlService } from 'apps/shared/services/Validator/injector.service';
import { EncryptionService } from 'apps/shared/services/cypress/crypto.service';
import { DatabaseModule } from 'apps/shared/database/conected.module';
import { MailService } from 'apps/shared/services/mail/mail.service';
import { ClientesController } from './clientes.controller';
import { ClientesService } from './clientes.service';

@Module({
  imports: [
    DatabaseModule,
  ],
  controllers: [ClientesController],
  providers: [ClientesService, ValidatorSqlService, EncryptionService, MailService],
})
export class ClientesModule {}
