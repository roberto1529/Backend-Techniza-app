import { Global, Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as confMail from '../../config/mail_config.json'; // Importar archivo JSON
import { MailBodyData, MailInterface } from 'apps/core/src/auth/types/auth.interfaces';
@Global() 
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
        console.log(error);
        return error 
    }

  }
  
  private BodyMail(contenido: MailBodyData) {

    let mensaje = ``;

    let html = ` <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');
            *{
              font-family: "Poppins", serif;
            }
            .fondo {
              position: relative;
              background: url('https://images.pexels.com/photos/6474351/pexels-photo-6474351.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1');
              background-size: cover;
              background-repeat: no-repeat;
              height: auto;
              padding: 1.5rem;
            }

            /* Aplica el desenfoque solo al fondo */
            .fondo::before {
              content: "";
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: inherit;
              backdrop-filter: blur(1.5px);
              z-index: -1;
            }

            /* Mantiene la tarjeta sin efecto de desenfoque */
            .card {
              position: relative;
              background: white;
              margin: 1rem;
              padding: 1.5rem;
              border-radius: 13px;
            }
            .content{
              text-align: center;
              font-size: 16px;
              margin-bottom: 2.5rem;
            }
            .dinamicKey{
              display: block;
              margin: auto;
              text-align: center;
              background: black;
              width: auto;
              border-radius: 10px;
              color: white;
              font-weight: 600;
            }
            .footer{
              margin-top: 2.5rem;
              font-size: 10px;
              text-align: center;
            }
        </style>
      </head>
      <body>
        <div class="fondo">
          <div class="card">

            <img src="https://techniza.com/wp-content/uploads/2022/03/techniza.png" 
            style="width: 30%; display: block; margin: auto;" alt="">
            <div class="content">
              Hola <b>${contenido.usuaio}</b>, ${contenido.mensaje} </div>
            <div class="dinamicKey">
            ${contenido.token}
            </div>
            <div class="footer">© ${new Date().getFullYear()} TECHNIZA. Todos los derechos reservados.</div>
            </div>
            
        </div>
        </div>
      </body>
      </html>`;

      
    return html
  }
}
