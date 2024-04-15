import type { ExpressMiddlewareInterface } from '../../../../src/driver/express/ExpressMiddlewareInterface.js';
import { defaultFakeService } from '../FakeService.js';
import { Middleware } from '../../../../src/decorator/Middleware.js';

@Middleware({ type: 'before' })
export class FileMiddleware implements ExpressMiddlewareInterface {
  use(context: any, next?: (err?: any) => Promise<any>): Promise<any> {
    defaultFakeService.fileMiddleware();
    return next();
  }
}
