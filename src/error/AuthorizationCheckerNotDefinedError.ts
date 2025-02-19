import { InternalServerError } from '../http-error/InternalServerError.js';

/**
 * Thrown when authorizationChecker function is not defined in routing-controllers options.
 */
export class AuthorizationCheckerNotDefinedError extends InternalServerError {
  name = 'AuthorizationCheckerNotDefinedError';

  constructor() {
    super(
      `Cannot use @Authorized decorator. Please define authorizationChecker function in routing-controllers action before using it.`
    );
    Object.setPrototypeOf(this, AuthorizationCheckerNotDefinedError.prototype);
  }
}
