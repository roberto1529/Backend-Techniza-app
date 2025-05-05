export interface Formulario {
  
    id?:number;
    buscar?:string;
    cliente:number;
    productos:DataProductos;
    subtotal:number;
    iva:number;
    total:number;
    idempleado:number;
    nota:Text;
    estado?:boolean;
}


export interface DataProductos {
  
  producto:number;
  cantidad:number;
  subtotalItem:number;
  
}

