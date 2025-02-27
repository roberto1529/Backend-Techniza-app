import { Module } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { AuthController } from './auth.controller';
import { ValidatorSqlService } from 'apps/shared/services/Validator/injector.service';
import { EncryptionService } from 'apps/shared/services/cypress/crypto.service';
import { Auth2FA } from './services/2fa.service';
import { MailService } from 'apps/shared/services/mail/mail.service';
import { Auth2FAService } from './services/auth2fa.service';

@Module({
  controllers:[AuthController],
  providers: [AuthService, ValidatorSqlService, EncryptionService, Auth2FA, MailService, Auth2FAService]
})
export class AuthModule {}
