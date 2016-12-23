import { Fixtures } from './fixtures';
import { Server } from 'spirit.io/lib/application';
import { helper as objectHelper } from 'spirit.io/lib/utils';
import { setup } from 'f-mocha';
import * as chai from 'chai';
const expect = chai.expect;

// this call activates f-mocha wrapper.
setup();

let server: Server;

describe('Spirit.io REST Express routes Tests:', () => {
    before(function (done) {
        this.timeout(10000);
        server = Fixtures.setup(done);
    });

    it('query with invalid where filter should throw an error', () => {
        let resp = Fixtures.get('/api/v1/myModel?where=badJson');

        let body = JSON.parse(resp.body);
        expect(resp.status).to.equal(500);
        expect(body.$diagnoses[0].$message).to.equal(`Invalid where filter: badJson`);
    });

    it('query should return empty array', () => {
        let resp = Fixtures.get('/api/v1/myModel');
        let body = JSON.parse(resp.body);
        expect(resp.status).to.equal(200);
        expect(body).to.be.a('array');
        expect(body.length).to.equal(0);
    });

    it('read should return not found', () => {
        let resp = Fixtures.get('/api/v1/myModel/1234');
        expect(resp.status).to.equal(404);
    });

    it('create simple instance should work', () => {
        let resp = Fixtures.post('/api/v1/myModelRel', { _id: "id1", p1: "prop1" });
        let body = JSON.parse(resp.body);
        expect(resp.status).to.equal(201);
        expect(body.p1).to.equal("prop1");
        expect(body._id).to.be.a("string");
        expect(body._createdAt).to.be.not.null;
        expect(body._updated).to.be.not.null;
        expect(new Date(body._createdAt)).to.be.a("Date");
        expect(new Date(body._updated)).to.be.a("Date");

        // create 3 more
        Fixtures.post('/api/v1/myModelRel', { _id: "id2", p1: "prop2" });
        Fixtures.post('/api/v1/myModelRel', { _id: "id3", p1: "prop3" });
        Fixtures.post('/api/v1/myModelRel', { _id: "id4", p1: "prop4" });
    });

    let myModelRels = [];

    it('query should return the four created elements', () => {
        let resp = Fixtures.get('/api/v1/myModelRel');
        let body = JSON.parse(resp.body);
        expect(resp.status).to.equal(200);
        expect(body).to.be.a('array');
        expect(body.length).to.equal(4);
        body.sort((a, b) => {
            return a._id > b._id;
        }).forEach((rel) => {
            myModelRels.push(rel._id);
        });
    });

    it('not expected property should raise an error on creation', () => {
        let resp = Fixtures.post('/api/v1/myModelRel', { p1: "prop1", p2: "prop2" });
        let body = JSON.parse(resp.body);
        expect(resp.status).to.equal(500);
        expect(body.$diagnoses[0].$message).to.equal(`Property 'p2' does not exist on model 'MyModelRel'`);
    });


    function checkComplexInstance(body, pStringValue) {
        expect(body.pString).to.equal(pStringValue);
        expect(body.pNumber).to.equal(20);
        expect(new Date(body.pDate)).to.be.a("Date");
        expect(body.pBoolean).to.equal(true);
        expect(body.aString).to.have.members(['s1', 's2']);
        expect(body.aNumber).to.have.members([0, 1, 2]);
        expect(body.aBoolean).to.have.members([false, true, false]);
        expect(body.inv).to.be.a("string");
        expect(body.inv).to.equal(myModelRels[0]);
        expect(body.rels).to.have.members([myModelRels[1], myModelRels[2]]);
        expect(body._id).to.be.a("string");
        expect(body._createdAt).to.be.not.null;
        expect(body._updated).to.be.not.null;
        expect(new Date(body._createdAt)).to.be.a("Date");
        expect(new Date(body._updated)).to.be.a("Date");
    }

    let myModel = [];
    let data: any = {}
    it('create complex instance should work and return correct values', () => {
        data = {
            "pString": "s0",
            "pNumber": 20,
            "pDate": new Date(),
            "pBoolean": true,
            "aString": ["s1", "s2"],
            "aNumber": [0, 1, 2],
            "aDate": [new Date(), new Date(Date.now() - 10000)],
            "aBoolean": [false, true, false],
            "inv": myModelRels[0],
            "rels": [myModelRels[1], myModelRels[2]],
        };

        let resp = Fixtures.get('/api/v1/myModelRel/' + myModelRels[2]);
        expect(resp.status).to.equal(200);
        data.rel = JSON.parse(resp.body);

        resp = Fixtures.post('/api/v1/myModel', data);
        expect(resp.status).to.equal(201);

        let body = JSON.parse(resp.body);
        checkComplexInstance(body, 's0');

        // check embedded relation
        expect(objectHelper.areEqual(body.rel, data.rel)).to.equal(true);
        myModel.push(body._id);
    });

    it('update complex instance with all values should work and return correct values', () => {
        data.pString = "s0updated";
        let resp = Fixtures.put('/api/v1/myModel/' + myModel[0], data);
        expect(resp.status).to.equal(200);
        let body = JSON.parse(resp.body);
        checkComplexInstance(body, 's0updated');
    });

    it('read updated instance should return correct values', () => {
        let resp = Fixtures.get('/api/v1/myModel/' + myModel[0]);
        expect(resp.status).to.equal(200);
        let body = JSON.parse(resp.body);
        checkComplexInstance(body, 's0updated');
    });

    it('patch complex instance with only one property should work and return correct values', () => {
        let resp = Fixtures.patch('/api/v1/myModel/' + myModel[0], { pString: "s0patched" });
        expect(resp.status).to.equal(200);
        let body = JSON.parse(resp.body);
        checkComplexInstance(body, 's0patched');
    });

    it('read singular reference should work and return correct values', () => {
        let resp = Fixtures.get('/api/v1/myModel/' + myModel[0] + '/inv');
        expect(resp.status).to.equal(200);
        let body = JSON.parse(resp.body);
        let ref = JSON.parse(Fixtures.get('/api/v1/myModelRel/' + myModelRels[0]).body);
        expect(objectHelper.areEqual(body, ref)).to.equal(true);
    });

    it('query with includes should return expected elements and references', () => {
        // simple string include
        let resp = Fixtures.get('/api/v1/myModel?includes=inv');
        let body = JSON.parse(resp.body);
        expect(resp.status).to.equal(200);

        // simple object include
        resp = Fixtures.get('/api/v1/myModel?includes={"path": "inv"}');
        let body2 = JSON.parse(resp.body);
        expect(resp.status).to.equal(200);
        expect(body).to.be.a('array');
        expect(objectHelper.areEqual(body, body2)).to.be.true;
        expect(body.length).to.equal(1);
        expect(body[0].inv).to.be.a('object');
        expect(body[0].inv._id).to.equal(myModelRels[0]);
        expect(body[0].inv._id).to.be.a("string");
        expect(body[0].inv.p1).to.equal('prop1');
        expect(body[0].inv._createdAt).to.be.not.null;
        expect(body[0].inv._updated).to.be.not.null;
        expect(new Date(body[0].inv._createdAt)).to.be.a("Date");
        expect(new Date(body[0].inv._updated)).to.be.a("Date");

        // string include with select
        resp = Fixtures.get('/api/v1/myModel?includes=inv.p1');
        body = JSON.parse(resp.body);
        expect(resp.status).to.equal(200);
        expect(body).to.be.a('array');
        expect(body.length).to.equal(1);
        expect(body[0].inv).to.be.a('object');
        expect(body[0].inv._id).to.equal(myModelRels[0]);
        expect(body[0].inv._id).to.be.a("string");
        expect(body[0].inv.p1).to.equal('prop1');
        expect(body[0].inv._createdAt).to.be.undefined;
        expect(body[0].inv._updated).to.be.undefined;

        // object include with select
        resp = Fixtures.get('/api/v1/myModel?includes={"path": "inv", "select": "_createdAt"}');
        body = JSON.parse(resp.body);
        expect(resp.status).to.equal(200);
        expect(body).to.be.a('array');
        expect(body.length).to.equal(1);
        expect(body[0].inv).to.be.a('object');
        expect(body[0].inv._id).to.equal(myModelRels[0]);
        expect(body[0].inv._id).to.be.a("string");
        expect(body[0].inv.p1).to.be.undefined;
        expect(body[0].inv._createdAt).to.be.not.null;
        expect(body[0].inv._updated).to.be.undefined;
        expect(new Date(body[0].inv._createdAt)).to.be.a("Date");

        // multiple include with select on one of them
        resp = Fixtures.get('/api/v1/myModel?includes=inv.p1,rels');
        body = JSON.parse(resp.body);
        expect(resp.status).to.equal(200);
        expect(body).to.be.a('array');
        expect(body.length).to.equal(1);
        expect(body[0].inv).to.be.a('object');
        expect(body[0].inv._id).to.equal(myModelRels[0]);
        expect(body[0].inv._id).to.be.a("string");
        expect(body[0].inv.p1).to.equal('prop1');
        expect(body[0].inv._createdAt).to.be.undefined;
        expect(body[0].inv._updated).to.be.undefined;

        expect(body[0].rels).to.be.a('array');
        expect(body[0].rels.length).to.equal(2);
        expect(body[0].rels[0]._id).to.be.a("string");
        expect(body[0].rels[0].p1).to.equal('prop2');
        expect(body[0].rels[0]._createdAt).to.be.not.null;
        expect(body[0].rels[0]._updated).to.be.not.null;
        expect(new Date(body[0].rels[0]._createdAt)).to.be.a("Date");
        expect(new Date(body[0].rels[0]._updated)).to.be.a("Date");

        // bad object include should throw an error
        resp = Fixtures.get('/api/v1/myModel?includes={wrong}}');
        body = JSON.parse(resp.body);
        expect(resp.status).to.equal(500);
        expect(body.$diagnoses[0].$message).to.equal(`JSON includes filter is not valid`);
    });

    it('update complex instance with only one property should work and return only provided values', () => {
        let resp = Fixtures.put('/api/v1/myModel/' + myModel[0], { pString: "s0updatedAgain", pNumber: 0 });
        expect(resp.status).to.equal(200);
        let body = JSON.parse(resp.body);

        expect(body.pString).to.equal("s0updatedAgain");
        expect(body.pNumber).to.equal(0);
        expect(body.pDate).to.equal(undefined);
        expect(body.pBoolean).to.equal(undefined);
        expect(body.aString).to.be.empty;
        expect(body.aNumber).to.be.empty;
        expect(body.aBoolean).be.empty;
        expect(body.inv).to.equal(undefined);
        expect(body.inv).to.equal(undefined);
        expect(body.rels).to.be.empty;
        expect(body.invs).to.be.empty;

        expect(body._id).to.be.a("string");
        expect(body._createdAt).to.be.not.null;
        expect(body._updated).to.be.not.null;
        expect(new Date(body._createdAt)).to.be.a("Date");
        expect(new Date(body._updated)).to.be.a("Date");
    });

    it('execute instance method should work and saved instance should be updated', () => {
        let resp = Fixtures.post('/api/v1/myModel/' + myModel[0] + '/$execute/aMethod', { pString: "pString updated by aMethod call", anotherParam: 'test' });
        expect(resp.status).to.equal(200);
        let body = JSON.parse(resp.body);
        // TODO: manage responses structure with diagnoses maybe ?
        resp = Fixtures.get('/api/v1/myModel/' + myModel[0]);
        expect(resp.status).to.equal(200);
        body = JSON.parse(resp.body);
        expect(body.pString).to.equal("pString updated by aMethod call");
    });

    it('execute instance service should work and return expected value', () => {
        let resp = Fixtures.post('/api/v1/myModel/$service/aService', { a: 2.22, b: 3.33 });
        expect(resp.status).to.equal(200);
        let body = JSON.parse(resp.body);
        expect(body.c).to.equal('5.55');
    });


    it('query should return nothing after deleting all elements', () => {

        myModelRels.forEach((r) => {
            let resp = Fixtures.delete('/api/v1/myModelRel/' + r);
            expect(resp.status).to.equal(204);
        });


        let resp = Fixtures.get('/api/v1/myModelRel');
        let body = JSON.parse(resp.body);
        expect(resp.status).to.equal(200);
        expect(body).to.be.a('array');
        expect(body.length).to.equal(0);

        myModel.forEach((m) => {
            let resp = Fixtures.delete('/api/v1/myModel/' + m);
            expect(resp.status).to.equal(204);
        });

        resp = Fixtures.get('/api/v1/myModel');
        body = JSON.parse(resp.body);
        expect(resp.status).to.equal(200);
        expect(body).to.be.a('array');
        expect(body.length).to.equal(0);
    });



});