"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const InsightFacade_1 = require("../src/controller/InsightFacade");
const chai = require("chai");
const chaiHttp = require("chai-http");
describe("Facade D3", function () {
    let facade = null;
    let server = null;
    chai.use(chaiHttp);
    before(function () {
        facade = new InsightFacade_1.default();
    });
    after(function () {
    });
    beforeEach(function () {
    });
    afterEach(function () {
    });
});
//# sourceMappingURL=Server.spec.js.map