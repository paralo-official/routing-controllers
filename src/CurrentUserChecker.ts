import type { Action } from './Action.js';

/**
 * Special function used to get currently authorized user.
 */
export type CurrentUserChecker = (action: Action) => Promise<any> | any;
