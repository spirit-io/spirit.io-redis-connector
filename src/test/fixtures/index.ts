import { Server } from 'spirit.io/lib/application';
import { RedisConnector } from '../../lib/connector';
import { ConnectorHelper } from 'spirit.io/lib/core';
import { devices } from 'f-streams';
import { context } from 'f-promise';
const path = require('path');

let trace;// = console.log;

const port = 3001;
const redisPort = process.env.SPIRIT_REDIS_PORT || 6379;
const baseUrl = 'http://localhost:' + port;

const config = {
    modelsLocation: path.resolve(path.join(__dirname, '../models')),
    connectors: {
        redis: {
            datasources: {
                "redis": {
                    uri: "redis://localhost:" + redisPort + "/0",
                    options: {}
                }
            },
            client: {
                debug: false
            }
        }
    }

};


function request(method: string, url: string, data?: any, headers?: any) {
    headers = headers || {
        'content-type': 'application/json'
    };
    trace && trace("HTTP " + method + " " + baseUrl + url);
    let cli = devices.http.client({
        url: baseUrl + url,
        method: method,
        headers: headers
    })

    let resp = cli.proxyConnect().end(data != null ? JSON.stringify(data) : undefined).response();

    return {
        status: resp.statusCode,
        headers: resp.headers,
        body: resp.readAll()
    };
}

export class Fixtures {

    static setup = (done) => {
        let firstSetup = true;
        let connector;
        if (!context().__server) {
            let server: Server = context().__server = new Server(config);
            server.on('initialized', function () {
                console.log("========== Server initialized ============\n");
                done();
            });
            console.log("\n========== Initialize server begins ============");
            connector = new RedisConnector(config.connectors.redis);
            server.addConnector(connector);
            console.log("Connector config: " + JSON.stringify(connector.config, null, 2));
            server.init();
            server.start(port);
        } else {
            firstSetup = false;
            connector = <RedisConnector>ConnectorHelper.getConnector('redis');

        }
        //

        //
        if (!firstSetup) done();
        return context().__server;
    }

    static get = (url: string, headers?: any) => {
        return request('GET', url, null, headers);
    }

    static post = (url: string, data: any, headers?: any) => {
        return request('POST', url, data, headers);
    }

    static put = (url: string, data: any, headers?: any) => {
        return request('PUT', url, data, headers);
    }

    static delete = (url: string, headers?: any) => {
        return request('DELETE', url, null, headers);
    }

    static patch = (url: string, headers?: any) => {
        return request('PATCH', url, headers);
    }

    static execAsync = (done, fn): void => {
        fn(function (err, res) {
            if (err) done(err);
            else done();
        });
    }
}





