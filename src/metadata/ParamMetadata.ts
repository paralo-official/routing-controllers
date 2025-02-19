import type { ValidatorOptions } from 'class-validator';
import type { ActionMetadata } from './ActionMetadata.js';
import type { ParamMetadataArgs } from './args/ParamMetadataArgs.js';
import type { ParamType } from './types/ParamType.js';
import type { ClassTransformOptions } from 'class-transformer';
import type { Action } from '../Action.js';

/**
 * Action Parameter metadata.
 */
export class ParamMetadata {
  // -------------------------------------------------------------------------
  // Properties
  // -------------------------------------------------------------------------

  /**
   * Parameter's action.
   */
  actionMetadata: ActionMetadata;

  /**
   * Object on which's method's parameter this parameter is attached.
   */
  object: any;

  /**
   * Method on which's parameter is attached.
   */
  method: string;

  /**
   * Index (# number) of the parameter in the method signature.
   */
  index: number;

  /**
   * Parameter type.
   */
  type: ParamType;

  /**
   * Parameter name.
   */
  name: string;

  /**
   * Parameter target type.
   */
  targetType?: any;

  /**
   * Parameter target type's name in lowercase.
   */
  targetName: string = '';

  /**
   * Indicates if target type is an object.
   */
  isTargetObject: boolean = false;

  /**
   * Parameter target.
   */
  target: any;

  /**
   * Specifies if parameter should be parsed as json or not.
   */
  parse: boolean;

  /**
   * Indicates if this parameter is required or not
   */
  required: boolean;

  /**
   * Transforms the value.
   */
  transform: (action: Action, value?: any) => Promise<any> | any;

  /**
   * If true, string values are cast to arrays
   */
  isArray?: boolean;

  /**
   * Additional parameter options.
   * For example it can be uploader middleware options or body-parser middleware options.
   */
  extraOptions: any;

  /**
   * Class transform options used to perform plainToClass operation.
   */
  classTransform?: ClassTransformOptions;

  /**
   * If true, class-validator will be used to validate param object.
   * If validation options are given then it means validation will be applied (is true).
   */
  validate?: boolean | ValidatorOptions;

  // -------------------------------------------------------------------------
  // Constructor
  // -------------------------------------------------------------------------

  constructor(actionMetadata: ActionMetadata, args: ParamMetadataArgs) {
    this.actionMetadata = actionMetadata;

    this.target = args.object.constructor;
    this.method = args.method;
    this.extraOptions = args.extraOptions;
    this.index = args.index;
    this.type = args.type;
    this.name = args.name;
    this.parse = args.parse;
    this.required = args.required;
    this.transform = args.transform;
    this.classTransform = args.classTransform;
    this.validate = args.validate;
    this.isArray = args.isArray;

    if (args.explicitType) {
      this.targetType = args.explicitType;
    } else {
      const ParamTypes = (Reflect as any).getMetadata('design:paramtypes', args.object, args.method);
      if (typeof ParamTypes !== 'undefined') {
        this.targetType = ParamTypes[args.index];
      }
    }

    if (this.targetType) {
      if (this.targetType instanceof Function && this.targetType.name) {
        this.targetName = this.targetType.name.toLowerCase();
      } else if (typeof this.targetType === 'string') {
        this.targetName = this.targetType.toLowerCase();
      }
      this.isTargetObject = this.targetType instanceof Function || this.targetType.toLowerCase() === 'object';
    }
  }
}
