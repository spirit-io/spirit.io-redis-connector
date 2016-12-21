import { RedisClient } from 'redis';
import { context } from 'f-promise';
const redis = require("redis");

context()['redisConnections'] = new Map<string, RedisClient>();

export class ConnectionHelper {
    public static connect(datasourceKey: string, parameters: any): RedisClient {
        let opts = parameters.options;
        let client: RedisClient = <RedisClient>redis.createClient(parameters.uri, opts);
        client.once("connect", () => {
            console.log("Connected on redis: ", parameters.uri);
        });
        client.once("error", (e) => {
            console.log("RedisError: ", e.stack);
        });
        context()['redisConnections'].set(datasourceKey, client);
        return client;
    }

    public static get(datasourceKey: string): RedisClient {
        let c = context()['redisConnections'].get(datasourceKey);
        if (!c) throw new Error(`Datasource '${datasourceKey}' not registered. At least one datasource must be defined in your configuration file.`);
        return c;
    }
}