import { IModelController, IModelFactory } from 'spirit.io/lib/interfaces';
import { ModelControllerBase } from 'spirit.io/lib/base';

export class ModelController extends ModelControllerBase implements IModelController {
    constructor(modelFactory: IModelFactory) {
        super(modelFactory);
    }

} 