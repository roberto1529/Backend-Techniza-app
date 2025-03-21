import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { EmpleadosModule } from './empleados/empleados.module';
import { ClientesModule } from './clientes/clientes.module';
import { ProductosModule } from './productos/productos.module';
import { FacturasModule } from './facturas/facturas.module';

@Module({
  imports: [
     AuthModule,
     EmpleadosModule,
     ClientesModule,
     ProductosModule,
     FacturasModule
  ],
    controllers: [],
    providers: [],
})

export class CoreModule { }
