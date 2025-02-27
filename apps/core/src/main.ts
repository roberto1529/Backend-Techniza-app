import { NestFactory } from '@nestjs/core';
import { CoreModule } from './core.module';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(CoreModule);

  // Configurar el tamaño máximo del cuerpo a 50mb
  app.use(bodyParser.json()); 
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
  app.enableCors({
      origin: '*',  // Asegúrate de que el dominio y puerto coincidan con tu aplicación Angular
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
