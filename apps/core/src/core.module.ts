import { Module } from '@nestjs/common';
import { CoreController } from './core.controller';
import { AuthModule } from './auth/auth.module';
import { SequelizeModule } from '@nestjs/sequelize';
import * as conf from '../../shared/config/onecore.json'; // Importar archivo JSON
@Module({
  imports: [
    AuthModule,
    SequelizeModule.forRoot({
      dialect: 'postgres',  // Asegúrate de especificar correctamente el dialecto
      host: conf.host,
      port: conf.port,
      username: conf.username,
      password: conf.password,
      database: conf.database,
      autoLoadModels: conf.autoLoadModels,
      synchronize: conf.synchronize,
      logging: true,
    }),
  ],
  controllers: [CoreController],
  providers: [],
})

export class CoreModule {}
