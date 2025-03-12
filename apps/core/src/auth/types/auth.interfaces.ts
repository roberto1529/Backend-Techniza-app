export interface AuthInterface {
     usuario: string;
     passcryto: string;
     token?: number;
}

export interface MailInterface {
     correo: string,
     asunto: string,
     contenido: {
          token: any;
          usuaio: string;
          mensaje: string;
     }
}
export interface MailBodyData {

     token: number;
     usuaio: string;
     mensaje: string;
}