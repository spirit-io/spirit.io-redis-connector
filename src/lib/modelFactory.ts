import { ModelFactoryBase } from 'spirit.io/lib/base'
import { IConnector, IModelFactory, IModelActions, IModelHelper, IModelController } from 'spirit.io/lib/interfaces'
import { ModelActions } from './modelActions';
import { ModelHelper } from './modelHelper';
import { ModelController } from './modelController';
import { RedisClient } from 'redis';
import { Router } from 'express';

let trace;// = console.log;

export interface IRedisModelFactory extends IModelFactory {
    client: RedisClient;
}

export class ModelFactory extends ModelFactoryBase implements IRedisModelFactory {


    public client: RedisClient;
    constructor(name: string, targetClass: any, connector: IConnector) {
        super(name, targetClass, connector);
    }

    setup(routers: Map<string, Router>) {
        super.init(routers, new ModelActions(this), new ModelHelper(this), new ModelController(this));

        if (Object.keys(this.$prototype).length) {
            this.client = this.connector.getConnection(this.datasource || 'redis');
        }


    }
}