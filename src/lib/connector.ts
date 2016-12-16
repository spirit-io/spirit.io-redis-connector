import { IConnector, IModelFactory } from 'spirit.io/lib/interfaces'
import { ConnectionHelper } from './connectionHelper';
import { ModelFactory } from './modelFactory';

const redis = require("redis");
const bluebird = require("bluebird");
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);


// override redis module declaration to get intellisense on Async methods
// Check with future version of typescript because of error: TS2451: Cannot redeclare block-scoped variable '_'
//
// declare module "redis" {
//     export interface RedisClient extends NodeJS.EventEmitter {
//         setAsync(key: string, value: string): Promise<void>;
//         getAsync(key: string): Promise<string>;
//         mgetAsync(keys: string[]): Promise<string>;
//         keysAsync(key: string): Promise<string>;
//     }
// }

export class RedisConnector implements IConnector {
    private _datasource: string = 'redis';
    private _config: any;

    constructor(config: any) {
        this._config = config;
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