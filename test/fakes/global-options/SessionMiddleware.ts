import type { ExpressMiddlewareInterface } from '../../../src/driver/express/ExpressMiddlewareInterface.js';
import session from 'express-session';

import convert from 'koa-convert';
import KoaSession from 'koa-session';

export class SessionMiddleware implements ExpressMiddlewareInterface {
  public use(requestOrContext: any, responseOrNext: any, next?: (err?: any) => any): any {
    if (next) {
      return this.expSession(requestOrContext, responseOrNext, next);
    } else {
      if (!this.koaSession) {
        this.koaSession = convert(KoaSession(requestOrContext.app));
      }
      return this.koaSession(requestOrContext, responseOrNext);
    }
  }

  private expSession = (session as any)({
    secret: '19majkel94_helps_pleerock',
    resave: false,
    saveUninitialized: true,
  });

  private koaSession: any;
}
