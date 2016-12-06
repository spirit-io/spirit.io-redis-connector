import { _ } from 'streamline-runtime';
import { Fixtures } from './fixtures';
import { Server } from 'spirit.io/lib/application';
import { MyModel, MyModelRel } from './models/myModel';
import { ModelRegistry, AdminHelper } from 'spirit.io/lib/core';
import { IModelFactory } from 'spirit.io/lib/interfaces';
import { helper as objectHelper } from 'spirit.io/lib/utils';
const expect = require('chai').expect;

let trace = console.log;
let server: Server;

let myModelMeta = {
    $properties: ['_id', '_createdAt', '_updatedAt', 'pString', 'pNumber', 'pDate', 'pBoolean', 'aString', 'aNumber', 'aDate', 'aBoolean', 'inv', 'invs', 'rel', 'rels'],
    $plurals: ['aString', 'aNumber', 'aDate', 'aBoolean', 'invs', 'rels']
};

function removaAllDocuments(_) {
    // delete all myModelRels
    let db = AdminHelper.model(MyModelRel);
    let rels = db.fetchInstances(_);
    rels.forEach_(_, function (_, r) {
        db.deleteInstance(_, r);
    });
    rels = db.fetchInstances(_);
    expect(rels.length).to.equal(0);

    // delete all myModels
    db = AdminHelper.model(MyModel);
    rels = db.fetchInstances(_);
    rels.forEach_(_, function (_, r) {
        db.deleteInstance(_, r);
    });
    rels = db.fetchInstances(_);
    expect(rels.length).to.equal(0);
}

describe('Spirit.io ORM Framework Tests:', () => {

    before(function (done) {
        this.timeout(10000);
        Fixtures.setup(function (err, res) {
            if (err) throw err;
            server = res;
        }, done);
    });

    it('Delete instances should work as expected', (done) => {
        Fixtures.execAsync(done, function (_) {
            removaAllDocuments(_);
        });
    });

    it('Instanciate class should work either with adminHelper or ModelBase methods', (done) => {
        Fixtures.execAsync(done, function (_) {
            // this test does not validate populate as it is not the purpose !

            // instanciate class with ModelBase's save method
            let mRel1: MyModelRel = new MyModelRel({ _id: "id1", p1: "prop1" });
            mRel1.save(_);
            expect(mRel1.p1).to.equal("prop1");

            let mRel2: MyModelRel = new MyModelRel({ _id: "id2", p1: "prop2" });
            mRel2.save(_);
            expect(mRel2.p1).to.equal("prop2");
            let mRel3: MyModelRel = new MyModelRel({ _id: "id3", p1: "prop3" });
            mRel3 = mRel3.save(_);
            expect(mRel3.p1).to.equal("prop3");

            mRel3.p1 = "prop3modified";
            mRel3 = mRel3.save(_);
            expect(mRel3.p1).to.equal("prop3modified");
            // instanciate class with AdminHelper
            let data = {
                "pString": "pString",
                "pNumber": 20,
                "pDate": new Date(),
                "pBoolean": true,
                "aString": ["s1", "s2"],
                "aNumber": [0, 1, 2],
                "aDate": [new Date(), new Date('234567')],
                "aBoolean": [false, true, false],
                "inv": mRel1,
                "rels": [mRel2, mRel3],
                "rel": mRel1
            };
            let db = AdminHelper.model(MyModel);
            let m1: MyModel = new MyModel();
            db.updateValues(m1, null); // update with null data for test coverage
            db.saveInstance(_, m1, data);
            expect(m1.id).to.be.a("string");
            expect(m1.createdAt).to.be.a("Date");
            expect(m1.updatedAt).to.be.a("Date");
            expect(m1.serialize()).to.be.a("object");
            expect(m1.pString).to.equal("pString");
            expect(m1.pNumber).to.equal(20);
            expect(m1.pDate).to.be.a("Date");
            expect(m1.pBoolean).to.equal(true);
            expect(m1.aString).to.have.members(['s1', 's2']);
            expect(m1.aNumber).to.have.members([0, 1, 2]);
            expect(m1.aBoolean).to.have.members([false, true, false]);
            expect(m1.inv).to.be.a("object");
            expect(m1.rel).to.be.a("object");
            expect(objectHelper.areEqual(m1.inv.serialize(), mRel1.serialize())).to.be.true;
            expect(objectHelper.areEqual(m1.rel.serialize(), mRel1.serialize())).to.be.true;
            expect(objectHelper.areEqual(m1.rels[0].serialize(), mRel2.serialize())).to.be.true;
            expect(objectHelper.areEqual(m1.rels[1].serialize(), mRel3.serialize())).to.be.true;
        });
    });


    it('Fetch instances should allow to get relations', (done) => {
        Fixtures.execAsync(done, function (_) {
            let db = AdminHelper.model(MyModel);
            let rels: MyModel[] = db.fetchInstances(_);
            expect(rels.length).to.equal(1);

            expect(rels[0].inv.p1).to.equal('prop1');
            expect(rels[0].rels.length).to.equal(2);
            expect(rels[0].rels[0].p1).to.equal('prop2');
            expect(rels[0].rels[1].p1).to.equal('prop3modified');
            expect(rels[0].rel.p1).to.equal('prop1');
        });
    });

    it('Fetch instances should return correct results even after deleting some instances', (done) => {
        Fixtures.execAsync(done, function (_) {
            let db = AdminHelper.model(MyModelRel);
            let rels = db.fetchInstances(_).sort((a, b) => {
                return a._id > b._id ? 1 : 0;
            });
            expect(rels.length).to.equal(3);

            let rel0 = db.fetchInstance(_, "1234");
            expect(rel0).to.be.null;
            let rel1 = db.fetchInstance(_, rels[0]._id, {});
            expect(rel1).to.be.not.null;
            expect(objectHelper.areEqual(rel1, rels[0])).to.equal(true);

            db.deleteInstance(_, rel1);
            expect(db.fetchInstance(_, rels[0]._id)).to.be.null;
            expect(db.fetchInstances(_).length).to.equal(2);

            let rel3 = db.fetchInstance(_, rels[2]._id, {});
            expect(rel3.p1).to.equal("prop3modified");
        });
    });

    it('Delete instances should work as expected', (done) => {
        Fixtures.execAsync(done, function (_) {
            removaAllDocuments(_);
        });
    });
});