import { NestFactory } from '@nestjs/core';
import { CoreModule } from './core.module';
import * as bodyParser from 'body-parser';
import * as fs from 'fs';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  // Configuración SSL
  let httpsOptions = null;
  try {
    httpsOptions = {
      key: fs.readFileSync(process.env.SSL_KEY_PATH || '/app/certs/privkey.pem'),
      cert: fs.readFileSync(process.env.SSL_CERT_PATH || '/app/certs/fullchain.pem'),
    };
    Logger.log('Certificados SSL cargados correctamente', 'Bootstrap');
  } catch (error) {
    Logger.warn(
      'No se encontraron certificados SSL, ejecutando en modo HTTP',
      'Bootstrap',
    );
  }

  // Crear aplicación con opciones HTTPS si están disponibles
  const app = await NestFactory.create(
    CoreModule,
    httpsOptions ? { httpsOptions } : {},
  );

  // Configuración del body parser
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  // Configuración CORS más segura
  app.enableCors({
    origin: [
      'https://admin.techniza.mx',
      'http://admin.techniza.mx',
      'http://localhost:4200', // Para desarrollo
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type,Authorization',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(
    `Servidor NestJS ejecutándose en ${httpsOptions ? 'HTTPS' : 'HTTP'}://0.0.0.0:${port}`,
    'Bootstrap',
  );
}
bootstrap();