import { Fixtures } from './fixtures';
import { Server } from 'spirit.io/lib/application';
import { MyModelRel } from './models/myModel';
import { InstanceError } from 'spirit.io/lib/utils';
import { setup } from 'f-mocha';

import * as chai from 'chai';
const expect = chai.expect;

// this call activates f-mocha wrapper.
setup();

let server: Server;

function expectPropertyRequired(e: InstanceError, name: string) {
    expect(e).to.be.not.undefined;
    expect(e.$diagnoses).to.be.not.null;
    expect(e.$diagnoses.length).to.be.equal(1);
    expect(e.$diagnoses[0].$severity).to.be.equal('error');
    expect(e.$diagnoses[0].$message).to.be.equal(`ValidatorError: Property \`${name}\` is required.`);
    expect(e.$diagnoses[0].$stack).to.be.not.null;
}
describe('*** Spirit.io validators Tests ***', () => {

    before(function (done) {
        this.timeout(10000);
        server = Fixtures.setup(done);
    });

    describe('* standard `required` validator using ORM:', () => {
        it('should reject create operation with missing required property value', () => {
            let mRel1: MyModelRel;
            let e;
            try {
                mRel1 = new MyModelRel({});
                mRel1.save();
            } catch (err) {
                e = err;
            } finally {
                expectPropertyRequired(e, 'p1');
            }
        });

        it('should reject update operation with missing required property value', () => {
            let mRel1: MyModelRel = new MyModelRel({ p1: "value1" });;
            let e;
            try {
                mRel1.save({ p1: null });
            } catch (err) {
                e = err;
            } finally {
                expectPropertyRequired(e, 'p1');
            }
        });
    });

    describe('* standard `required` validator using REST API:', () => {
        it('should reject POST request with missing required property value', () => {
            let resp = Fixtures.post('/api/v1/myModelRel', {});
            let body = JSON.parse(resp.body);
            expect(resp.status).to.equal(500);
            expect(body.$diagnoses).to.be.not.null;
            expect(body.$diagnoses.length).to.be.equal(1);
            expect(body.$diagnoses[0].$severity).to.be.equal('error');
            expect(body.$diagnoses[0].$message).to.be.equal('ValidatorError: Property `p1` is required.');
            expect(body.$diagnoses[0].$stackTrace).to.be.not.null;
        });

        it('should reject PUT request with missing required property value', () => {

            let resp = Fixtures.post('/api/v1/myModelRel', { p1: "testPutMissingProp" });
            expect(resp.status).to.equal(201);
            let body = JSON.parse(resp.body);
            let id = body._id;

            resp = Fixtures.put('/api/v1/myModelRel/' + id, { p1: null });
            body = JSON.parse(resp.body);
            expect(resp.status).to.equal(500);
            expect(body.$diagnoses).to.be.not.null;
            expect(body.$diagnoses.length).to.be.equal(1);
            expect(body.$diagnoses[0].$severity).to.be.equal('error');
            expect(body.$diagnoses[0].$message).to.be.equal('ValidatorError: Property `p1` is required.');
            expect(body.$diagnoses[0].$stackTrace).to.be.not.null;
        });

        it('should reject PATCH request with missing required property value', () => {

            let resp = Fixtures.post('/api/v1/myModelRel', { p1: "testPatchMissingProp" });
            expect(resp.status).to.equal(201);
            let body = JSON.parse(resp.body);
            let id = body._id;

            resp = Fixtures.patch('/api/v1/myModelRel/' + id, { p1: null });
            body = JSON.parse(resp.body);
            expect(resp.status).to.equal(500);
            expect(body.$diagnoses).to.be.not.null;
            expect(body.$diagnoses.length).to.be.equal(1);
            expect(body.$diagnoses[0].$severity).to.be.equal('error');
            expect(body.$diagnoses[0].$message).to.be.equal('ValidatorError: Property `p1` is required.');
            expect(body.$diagnoses[0].$stackTrace).to.be.not.null;
        });
    });


});