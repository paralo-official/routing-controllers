import type { CustomParameterDecorator } from './CustomParameterDecorator.js';
import { BaseDriver } from './driver/BaseDriver.js';
import { ExpressDriver } from './driver/express/ExpressDriver.js';
import { KoaDriver } from './driver/koa/KoaDriver.js';
import { MetadataArgsStorage } from './metadata-builder/MetadataArgsStorage.js';
import { RoutingControllers } from './RoutingControllers.js';
import type { RoutingControllersOptions } from './RoutingControllersOptions.js';
import type { ValidationOptions } from 'class-validator';
import { importClassesFromDirectories } from './util/importClassesFromDirectories.js';

// -------------------------------------------------------------------------
// Main exports
// -------------------------------------------------------------------------

export * from './container.js';

export * from './decorator/All.js';
export * from './decorator/Authorized.js';
export * from './decorator/Body.js';
export * from './decorator/BodyParam.js';
export * from './decorator/ContentType.js';
export * from './decorator/Controller.js';
export * from './decorator/CookieParam.js';
export * from './decorator/CookieParams.js';
export * from './decorator/Ctx.js';
export * from './decorator/CurrentUser.js';
export * from './decorator/Delete.js';
export * from './decorator/Get.js';
export * from './decorator/Head.js';
export * from './decorator/Header.js';
export * from './decorator/HeaderParam.js';
export * from './decorator/HeaderParams.js';
export * from './decorator/HttpCode.js';
export * from './decorator/Interceptor.js';
export * from './decorator/JsonController.js';
export * from './decorator/Location.js';
export * from './decorator/Method.js';
export * from './decorator/Middleware.js';
export * from './decorator/OnNull.js';
export * from './decorator/OnUndefined.js';
export * from './decorator/Param.js';
export * from './decorator/Params.js';
export * from './decorator/Patch.js';
export * from './decorator/Post.js';
export * from './decorator/Put.js';
export * from './decorator/QueryParam.js';
export * from './decorator/QueryParams.js';
export * from './decorator/Redirect.js';
export * from './decorator/Render.js';
export * from './decorator/Req.js';
export * from './decorator/Res.js';
export * from './decorator/ResponseClassTransformOptions.js';
export * from './decorator/Session.js';
export * from './decorator/SessionParam.js';
export * from './decorator/State.js';
export * from './decorator/UploadedFile.js';
export * from './decorator/UploadedFiles.js';
export * from './decorator/UseAfter.js';
export * from './decorator/UseBefore.js';
export * from './decorator/UseInterceptor.js';

export * from './decorator-options/BodyOptions.js';
export * from './decorator-options/ParamOptions.js';
export * from './decorator-options/UploadOptions.js';

export * from './http-error/HttpError.js';
export * from './http-error/InternalServerError.js';
export * from './http-error/BadRequestError.js';
export * from './http-error/ForbiddenError.js';
export * from './http-error/NotAcceptableError.js';
export * from './http-error/MethodNotAllowedError.js';
export * from './http-error/NotFoundError.js';
export * from './http-error/UnauthorizedError.js';

export * from './driver/express/ExpressMiddlewareInterface.js';
export * from './driver/express/ExpressErrorMiddlewareInterface.js';
export * from './driver/koa/KoaMiddlewareInterface.js';
export * from './metadata-builder/MetadataArgsStorage.js';
export * from './metadata/ActionMetadata.js';
export * from './metadata/ControllerMetadata.js';
export * from './metadata/InterceptorMetadata.js';
export * from './metadata/MiddlewareMetadata.js';
export * from './metadata/ParamMetadata.js';
export * from './metadata/ResponseHandleMetadata.js';
export * from './metadata/UseMetadata.js';

export * from './RoutingControllersOptions.js';
export * from './CustomParameterDecorator.js';
export * from './RoleChecker.js';
export * from './Action.js';
export * from './InterceptorInterface.js';

export * from './driver/BaseDriver.js';
export * from './driver/express/ExpressDriver.js';
export * from './driver/koa/KoaDriver.js';

// -------------------------------------------------------------------------
// Main Functions
// -------------------------------------------------------------------------

/**
 * Gets metadata args storage.
 * Metadata args storage follows the best practices and stores metadata in a global variable.
 */
export function getMetadataArgsStorage(): MetadataArgsStorage {
  if (!(global as any).routingControllersMetadataArgsStorage)
    (global as any).routingControllersMetadataArgsStorage = new MetadataArgsStorage();

  return (global as any).routingControllersMetadataArgsStorage;
}

/**
 * Registers all loaded actions in your express application.
 */
export async function useExpressServer<T>(expressServer: T, options?: RoutingControllersOptions): Promise<T> {
  const driver = new ExpressDriver(expressServer);
  await driver.loadExpress();

  return createServer(driver, options);
}

/**
 * Registers all loaded actions in your express application.
 */
export async function createExpressServer(options?: RoutingControllersOptions): Promise<any> {
  const driver = new ExpressDriver();
  await driver.loadExpress();

  return createServer(driver, options);
}

/**
 * Registers all loaded actions in your koa application.
 */
export async function useKoaServer<T>(koaApp: T, options?: RoutingControllersOptions): Promise<T> {
  const driver = new KoaDriver(koaApp);
  await driver.initializeKoa();
  return createServer(driver, options);
}

/**
 * Registers all loaded actions in your koa application.
 */
export async function createKoaServer(options?: RoutingControllersOptions): Promise<any> {
  const driver = new KoaDriver();
  await driver.initializeKoa();
  return createServer(driver, options);
}

/**
 * Registers all loaded actions in your application using selected driver.
 */
export async function createServer<T extends BaseDriver>(driver: T, options?: RoutingControllersOptions): Promise<any> {
  await createExecutor(driver, options);
  return driver.app;
}

/**
 * Registers all loaded actions in your express application.
 */
export async function createExecutor<T extends BaseDriver>(
  driver: T,
  options: RoutingControllersOptions = {}
): Promise<void> {
  // import all controllers and middlewares and error handlers (new way)
  let controllerClasses: Function[];
  if (options && options.controllers && options.controllers.length) {
    controllerClasses = (options.controllers as any[]).filter(controller => controller instanceof Function);
    const controllerDirs = (options.controllers as any[]).filter(controller => typeof controller === 'string');
    controllerClasses.push(...(await importClassesFromDirectories(controllerDirs)));
  }
  let middlewareClasses: Function[];
  if (options && options.middlewares && options.middlewares.length) {
    middlewareClasses = (options.middlewares as any[]).filter(controller => controller instanceof Function);
    const middlewareDirs = (options.middlewares as any[]).filter(controller => typeof controller === 'string');
    middlewareClasses.push(...(await importClassesFromDirectories(middlewareDirs)));
  }
  let interceptorClasses: Function[];
  if (options && options.interceptors && options.interceptors.length) {
    interceptorClasses = (options.interceptors as any[]).filter(controller => controller instanceof Function);
    const interceptorDirs = (options.interceptors as any[]).filter(controller => typeof controller === 'string');
    interceptorClasses.push(...(await importClassesFromDirectories(interceptorDirs)));
  }

  if (options && options.development !== undefined) {
    driver.developmentMode = options.development;
  } else {
    driver.developmentMode = process.env.NODE_ENV !== 'production';
  }

  if (options.defaultErrorHandler !== undefined) {
    driver.isDefaultErrorHandlingEnabled = options.defaultErrorHandler;
  } else {
    driver.isDefaultErrorHandlingEnabled = true;
  }

  if (options.classTransformer !== undefined) {
    driver.useClassTransformer = options.classTransformer;
  } else {
    driver.useClassTransformer = true;
  }

  if (options.validation !== undefined) {
    driver.enableValidation = !!options.validation;
    if (options.validation instanceof Object) driver.validationOptions = options.validation as ValidationOptions;
  } else {
    driver.enableValidation = true;
  }

  driver.classToPlainTransformOptions = options.classToPlainTransformOptions;
  driver.plainToClassTransformOptions = options.plainToClassTransformOptions;

  if (options.errorOverridingMap !== undefined) driver.errorOverridingMap = options.errorOverridingMap;

  if (options.routePrefix !== undefined) driver.routePrefix = options.routePrefix;

  if (options.currentUserChecker !== undefined) driver.currentUserChecker = options.currentUserChecker;

  if (options.authorizationChecker !== undefined) driver.authorizationChecker = options.authorizationChecker;

  driver.cors = options.cors;

  // next create a controller executor
  new RoutingControllers(driver, options)
    .initialize()
    .registerInterceptors(interceptorClasses)
    .registerMiddlewares('before', middlewareClasses)
    .registerControllers(controllerClasses)
    .registerMiddlewares('after', middlewareClasses); // todo: register only for loaded controllers?
}

/**
 * Registers custom parameter decorator used in the controller actions.
 */
export function createParamDecorator(options: CustomParameterDecorator) {
  return function (object: Object, method: string, index: number) {
    getMetadataArgsStorage().params.push({
      type: 'custom-converter',
      object: object,
      method: method,
      index: index,
      parse: false,
      required: options.required,
      transform: options.value,
    });
  };
}
