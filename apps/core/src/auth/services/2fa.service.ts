import { Injectable } from '@nestjs/common';

@Injectable()
export class Auth2FA {
  constructor(){}

  public TokenGenator(): number{
    return Math.floor(1000 + Math.random()* 9000);
  }

  public ExpirationToken(){
    const FechaActual = new Date();
    const FechaExp = new Date(FechaActual.getTime());
    FechaExp.setMinutes(FechaExp.getMinutes() + 5);
    return { init: FechaActual, fin: FechaExp }
  }
}
