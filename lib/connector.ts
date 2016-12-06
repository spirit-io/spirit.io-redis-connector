import { IConnector, IModelFactory } from 'spirit.io/lib/interfaces'
import { ConnectionHelper } from './connectionHelper';
import { ModelFactory } from './modelFactory';

const redis = require("redis");

export class RedisConnector implements IConnector {
    private _datasource: string = 'redis';
    private _config: any;

    constructor(ds?: string) {
        if (ds) this._datasource = ds;
    }

    get datasource(): string {
        return this._datasource;
    }

    set config(config: any) {
        this._config = config || {};
        if (this._config.client) {
            if (this._config.client.debug) redis.debug_mode = true;
        }
    }
    get config() {
        return this._config;
    }

    connect(datasourceKey: string, parameters: any): any {
        ConnectionHelper.connect(datasourceKey, parameters);
    }

    createModelFactory(name: string, myClass: any): IModelFactory {
        return new ModelFactory(name, myClass);
    }
}