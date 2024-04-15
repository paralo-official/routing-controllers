import type { ExpressMiddlewareInterface } from '../../../../src/driver/express/ExpressMiddlewareInterface.js';
import { defaultFakeService } from '../FakeService.js';
import { Middleware } from '../../../../src/decorator/Middleware.js';

@Middleware({ type: 'before' })
export class VideoMiddleware implements ExpressMiddlewareInterface {
  use(context: any, next?: (err?: any) => Promise<any>): Promise<any> {
    defaultFakeService.videoMiddleware();
    return next();
  }
}
