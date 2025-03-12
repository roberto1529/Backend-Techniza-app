import { Global, Injectable } from '@nestjs/common';
import * as CryptoJS from 'crypto-js';
@Global()
@Injectable()
export class EncryptionService {

  // Clave secreta para AES (debe coincidir con la clave usada en Angular)
  private secretKey: string = 'SystemOneCore2025**';

  constructor() {}

  // Método para encriptar datos
  encryptData(data: any): string {
    const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), this.secretKey).toString();
    return encrypted;
  }

  // Método para desencriptar datos
  decryptData(encryptedData: string): any {
    const bytes = CryptoJS.AES.decrypt(encryptedData, this.secretKey);
    const decryptedData = bytes.toString(CryptoJS.enc.Utf8);  // Convertir de vuelta a UTF-8
    return JSON.parse(decryptedData);  // Convertir el string a JSON y devolverlo
  }
}
