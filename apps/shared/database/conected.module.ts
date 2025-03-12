import { Global, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import * as conf from '../../shared/config/onecore.json'; // Importar archivo JSON

@Global() 
@Module({
  imports: [
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
})
export class DatabaseModule {}
