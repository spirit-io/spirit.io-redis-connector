import { IModelActions, IParameters } from 'spirit.io/lib/interfaces';
import { IRedisModelFactory } from './modelFactory';
import { wait } from 'f-promise';

const uuid = require('uuid');

function ensureId(item: any) {
    item._id = item._id || uuid.v4();
}

export class ModelActions implements IModelActions {

    constructor(private modelFactory: IRedisModelFactory) { }

    private _populate(item: any, parameters: IParameters) {
        parameters = parameters || {};
        Object.keys(this.modelFactory.$references).forEach((key) => {
            this.modelFactory.populateField(parameters, item, key);
        });
    }

    query(filter: Object = {}, options?: IParameters): any[] {
        options = options || {};
        let key = `${this.modelFactory.collectionName}:*`;

        // call Async functions promisified by bluebird to get promise
        let keys: any = wait((<any>this.modelFactory.client).keysAsync(key));
        if (!keys.length) return [];
        let arr: any = wait((<any>this.modelFactory.client).mgetAsync(keys));
        let objects: any[] = arr.map((obj) => {
            let res = JSON.parse(obj);
            if (options.includes) this._populate(res, options);
            return res;
        });
        return objects;
    }

    read(filter: any, options?: IParameters): any {
        options = options || {};
        let key = `${this.modelFactory.collectionName}:${filter}`;
        if (!this.modelFactory.client.exists(key)) return null;
        let res: any = wait((<any>this.modelFactory.client).getAsync(key));
        if (options.includes) this._populate(res, options);
        if (!res) {
            return null;
        } else {
            res = JSON.parse(res);
            if (options.ref) {
                let refModelFactory = this.modelFactory.getModelFactoryByPath(options.ref);
                let field = this.modelFactory.$fields.get(options.ref);
                if (field.isPlural) {
                    let keys = res[options.ref];
                    return refModelFactory.actions.query(keys, { includes: options.includes });
                } else {
                    return refModelFactory.actions.read(res[options.ref], { includes: options.includes });
                }
            } else {
                return res;
            }
        }
    }

    create(item: any, options?: IParameters): any {
        ensureId(item);
        item._createdAt = new Date();
        return this.update(item._id, item, options);
    }

    update(_id: any, item: any, options?: IParameters): any {
        options = options || {};
        let key = `${this.modelFactory.collectionName}:${_id}`;
        item._updatedAt = new Date();
        let itemToStore = this.modelFactory.simplifyReferences(item);
        wait((<any>this.modelFactory.client).msetAsync(key, JSON.stringify(itemToStore)));
        if (options.includes) this._populate(itemToStore, options);
        return item;
    }

    delete(_id: any) {
        let key = `${this.modelFactory.collectionName}:${_id}`;
        return wait((<any>this.modelFactory.client).delAsync(key));
    }

}