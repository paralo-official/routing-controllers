import { getMetadataArgsStorage } from '../index.js';
import type { ControllerOptions } from '../decorator-options/ControllerOptions.js';

/**
 * Defines a class as a JSON controller. If JSON controller is used, then all controller actions will return
 * a serialized json data, and its response content-type always will be application/json.
 *
 * @param baseRoute Extra path you can apply as a base route to all controller actions
 * @param options Extra options that apply to all controller actions
 */
export function JsonController(baseRoute?: string, options?: ControllerOptions) {
  return function (object: Function) {
    getMetadataArgsStorage().controllers.push({
      type: 'json',
      target: object,
      route: baseRoute,
      options,
    });
  };
}
