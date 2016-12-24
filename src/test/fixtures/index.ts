import { Server } from 'spirit.io/lib/application';
import { ConnectorHelper } from 'spirit.io/lib/core';
import { RedisConnector } from '../../lib/connector';
import { context, run } from 'f-promise';
import { setup } from 'f-mocha';
import { Fixtures as GlobalFixtures } from 'spirit.io/test/fixtures';
import * as path from 'path';

const port = 3001;
const redisPort = process.env.SPIRIT_REDIS_PORT || 6379;

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
                run(() => {
                    console.log("========== Server initialized ============\n");
                    server.start(port);
                }).catch(err => {
                    done(err);
                });
            });

            server.on('started', function () {
                run(() => {
                    console.log("========== Server started ============\n");
                    // this call activates f-mocha wrapper.
                    setup();
                    done();
                }).catch(err => {
                    done(err);
                });
            });

            run(() => {
                console.log("\n========== Initialize server begins ============");
                connector = new RedisConnector(config.connectors.redis);
                server.addConnector(connector);
                console.log("Connector config: " + JSON.stringify(connector.config, null, 2));
                server.init();
            }).catch(err => {
                done(err);
            });


        } else {
            firstSetup = false;
        }
        //
        // delete the whole database
        let mConnector: RedisConnector = <RedisConnector>ConnectorHelper.getConnector('redis');
        Fixtures.cleanDatabases([mConnector]);
        //
        if (!firstSetup) done();
        return context().__server;
    }
}





