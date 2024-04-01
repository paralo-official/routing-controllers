import { ActionMetadata } from './ActionMetadata.js';
import type { ControllerMetadataArgs } from './args/ControllerMetadataArgs.js';
import { UseMetadata } from './UseMetadata.js';
import { getFromContainer } from '../container.js';
import type { ControllerOptions } from '../decorator-options/ControllerOptions.js';
import { ResponseHandlerMetadata } from './ResponseHandleMetadata.js';
import { InterceptorMetadata } from './InterceptorMetadata.js';
import type { Action } from '../Action.js';

/**
 * Controller metadata.
 */
export class ControllerMetadata {
  // -------------------------------------------------------------------------
  // Properties
  // -------------------------------------------------------------------------

  /**
   * Controller actions.
   */
  actions: ActionMetadata[];

  /**
   * Indicates object which is used by this controller.
   */
  target: Function;

  /**
   * Base route for all actions registered in this controller.
   */
  route: string;

  /**
   * Controller type. Can be default or json-typed. Json-typed controllers operate with json requests and responses.
   */
  type: 'default' | 'json';

  /**
   * Options that apply to all controller actions.
   */
  options: ControllerOptions;

  /**
   * Middleware "use"-s applied to a whole controller.
   */
  uses: UseMetadata[];

  /**
   * Middleware "use"-s applied to a whole controller.
   */
  interceptors: InterceptorMetadata[];

  /**
   * Indicates if this action uses Authorized decorator.
   */
  isAuthorizedUsed: boolean;

  /**
   * Roles set by @Authorized decorator.
   */
  authorizedRoles: any[];

  // -------------------------------------------------------------------------
  // Constructor
  // -------------------------------------------------------------------------

  constructor(args: ControllerMetadataArgs) {
    this.target = args.target;
    this.route = args.route;
    this.type = args.type;
    this.options = args.options;
  }

  // -------------------------------------------------------------------------
  // Accessors
  // -------------------------------------------------------------------------

  /**
   * Gets instance of the controller.
   * @param action Details around the request session
   */
  getInstance(action: Action): any {
    return getFromContainer(this.target, action);
  }

  // -------------------------------------------------------------------------
  // Public Methods
  // -------------------------------------------------------------------------

  /**
   * Builds everything controller metadata needs.
   * Controller metadata should be used only after its build.
   */
  build(responseHandlers: ResponseHandlerMetadata[]) {
    const authorizedHandler = responseHandlers.find(handler => handler.type === 'authorized' && !handler.method);
    this.isAuthorizedUsed = !!authorizedHandler;
    this.authorizedRoles = [].concat((authorizedHandler && authorizedHandler.value) || []);
  }
}
