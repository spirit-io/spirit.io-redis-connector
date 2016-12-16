import { ModelFactoryBase } from 'spirit.io/lib/base'
import { IModelFactory, IModelActions, IModelHelper, IModelController } from 'spirit.io/lib/interfaces'
import { ModelActions } from './modelActions';
import { ModelHelper } from './modelHelper';
import { ModelController } from './modelController';
import { ConnectionHelper } from './connectionHelper';
import { RedisClient } from 'redis';
import { Router } from 'express';

let trace;// = console.log;


export class ModelFactory extends ModelFactoryBase {


    public client: RedisClient;
    constructor(name: string, targetClass: any) {
        super(name, targetClass);
    }

    setup(routers: Map<string, Router>) {
        super.init(routers, new ModelActions(this), new ModelHelper(this), new ModelController(this));

        if (Object.keys(this.$prototype).length) {
            this.client = ConnectionHelper.get(this.datasource || 'redis');
        }


    }
}