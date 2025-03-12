import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { EmpleadosModule } from './empleados/empleados.module';
import { ClientesModule } from './clientes/clientes.module';

@Module({
  imports: [
     AuthModule,
     EmpleadosModule,
     ClientesModule
  ],
    controllers: [],
    providers: [],
})

export class CoreModule { }
