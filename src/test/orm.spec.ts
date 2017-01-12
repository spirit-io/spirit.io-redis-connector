import { Fixtures } from './fixtures';
import { Server } from 'spirit.io/lib/application';
import { MyModel, MyModelRel } from './models/myModel';
import { AdminHelper } from 'spirit.io/lib/core';
import { helper as objectHelper } from 'spirit.io/lib/utils';
import { setup } from 'f-mocha';
import * as chai from 'chai';
const expect = chai.expect;

// this call activates f-mocha wrapper.
setup();

let server: Server;

function removaAllDocuments() {
    // delete all myModelRels
    let db = AdminHelper.model(MyModelRel);
    let rels = db.fetchInstances();
    rels.forEach(function (r) {
        db.deleteInstance(r);
    });
    rels = db.fetchInstances();
    expect(rels.length).to.equal(0);

    // delete all myModels
    db = AdminHelper.model(MyModel);
    rels = db.fetchInstances();
    rels.forEach(function (r) {
        db.deleteInstance(r);
    });
    rels = db.fetchInstances();
    expect(rels.length).to.equal(0);
}

describe('*** Spirit.io ORM Framework Tests ***', () => {

    before(function (done) {
        this.timeout(10000);
        server = Fixtures.setup(done);
    });
    it('Delete instances should work as expected', () => {
        removaAllDocuments();
    });

    it('Instanciate class should work either with adminHelper or ModelBase methods', () => {
        // this test does not validate populate as it is not the purpose !

        // instanciate class with ModelBase's save method
        let mRel1: MyModelRel = new MyModelRel({ _id: "id1", p1: "prop1" });
        mRel1.save();
        expect(mRel1.p1).to.equal("prop1");

        let mRel2: MyModelRel = new MyModelRel({ _id: "id2", p1: "prop2" });
        mRel2.save();
        expect(mRel2.p1).to.equal("prop2");
        let mRel3: MyModelRel = new MyModelRel({ _id: "id3", p1: "prop3" });
        mRel3 = mRel3.save();
        expect(mRel3.p1).to.equal("prop3");

        mRel3.p1 = "prop3modified";
        mRel3 = mRel3.save();
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
        db.saveInstance(m1, data);
        expect(m1._id).to.be.a("string");
        expect(m1._createdAt).to.be.a("Date");
        expect(m1._updatedAt).to.be.a("Date");
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


    it('Fetch instances should allow to get relations', () => {
        let db = AdminHelper.model(MyModel);
        let rels: MyModel[] = db.fetchInstances();
        expect(rels.length).to.equal(1);

        expect(rels[0].inv.p1).to.equal('prop1');
        expect(rels[0].rels.length).to.equal(2);
        expect(rels[0].rels[0].p1).to.equal('prop2');
        expect(rels[0].rels[1].p1).to.equal('prop3modified');
        expect(rels[0].rel.p1).to.equal('prop1');
    });

    it('Fetch instances should return correct results even after deleting some instances', () => {
        let db = AdminHelper.model(MyModelRel);
        let rels = db.fetchInstances().sort((a, b) => {
            return a._id > b._id ? 1 : 0;
        });
        expect(rels.length).to.equal(3);

        let rel0 = db.fetchInstance("1234");
        expect(rel0).to.be.null;
        let rel1 = db.fetchInstance(rels[0]._id, {});
        expect(rel1).to.be.not.null;
        expect(objectHelper.areEqual(rel1, rels[0])).to.equal(true);

        db.deleteInstance(rel1);
        expect(db.fetchInstance(rels[0]._id)).to.be.null;
        expect(db.fetchInstances().length).to.equal(2);

        let rel3 = db.fetchInstance(rels[2]._id, {});
        expect(rel3.p1).to.equal("prop3modified");
    });

    it('Delete instances should work as expected', () => {
        removaAllDocuments();
    });
});