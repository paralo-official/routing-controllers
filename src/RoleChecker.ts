import type { Action } from './Action.js';

export interface RoleChecker {
  check(action: Action): boolean | Promise<boolean>;
}
