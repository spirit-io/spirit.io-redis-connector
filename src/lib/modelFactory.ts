import { ModelFactoryBase } from 'spirit.io/lib/base'
import { IConnector, IModelFactory } from 'spirit.io/lib/interfaces'
import { ModelActions } from './modelActions';
import { ModelHelper } from './modelHelper';
import { ModelController } from './modelController';
import { RedisClient } from 'redis';

export interface IRedisModelFactory extends IModelFactory {
    client: RedisClient;
}

export class ModelFactory extends ModelFactoryBase implements IRedisModelFactory {
    public client: RedisClient;

    constructor(name: string, targetClass: any, connector: IConnector) {
        super(name, targetClass, connector);
    }

    setup() {
        super.init(new ModelActions(this), new ModelHelper(this), new ModelController(this));

        if (Object.keys(this.$prototype).length) {
            this.client = this.connector.getConnection(this.datasource || 'redis');
        }


    }
}