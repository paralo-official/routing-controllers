import type { ExpressMiddlewareInterface } from '../../../../../src/driver/express/ExpressMiddlewareInterface.js';
import { defaultFakeService } from '../../FakeService.js';
import { Middleware } from '../../../../../src/decorator/Middleware.js';

@Middleware({ type: 'before' })
export class PostMiddleware implements ExpressMiddlewareInterface {
  use(request: any, response: any, next?: (err?: any) => any): any {
    defaultFakeService.postMiddleware();
    next();
  }
}
