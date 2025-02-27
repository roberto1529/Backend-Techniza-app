import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as confMail from '../../config/mail_config.json'; // Importar archivo JSON
import { MailBodyData, MailInterface } from 'apps/core/src/auth/types/auth.interfaces';

@Injectable()
export class MailService {
    private transportador: nodemailer.Transporter;
  constructor() {
    this.transportador = nodemailer.createTransport({
        service: 'zoho',
        host:confMail.host,
        port: confMail.port,
        secure: true,
        auth: {
            user: confMail.auth.user, pass:  confMail.auth.pass, 
        }
    });
  }

  async sendEmail(data: any) {
    try {
      let body = {
        from: confMail.auth.user, // Remitente
        to: data.correo, // Destinatario
        subject: data.asunto, // Asunto del correo
        html: await this.BodyMail(data.contenido),

    };
    await this.transportador.sendMail(body);
    // Agrega un pequeño retraso entre envíos
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1000 milisegundos = 1 segundo

    // Cerrar la conexión después de enviar el correo electrónico
    this.transportador.close();
    } catch (error) {
        return error
        console.log(error);
        
    }

  }
  
  private BodyMail(contenido: MailBodyData) {
    let html  = ` <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            
          .card{
            position: relative; 
            background: white;
            margin: 3.5rem;
            width: 400px;
            height: auto;
            border-radius: 17px;
            border:2px solid #034894;
            overflow: hidden;
          }
          .header {
            background-color: #034894;
            color: #ffffff;
            text-align: center;
            font-size: 24px;
            padding: 14px;
            border-radius: 13px 13px 1px 1px ;
          }
          .content {
            padding: 20px;
            color: #333333;
            line-height: 1.5;
            text-align: justify;
            font-size: 15px;
            font-weight: 500;
          }
          .dinamicKey{
            display: block;
            margin: auto;
            background: #034894;
            color: white;
            width: 125px;
            height: 40px;
            border-radius: 9px;
            text-align: center;
            font-size: 25px;
            font-weight: 600;
            padding-top: 6px;
            margin-bottom: 1rem;
          }
          .ley{
            position: absolute; /* Ancla el pie al final del contenedor padre */
            bottom: 30px;
            font-size: 9px;
            color: lightgray;
            margin: 1rem;
            text-align: justify;
          }
          .footer {
            position: absolute; /* Ancla el pie al final del contenedor padre */
            bottom: 0;
            left: 0;
            width: 100%;
            background-color: #f4f4f4;
            text-align: center;
            font-size: 12px;
            color: #888888;
            padding: 10px;
            border-radius: 0 0 13px 13px;
          }
          a {
            color: #007BFF;
            text-decoration: none;
          }
        </style>
      </head>
      <body>

        <div class="card">
            <div class="header">ONECORE</div>
            <div class="content">Hola ${contenido.usuaio}
            Somos Onecore. Te enviamos tu clave dinámica ${contenido.token}. Por favor, ingrésala en el sistema para acceder al ERP.</div>
            <div class="dinamicKey">
                    ${contenido.token}
            </div>
            <div class="ley">En cumplimiento con nuestra política de privacidad y protección de datos, le informamos que los correos electrónicos enviados con claves dinámicas son estrictamente confidenciales y están destinados únicamente al uso personal del destinatario. Estas claves no deben ser compartidas con terceros bajo ninguna circunstancia. El uso indebido de esta información es responsabilidad exclusiva del usuario, eximiendo a nuestra empresa de cualquier consecuencia derivada de dicha acción.
            </div>
            <div class="footer">© ${new Date().getFullYear()} OneCore. Todos los derechos reservados.</div>
        </div>
        <table>
          <tr>
            
          </tr>
          <tr>
           
          </tr>
          <tr>
            
          </tr>
        </table>
      </body>
      </html>`;
      
    return html
  }
}
