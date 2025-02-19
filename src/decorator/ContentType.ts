import { getMetadataArgsStorage } from '../index.js';

/**
 * Sets response Content-Type.
 * Must be applied on a controller action.
 */
export function ContentType(contentType: string): Function {
  return function (object: Object, methodName: string) {
    getMetadataArgsStorage().responseHandlers.push({
      type: 'content-type',
      target: object.constructor,
      method: methodName,
      value: contentType,
    });
  };
}
