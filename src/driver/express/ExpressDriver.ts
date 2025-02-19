import { UseMetadata } from '../../metadata/UseMetadata.js';
import { MiddlewareMetadata } from '../../metadata/MiddlewareMetadata.js';
import { ActionMetadata } from '../../metadata/ActionMetadata.js';
import type { Action } from '../../Action.js';
import { ParamMetadata } from '../../metadata/ParamMetadata.js';
import { BaseDriver } from '../BaseDriver.js';
import type { ExpressMiddlewareInterface } from './ExpressMiddlewareInterface.js';
import type { ExpressErrorMiddlewareInterface } from './ExpressErrorMiddlewareInterface.js';
import { AccessDeniedError } from '../../error/AccessDeniedError.js';
import { AuthorizationCheckerNotDefinedError } from '../../error/AuthorizationCheckerNotDefinedError.js';
import { isPromiseLike } from '../../util/isPromiseLike.js';
import { getFromContainer } from '../../container.js';
import { AuthorizationRequiredError } from '../../error/AuthorizationRequiredError.js';
import { NotFoundError, type RoutingControllersOptions } from '../../index.js';

import cookie from 'cookie';
// @ts-ignore
import templateUrl from 'template-url';
import type { BodyParser } from 'body-parser';
import type multerType from 'multer';

/**
 * Integration with express framework.
 */
export class ExpressDriver extends BaseDriver {
  private cachedBodyParser: BodyParser | undefined;
  private cachedMulter: typeof multerType | undefined;

  // -------------------------------------------------------------------------
  // Constructor
  // -------------------------------------------------------------------------

  constructor(public express?: any) {
    super();
  }

  // -------------------------------------------------------------------------
  // Public Methods
  // -------------------------------------------------------------------------

  /**
   * Initializes the things driver needs before routes and middlewares registration.
   */
  async initialize() {
    if (this.cors) {
      const { default: cors } = await import('cors');
      if (this.cors === true) {
        this.express.use(cors());
      } else {
        this.express.use(cors(this.cors));
      }
    }
  }

  /**
   * Registers middleware that run before controller actions.
   */
  registerMiddleware(middleware: MiddlewareMetadata, options: RoutingControllersOptions): void {
    let middlewareWrapper;

    // if its an error handler then register it with proper signature in express
    if ((middleware.instance as ExpressErrorMiddlewareInterface).error) {
      middlewareWrapper = (error: any, request: any, response: any, next: (err?: any) => any) => {
        (middleware.instance as ExpressErrorMiddlewareInterface).error(error, request, response, next);
      };
    }

    // if its a regular middleware then register it as express middleware
    else if ((middleware.instance as ExpressMiddlewareInterface).use) {
      middlewareWrapper = (request: any, response: any, next: (err: any) => any) => {
        try {
          const useResult = (middleware.instance as ExpressMiddlewareInterface).use(request, response, next);
          if (isPromiseLike(useResult)) {
            useResult.catch((error: any) => {
              this.handleError(error, undefined, { request, response, next });
              return error;
            });
          }
        } catch (error) {
          this.handleError(error, undefined, { request, response, next });
        }
      };
    }

    if (middlewareWrapper) {
      // Name the function for better debugging
      Object.defineProperty(middlewareWrapper, 'name', {
        value: middleware.instance.constructor.name,
        writable: true,
      });

      this.express.use(options.routePrefix || '/', middlewareWrapper);
    }
  }

  /**
   * Registers action in the driver.
   */
  async registerAction(actionMetadata: ActionMetadata, executeCallback: (options: Action) => any): Promise<void> {
    // middlewares required for this action
    const defaultMiddlewares: any[] = [];

    if (actionMetadata.isBodyUsed) {
      const bodyParser = await this.loadBodyParser();
      if (actionMetadata.isJsonTyped) {
        defaultMiddlewares.push(bodyParser.json(actionMetadata.bodyExtraOptions));
      } else {
        defaultMiddlewares.push(bodyParser.text(actionMetadata.bodyExtraOptions));
      }
    }

    if (actionMetadata.isAuthorizedUsed) {
      defaultMiddlewares.push((request: any, response: any, next: Function) => {
        if (!this.authorizationChecker) throw new AuthorizationCheckerNotDefinedError();

        const action: Action = { request, response, next };
        try {
          const checkResult = this.authorizationChecker(action, actionMetadata.authorizedRoles);

          const handleError = (result: any) => {
            if (!result) {
              const error =
                actionMetadata.authorizedRoles.length === 0
                  ? new AuthorizationRequiredError(action)
                  : new AccessDeniedError(action);
              this.handleError(error, actionMetadata, action);
            } else {
              next();
            }
          };

          if (isPromiseLike(checkResult)) {
            checkResult
              .then(result => handleError(result))
              .catch(error => this.handleError(error, actionMetadata, action));
          } else {
            handleError(checkResult);
          }
        } catch (error) {
          this.handleError(error, actionMetadata, action);
        }
      });
    }

    if (actionMetadata.isFileUsed || actionMetadata.isFilesUsed) {
      const multer = await this.loadMulter();
      actionMetadata.params
        .filter(param => param.type === 'file')
        .forEach(param => {
          defaultMiddlewares.push(multer(param.extraOptions).single(param.name));
        });
      actionMetadata.params
        .filter(param => param.type === 'files')
        .forEach(param => {
          defaultMiddlewares.push(multer(param.extraOptions).array(param.name));
        });
    }

    // user used middlewares
    const uses = [...actionMetadata.controllerMetadata.uses, ...actionMetadata.uses];
    const beforeMiddlewares = this.prepareMiddlewares(uses.filter(use => !use.afterAction));
    const afterMiddlewares = this.prepareMiddlewares(uses.filter(use => use.afterAction));

    // prepare route and route handler function
    const route = ActionMetadata.appendBaseRoute(this.routePrefix, actionMetadata.fullRoute);
    const routeHandler = function routeHandler(request: any, response: any, next: Function) {
      return executeCallback({ request, response, next });
    };

    // This ensures that a request is only processed once to prevent unhandled rejections saying
    // "Can't set headers after they are sent"
    // Some examples of reasons a request may cause multiple route calls:
    // * Express calls the "get" route automatically when we call the "head" route:
    //   Reference: https://expressjs.com/en/4x/api.html#router.METHOD
    //   This causes a double execution on our side.
    // * Multiple routes match the request (e.g. GET /users/me matches both @All(/users/me) and @Get(/users/:id)).
    // The following middleware only starts an action processing if the request has not been processed before.
    const routeGuard = function routeGuard(request: any, response: any, next: Function) {
      if (!request.routingControllersStarted) {
        request.routingControllersStarted = true;
        return next();
      }
    };

    // finally register action in express
    this.express[actionMetadata.type.toLowerCase()](
      ...[route, routeGuard, ...beforeMiddlewares, ...defaultMiddlewares, routeHandler, ...afterMiddlewares]
    );
  }

  /**
   * Registers all routes in the framework.
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  registerRoutes() {}

  /**
   * Gets param from the request.
   */
  getParamFromRequest(action: Action, param: ParamMetadata): any {
    const request: any = action.request;
    switch (param.type) {
      case 'body':
        return request.body;

      case 'body-param':
        return request.body[param.name];

      case 'param':
        return request.params[param.name];

      case 'params':
        return request.params;

      case 'session-param':
        return request.session[param.name];

      case 'session':
        return request.session;

      case 'state':
        throw new Error('@State decorators are not supported by express driver.');

      case 'query':
        return request.query[param.name];

      case 'queries':
        return request.query;

      case 'header':
        return request.headers[param.name.toLowerCase()];

      case 'headers':
        return request.headers;

      case 'file':
        return request.file;

      case 'files':
        return request.files;

      case 'cookie':
        if (!request.headers.cookie) return;
        const cookies = cookie.parse(request.headers.cookie);
        return cookies[param.name];

      case 'cookies':
        if (!request.headers.cookie) return {};
        return cookie.parse(request.headers.cookie);
    }
  }

  /**
   * Handles result of successfully executed controller action.
   */
  handleSuccess(result: any, action: ActionMetadata, options: Action): void {
    // if the action returned the response object itself, short-circuits
    if (result && result === options.response) {
      options.next();
      return;
    }

    // transform result if needed
    result = this.transformResult(result, action, options);

    // set http status code
    if (result === undefined && action.undefinedResultCode) {
      if (action.undefinedResultCode instanceof Function) {
        throw new (action.undefinedResultCode as any)(options);
      }
      options.response.status(action.undefinedResultCode);
    } else if (result === null) {
      if (action.nullResultCode) {
        if (action.nullResultCode instanceof Function) {
          throw new (action.nullResultCode as any)(options);
        }
        options.response.status(action.nullResultCode);
      } else {
        options.response.status(204);
      }
    } else if (action.successHttpCode) {
      options.response.status(action.successHttpCode);
    }

    // apply http headers
    Object.keys(action.headers).forEach(name => {
      options.response.header(name, action.headers[name]);
    });

    if (action.redirect) {
      // if redirect is set then do it
      if (typeof result === 'string') {
        options.response.redirect(result);
      } else if (result instanceof Object) {
        options.response.redirect(templateUrl(action.redirect, result));
      } else {
        options.response.redirect(action.redirect);
      }

      options.next();
    } else if (action.renderedTemplate) {
      // if template is set then render it
      const renderOptions = result && result instanceof Object ? result : {};

      options.response.render(action.renderedTemplate, renderOptions, (err: any, html: string) => {
        if (err && action.isJsonTyped) {
          return options.next(err);
        } else if (err && !action.isJsonTyped) {
          return options.next(err);
        } else if (html) {
          options.response.send(html);
        }
        options.next();
      });
    } else if (result === undefined) {
      // throw NotFoundError on undefined response

      if (action.undefinedResultCode) {
        if (action.isJsonTyped) {
          options.response.json();
        } else {
          options.response.send();
        }
        options.next();
      } else {
        throw new NotFoundError();
      }
    } else if (result === null) {
      // send null response
      if (action.isJsonTyped) {
        options.response.json(null);
      } else {
        options.response.send(null);
      }
      options.next();
    } else if (result instanceof Buffer) {
      // check if it's binary data (Buffer)
      options.response.end(result, 'binary');
    } else if (result instanceof Uint8Array) {
      // check if it's binary data (typed array)
      options.response.end(Buffer.from(result as any), 'binary');
    } else if (result.pipe instanceof Function) {
      result.pipe(options.response);
    } else {
      // send regular result
      if (action.isJsonTyped) {
        options.response.json(result);
      } else {
        options.response.send(result);
      }
      options.next();
    }
  }

  /**
   * Handles result of failed executed controller action.
   */
  handleError(error: any, action: ActionMetadata | undefined, options: Action): any {
    if (this.isDefaultErrorHandlingEnabled) {
      const response: any = options.response;

      // set http code
      // note that we can't use error instanceof HttpError properly anymore because of new typescript emit process
      if (error.httpCode) {
        response.status(error.httpCode);
      } else {
        response.status(500);
      }

      // apply http headers
      if (action) {
        Object.keys(action.headers).forEach(name => {
          response.header(name, action.headers[name]);
        });
      }

      // send error content
      if (action && action.isJsonTyped) {
        response.json(this.processJsonError(error));
      } else {
        response.send(this.processTextError(error)); // todo: no need to do it because express by default does it
      }
    }
    options.next(error);
  }

  /**
   * Dynamically loads express module.
   */
  public async loadExpress() {
    if (!this.express) {
      try {
        const { default: expressLib } = await import('express');
        this.express = expressLib();
      } catch (e) {
        throw new Error('express package was not found installed. Try to install it: npm install express --save');
      }
    }

    this.app = this.express;
  }

  // -------------------------------------------------------------------------
  // Protected Methods
  // -------------------------------------------------------------------------

  /**
   * Creates middlewares from the given "use"-s.
   */
  protected prepareMiddlewares(uses: UseMetadata[]) {
    const middlewareFunctions: Function[] = [];
    uses.forEach((use: UseMetadata) => {
      if (use.middleware.prototype && use.middleware.prototype.use) {
        // if this is function instance of MiddlewareInterface
        middlewareFunctions.push((request: any, response: any, next: (err: any) => any) => {
          try {
            const useResult = getFromContainer<ExpressMiddlewareInterface>(use.middleware).use(request, response, next);
            if (isPromiseLike(useResult)) {
              useResult.catch((error: any) => {
                this.handleError(error, undefined, { request, response, next });
                return error;
              });
            }

            return useResult;
          } catch (error) {
            this.handleError(error, undefined, { request, response, next });
          }
        });
      } else if (use.middleware.prototype && use.middleware.prototype.error) {
        // if this is function instance of ErrorMiddlewareInterface
        middlewareFunctions.push(function (error: any, request: any, response: any, next: (err: any) => any) {
          return getFromContainer<ExpressErrorMiddlewareInterface>(use.middleware).error(
            error,
            request,
            response,
            next
          );
        });
      } else {
        middlewareFunctions.push(use.middleware);
      }
    });
    return middlewareFunctions;
  }

  /**
   * Dynamically loads body-parser module.
   */
  protected async loadBodyParser(): Promise<BodyParser> {
    if (this.cachedBodyParser) {
      return this.cachedBodyParser;
    }

    try {
      const { default: bodyParser } = await import('body-parser');
      this.cachedBodyParser = bodyParser;

      return bodyParser;
    } catch (e) {
      throw new Error('body-parser package was not found installed. Try to install it: npm install body-parser --save');
    }
  }

  /**
   * Dynamically loads multer module.
   */
  protected async loadMulter(): Promise<typeof multerType> {
    if (this.cachedMulter) {
      return this.cachedMulter;
    }

    try {
      const { default: multer } = await import('multer');
      this.cachedMulter = multer;

      return multer;
    } catch (e) {
      throw new Error('multer package was not found installed. Try to install it: npm install multer --save');
    }
  }
}
