import { IModelHelper } from 'spirit.io/lib/interfaces';
import { ModelHelperBase } from 'spirit.io/lib/base';
import { IRedisModelFactory } from './modelFactory';

export class ModelHelper extends ModelHelperBase implements IModelHelper {
    constructor(modelFactory: IRedisModelFactory) {
        super(modelFactory);
    }
}