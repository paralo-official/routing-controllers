import type { HandlerOptions } from '../decorator-options/HandlerOptions.js';
import { getMetadataArgsStorage } from '../index.js';

/**
 * Registers an action to be executed when PUT request comes on a given route.
 * Must be applied on a controller action.
 */
export function Put(route?: RegExp, options?: HandlerOptions): Function;

/**
 * Registers an action to be executed when PUT request comes on a given route.
 * Must be applied on a controller action.
 */
export function Put(route?: string, options?: HandlerOptions): Function;

/**
 * Registers an action to be executed when PUT request comes on a given route.
 * Must be applied on a controller action.
 */
export function Put(route?: string | RegExp, options?: HandlerOptions): Function {
  return function (object: Object, methodName: string) {
    getMetadataArgsStorage().actions.push({
      type: 'put',
      target: object.constructor,
      method: methodName,
      route: route,
      options,
    });
  };
}
