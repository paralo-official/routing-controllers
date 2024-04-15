import { ExpressMiddlewareInterface } from '../../../../../src/driver/express/ExpressMiddlewareInterface.js';
import { defaultFakeService } from '../../FakeService.js';
import { Middleware } from '../../../../../src/decorator/Middleware.js';

@Middleware({ type: 'before' })
export class QuestionMiddleware implements ExpressMiddlewareInterface {
  use(request: any, response: any, next?: (err?: any) => any): any {
    defaultFakeService.questionMiddleware();
    return next();
  }
}
