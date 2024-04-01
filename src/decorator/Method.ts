import type { HandlerOptions } from '../decorator-options/HandlerOptions.js';
import { getMetadataArgsStorage } from '../index.js';
import type { ActionType } from '../metadata/types/ActionType.js';

/**
 * Registers an action to be executed when request with specified method comes on a given route.
 * Must be applied on a controller action.
 */
export function Method(method: ActionType, route?: RegExp, options?: HandlerOptions): Function;

/**
 * Registers an action to be executed when request with specified method comes on a given route.
 * Must be applied on a controller action.
 */
export function Method(method: ActionType, route?: string, options?: HandlerOptions): Function;

/**
 * Registers an action to be executed when request with specified method comes on a given route.
 * Must be applied on a controller action.
 */
export function Method(method: ActionType, route?: string | RegExp, options?: HandlerOptions): Function {
  return function (object: Object, methodName: string) {
    getMetadataArgsStorage().actions.push({
      type: method,
      target: object.constructor,
      method: methodName,
      options,
      route,
    });
  };
}
