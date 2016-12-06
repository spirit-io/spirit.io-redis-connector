import { _ } from 'streamline-runtime';
import { IModelActions, IFetchParameters, IQueryParameters } from 'spirit.io/lib/interfaces';
import { ModelRegistry } from 'spirit.io/lib/core';
import { ModelFactory } from './modelFactory';
import { helper as objectHelper } from 'spirit.io/lib/utils'

const uuid = require('uuid');

function ensureId(item: any) {
    item._id = item._id || uuid.v4();
}

export class ModelActions implements IModelActions {

    constructor(private modelFactory: ModelFactory) { }

    private _populate(_: _, item: any, parameters: IFetchParameters | IQueryParameters) {
        parameters = parameters || {};
        Object.keys(this.modelFactory.$references).forEach_(_, (_, key) => {
            this.modelFactory.populateField(_, parameters, item, key);
        });
    }

    query(_: _, filter: Object = {}, options?: any) {
        options = options || {};
        let key = `${this.modelFactory.collectionName}:*`;
        let keys: any = this.modelFactory.client.keys(key, _);
        if (!keys.length) return [];
        let objects: Object[] = (<any>this.modelFactory.client.mget(keys, _)).map_(_, (_, obj) => {
            let res = JSON.parse(obj);
            if (options.includes) this._populate(_, res, options);
            return res;
        });
        return objects;
    }

    read(_: _, filter: any, options?: any) {
        options = options || {};
        let key = `${this.modelFactory.collectionName}:${filter}`;
        if (!this.modelFactory.client.exists(key)) return null;
        let res: any = this.modelFactory.client.get(key, _);
        if (options.includes) this._populate(_, res, options);
        if (!res) {
            return null;
        } else {
            res = JSON.parse(res);
            if (options.ref) {
                let refRes: any;
                let refModelFactory = this.modelFactory.getModelFactoryByPath(options.ref);
                let field = this.modelFactory.$fields.get(options.ref);
                if (field.isPlural) {
                    let keys = res[options.ref];
                    return refModelFactory.actions.query(_, keys, { includes: options.includes });
                } else {
                    return refModelFactory.actions.read(_, res[options.ref], { includes: options.includes });
                }
            } else {
                return res;
            }
        }
    }

    create(_: _, item: any, options?: any) {
        ensureId(item);
        item._createdAt = new Date();
        return this.update(_, item._id, item, options);
    }

    update(_: _, _id: any, item: any, options?: any) {
        options = options || {};
        let key = `${this.modelFactory.collectionName}:${_id}`;
        item._updatedAt = new Date();
        let itemToStore = this.modelFactory.simplifyReferences(item);
        let res = this.modelFactory.client.mset(key, JSON.stringify(itemToStore), _);
        if (options.includes) this._populate(_, itemToStore, options);
        return item;
    }

    delete(_: _, _id: any) {
        let key = `${this.modelFactory.collectionName}:${_id}`;
        return this.modelFactory.client.del(key, _);
    }

}