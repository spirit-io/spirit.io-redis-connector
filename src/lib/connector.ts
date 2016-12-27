import { IConnector, IModelFactory } from 'spirit.io/lib/interfaces'
import { ModelFactory } from './modelFactory';
import { RedisClient } from 'redis';

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
    public connections = new Map<string, RedisClient>();

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

    connect(datasourceKey: string): any {
        let parameters = this.config.datasources[datasourceKey];
        let opts = parameters.options;
        let client: RedisClient = <RedisClient>redis.createClient(parameters.uri, opts);
        client.once("connect", () => {
            console.log("Connected on redis: ", parameters.uri);
        });
        client.once("error", (e) => {
            console.log("RedisError: ", e.stack);
        });
        this.connections.set(datasourceKey, client);
        return client;
    }

    getConnection(datasourceKey: string): RedisClient {
        let c = this.connections.get(datasourceKey);
        if (!c) throw new Error(`Connection for '${datasourceKey}' datasource not registered for redis connector. At least one datasource must be defined in your configuration file. Please check 'connect' function has been called or 'autoConnect' flag is set to 'true' in the datasource configuration`);
        return c;
    }

    cleanDb(ds: string): void {
        this.getConnection(ds).flushdb();
    }

    createModelFactory(name: string, myClass: any): IModelFactory {
        return new ModelFactory(name, myClass, this);
    }
}