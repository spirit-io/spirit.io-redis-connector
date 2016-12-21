import { IModelController, IModelFactory } from 'spirit.io/lib/interfaces';
import { ModelControllerBase } from 'spirit.io/lib/base';
import { IRedisModelFactory } from './modelFactory';

export class ModelController extends ModelControllerBase implements IModelController {
    constructor(modelFactory: IRedisModelFactory) {
        super(modelFactory);
    }

} 