import { Server } from 'spirit.io/lib/application';
import { RedisConnector } from '../../lib/connector';
import { ConnectorHelper } from 'spirit.io/lib/core';
import { devices } from 'f-streams';
import { context } from 'f-promise';
import { Fixtures as GlobalFixtures } from 'spirit.io/test/fixtures';

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

export class Fixtures extends GlobalFixtures {

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
}





