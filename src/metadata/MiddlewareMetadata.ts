import type { MiddlewareMetadataArgs } from './args/MiddlewareMetadataArgs.js';
import type { ExpressMiddlewareInterface } from '../driver/express/ExpressMiddlewareInterface.js';
import type { ExpressErrorMiddlewareInterface } from '../driver/express/ExpressErrorMiddlewareInterface.js';
import { getFromContainer } from '../container.js';
import type { KoaMiddlewareInterface } from '../driver/koa/KoaMiddlewareInterface.js';

/**
 * Middleware metadata.
 */
export class MiddlewareMetadata {
  // -------------------------------------------------------------------------
  // Properties
  // -------------------------------------------------------------------------

  /**
   * Indicates if this middleware is global, thous applied to all routes.
   */
  global: boolean;

  /**
   * Object class of the middleware class.
   */
  target: Function;

  /**
   * Execution priority of the middleware.
   */
  priority: number;

  /**
   * Indicates if middleware must be executed after routing action is executed.
   */
  type: 'before' | 'after';

  // -------------------------------------------------------------------------
  // Constructor
  // -------------------------------------------------------------------------

  constructor(args: MiddlewareMetadataArgs) {
    this.global = args.global;
    this.target = args.target;
    this.priority = args.priority;
    this.type = args.type;
  }

  // -------------------------------------------------------------------------
  // Accessors
  // -------------------------------------------------------------------------

  /**
   * Gets middleware instance from the container.
   */
  get instance(): ExpressMiddlewareInterface | KoaMiddlewareInterface | ExpressErrorMiddlewareInterface {
    return getFromContainer<ExpressMiddlewareInterface | KoaMiddlewareInterface | ExpressErrorMiddlewareInterface>(
      this.target
    );
  }
}
