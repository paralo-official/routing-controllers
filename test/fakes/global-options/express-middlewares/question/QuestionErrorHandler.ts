import type { ExpressErrorMiddlewareInterface } from '../../../../../src/driver/express/ExpressErrorMiddlewareInterface.js';
import { defaultFakeService } from '../../FakeService.js';
import { Middleware } from '../../../../../src/decorator/Middleware.js';

@Middleware({ type: 'after' })
export class QuestionErrorHandler implements ExpressErrorMiddlewareInterface {
  error(error: any, request: any, response: any, next?: (err?: any) => any): any {
    defaultFakeService.questionErrorMiddleware();
    next(error);
  }
}
