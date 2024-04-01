import type { ParamOptions } from '../decorator-options/ParamOptions.js';
import { getMetadataArgsStorage } from '../index.js';

/**
 * Injects a Session object to the controller action parameter.
 * Must be applied on a controller action parameter.
 */
export function Session(options?: ParamOptions): ParameterDecorator {
  return function (object: Object, methodName: string | symbol, index: number) {
    getMetadataArgsStorage().params.push({
      type: 'session',
      object: object,
      method: methodName as string,
      index: index,
      parse: false, // it makes no sense for Session object to be parsed as json
      required: options && options.required !== undefined ? options.required : true,
      classTransform: options && options.transform,
      validate: options && options.validate !== undefined ? options.validate : false,
    });
  };
}
