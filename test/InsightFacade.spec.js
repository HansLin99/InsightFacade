"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai = require("chai");
const chai_1 = require("chai");
const fs = require("fs-extra");
const chaiAsPromised = require("chai-as-promised");
const IInsightFacade_1 = require("../src/controller/IInsightFacade");
const InsightFacade_1 = require("../src/controller/InsightFacade");
const Util_1 = require("../src/Util");
const TestUtil_1 = require("./TestUtil");
describe("InsightFacade Add/Remove/List Dataset", function () {
    const datasetsToLoad = {
        "courses": "./test/data/courses.zip",
        "partialCourses": "./test/data/partialCourses.zip",
        "partialCoursesInvalid": "./test/data/partialCoursesInvalid.zip",
        "coursesSmall": "./test/data/coursesSmall.zip",
        "corrupted": "./test/data/corrupted.zip",
        "noCourseFolder": "./test/data/noCourseFolder.zip",
        "multipleFolders": "./test/data/multipleFolders.zip",
        "1_3": "./test/data/1_3.zip",
        "   ": "./test/data/   .zip",
        "": "./test/data/.zip",
        "1 2 3": "./test/data/1 2 3.zip",
        "noContent": "./test/data/noContent.zip",
        "noValidContent": "./test/data/noValidContent.zip",
        "_ _": "./test/data/_ _.zip",
        "1 3 4": "./test/data/1 3 4.zip",
        "noRoomFolder": "./test/data/noRoomFolder.zip",
        "rooms": "./test/data/rooms.zip",
    };
    let datasets = {};
    let insightFacade;
    const cacheDir = __dirname + "/../data";
    before(function () {
        Util_1.default.test(`Before all`);
        chai.use(chaiAsPromised);
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir);
        }
        for (const id of Object.keys(datasetsToLoad)) {
            datasets[id] = fs
                .readFileSync(datasetsToLoad[id])
                .toString("base64");
        }
        try {
            insightFacade = new InsightFacade_1.default();
        }
        catch (err) {
            Util_1.default.error(err);
        }
    });
    beforeEach(function () {
        Util_1.default.test(`BeforeTest: ${this.currentTest.title}`);
    });
    after(function () {
        Util_1.default.test(`After: ${this.test.parent.title}`);
    });
    afterEach(function () {
        Util_1.default.test(`AfterTest: ${this.currentTest.title}`);
        try {
            fs.removeSync(cacheDir);
            fs.mkdirSync(cacheDir);
            insightFacade = new InsightFacade_1.default();
        }
        catch (err) {
            Util_1.default.error(err);
        }
    });
    it("Should add a valid dataset", function () {
        const id = "coursesSmall";
        const expected = ["coursesSmall"];
        const futureResult = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        return chai_1.expect(futureResult).to.eventually.deep.equals(expected);
    });
    it("Should the dataset has valid id that contains not only white spaces", function () {
        const idInvalid = "   ";
        const futureResult = insightFacade.addDataset(idInvalid, datasets[idInvalid], IInsightFacade_1.InsightDatasetKind.Courses);
        return chai_1.expect(futureResult).to.be.rejectedWith(IInsightFacade_1.InsightError);
    });
    it("Should the dataset has valid id that isn't 0 length", function () {
        const idInvalid = "";
        const futureResult = insightFacade.addDataset(idInvalid, datasets[idInvalid], IInsightFacade_1.InsightDatasetKind.Courses);
        return chai_1.expect(futureResult).to.be.rejectedWith(IInsightFacade_1.InsightError);
    });
    it("Should reject the dataset has multiple folders", function () {
        const id = "multipleFolders";
        const futureResult = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        return chai_1.expect(futureResult).to.be.rejectedWith(IInsightFacade_1.InsightError);
    });
    it("Should reject the dataset has no course folder", function () {
        const id = "noCourseFolder";
        const futureResult = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        return chai_1.expect(futureResult).to.be.rejectedWith(IInsightFacade_1.InsightError);
    });
    it("Should reject the dataset has no content", function () {
        const id = "noContent";
        const futureResult = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        return chai_1.expect(futureResult).to.be.rejectedWith(IInsightFacade_1.InsightError);
    });
    it("Should reject the dataset has no valid content", function () {
        const id = "noValidContent";
        const futureResult = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        return chai_1.expect(futureResult).to.be.rejectedWith(IInsightFacade_1.InsightError);
    });
    it("Should the dataset has no kind of Room & id blank", function () {
        const id = "";
        const futureResult = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Rooms);
        return chai_1.expect(futureResult).to.be.rejectedWith(IInsightFacade_1.InsightError);
    });
    it("Should the dataset has valid id that contains no underscore", function () {
        const idInvalid = "1_3";
        const futureResult = insightFacade.addDataset(idInvalid, datasets[idInvalid], IInsightFacade_1.InsightDatasetKind.Courses);
        return chai_1.expect(futureResult).to.be.rejectedWith(IInsightFacade_1.InsightError);
    });
    it("Should the dataset has valid id that contains no underscore & space", function () {
        const idInvalid = "_ _";
        const futureResult = insightFacade.addDataset(idInvalid, datasets[idInvalid], IInsightFacade_1.InsightDatasetKind.Courses);
        return chai_1.expect(futureResult).to.be.rejectedWith(IInsightFacade_1.InsightError);
    });
    it("Should the dataset has valid id that contains not only white spaces", function () {
        const idInvalid = "\n\n  ";
        const id = "courses";
        const futureResult = insightFacade.addDataset(idInvalid, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        return chai_1.expect(futureResult).to.be.rejectedWith(IInsightFacade_1.InsightError);
    });
    it("Should not add duplicate dataset", function () {
        const id = "courses";
        const futureResult = insightFacade
            .addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses)
            .then((result) => {
            chai_1.expect(result).to.deep.equal([id]);
            return insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        });
        return chai_1.expect(futureResult).to.be.rejectedWith(IInsightFacade_1.InsightError);
    });
    it("Should accept dataset has valid id that contains not only white spaces", function () {
        const idAcc = "1 2 3";
        const expected = [idAcc];
        const futureResult = insightFacade.addDataset(idAcc, datasets[idAcc], IInsightFacade_1.InsightDatasetKind.Courses);
        return chai_1.expect(futureResult).to.eventually.deep.equal(expected);
    });
    it("Should have all the id's on multiple adds", function () {
        const id = "coursesSmall";
        const id1Sub = "partialCourses";
        const expected = [id, id1Sub];
        const futureResult = insightFacade
            .addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses)
            .then((result) => {
            chai_1.expect(result).to.deep.equal([id]);
            const id1 = "partialCourses";
            return insightFacade.addDataset(id1, datasets[id1], IInsightFacade_1.InsightDatasetKind.Courses);
        });
        return chai_1.expect(futureResult).to.eventually.deep.include.members(expected);
    });
    it("Should the dataset skip some invalid files", function () {
        const idInvalidContent = "partialCoursesInvalid";
        const result = insightFacade.addDataset(idInvalidContent, datasets[idInvalidContent], IInsightFacade_1.InsightDatasetKind.Courses);
        return chai_1.expect(result).to.eventually.deep.equal([idInvalidContent]);
    });
    it("Should the dataset have valid content, no corrupted", function () {
        const idInvalidContent = "corrupted";
        const result = insightFacade.addDataset(idInvalidContent, datasets[idInvalidContent], IInsightFacade_1.InsightDatasetKind.Courses);
        return chai_1.expect(result).to.be.rejectedWith(IInsightFacade_1.InsightError);
    });
    it("Should reject if id is not found in empty dataset list", function () {
        const idNotExist = "DNE";
        const result = insightFacade.removeDataset(idNotExist);
        return chai_1.expect(result).to.be.rejectedWith(IInsightFacade_1.NotFoundError);
    });
    it("Should reject if id is not found", function () {
        const id = "courses";
        const result = insightFacade
            .addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses)
            .then((addResult) => {
            chai_1.expect(addResult).to.deep.equal([id]);
            const idNotExist = "DNE";
            return insightFacade.removeDataset(idNotExist);
        });
        return chai_1.expect(result).to.be.rejectedWith(IInsightFacade_1.NotFoundError);
    });
    it("Should remove if id is found", function () {
        const id = "courses";
        const expected = "courses";
        const result = insightFacade
            .addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses)
            .then((addResult) => {
            chai_1.expect(addResult).to.deep.equal([id]);
            const idToBeFound = "courses";
            return insightFacade.removeDataset(idToBeFound);
        });
        return chai_1.expect(result).to.eventually.deep.equal(expected);
    });
    it("Should be a dummy test", function () {
        const id = "coursesSmall";
        const result = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        return chai_1.expect(result).to.eventually.deep.equal([id]);
    });
    it("Should remove dataset has valid id that contains not only white spaces", function () {
        const idAcc = "1 2 3";
        const expected = idAcc;
        const futureResult = insightFacade
            .addDataset(idAcc, datasets[idAcc], IInsightFacade_1.InsightDatasetKind.Courses)
            .then((addResult) => {
            chai_1.expect(addResult).to.deep.equal([idAcc]);
            return insightFacade.removeDataset(idAcc);
        });
        return chai_1.expect(futureResult).to.eventually.deep.equal(expected);
    });
    it("Should not remove dataset has valid id that contains not only white spaces", function () {
        const idInvalid = "   ";
        const futureResult = insightFacade.removeDataset(idInvalid);
        return chai_1.expect(futureResult).to.be.rejectedWith(IInsightFacade_1.InsightError);
    });
    it("Should not remove dataset has valid id that contains no underscore", function () {
        const idInvalid = "1_3";
        const futureResult = insightFacade.removeDataset(idInvalid);
        return chai_1.expect(futureResult).to.be.rejectedWith(IInsightFacade_1.InsightError);
    });
    it("Should not remove dataset has valid id that contains not only white spaces", function () {
        const idInvalid = "\n\n  ";
        const futureResult = insightFacade.removeDataset(idInvalid);
        return chai_1.expect(futureResult).to.be.rejectedWith(IInsightFacade_1.InsightError);
    });
    it("Should list all the datasets after multiple adds", function () {
        const id = "courses";
        const id2 = "coursesSmall";
        const dataset1 = {
            id: "courses",
            kind: IInsightFacade_1.InsightDatasetKind.Courses,
            numRows: 64612,
        };
        const dataset2 = {
            id: "coursesSmall",
            kind: IInsightFacade_1.InsightDatasetKind.Courses,
            numRows: 4,
        };
        const expected = [dataset1, dataset2];
        const result = insightFacade
            .addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses)
            .then((addResult) => {
            chai_1.expect(addResult).to.deep.equal([id]);
            return insightFacade.addDataset(id2, datasets[id2], IInsightFacade_1.InsightDatasetKind.Courses);
        })
            .then((resultAdd2) => {
            chai_1.expect(resultAdd2).be.deep.equal([id, id2]);
            return insightFacade.listDatasets();
        });
        return chai_1.expect(result).to.eventually.have.deep.members(expected);
    });
    it("Should list all the datasets after multiple adds in reverse order", function () {
        const id = "courses";
        const id2 = "coursesSmall";
        const dataset1 = {
            id: "courses",
            kind: IInsightFacade_1.InsightDatasetKind.Courses,
            numRows: 64612,
        };
        const dataset2 = {
            id: "coursesSmall",
            kind: IInsightFacade_1.InsightDatasetKind.Courses,
            numRows: 4,
        };
        const expected = [dataset2, dataset1];
        const result = insightFacade
            .addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses)
            .then((addResult) => {
            chai_1.expect(addResult).to.deep.equal([id]);
            return insightFacade.addDataset(id2, datasets[id2], IInsightFacade_1.InsightDatasetKind.Courses);
        })
            .then((resultAdd2) => {
            chai_1.expect(resultAdd2).be.deep.equal([id, id2]);
            return insightFacade.listDatasets();
        });
        return chai_1.expect(result).to.eventually.have.deep.members(expected);
    });
    it("should return empty if no added", function () {
        const expected = [];
        const futureResult = insightFacade.listDatasets();
        return chai_1.expect(futureResult).to.eventually.deep.equal(expected);
    });
    it("Should reject dataset of rooms that doesn't has a room folder", function () {
        const id = "noRoomFolder";
        const futureResult = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Rooms);
        return chai_1.expect(futureResult).to.be.rejectedWith(IInsightFacade_1.InsightError);
    });
    it("Should add the dataset that has valid rooms", function () {
        const id = "rooms";
        const expected = [id];
        const futureResult = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Rooms);
        return chai_1.expect(futureResult).to.eventually.deep.equals(expected);
    });
});
describe("InsightFacade PerformQuery", () => {
    const datasetsToQuery = {
        "courses": {
            path: "./test/data/courses.zip",
            kind: IInsightFacade_1.InsightDatasetKind.Courses,
        },
        "partialCourses": {
            path: "./test/data/partialCourses.zip",
            kind: IInsightFacade_1.InsightDatasetKind.Courses,
        },
        "coursesSmall": {
            path: "./test/data/coursesSmall.zip",
            kind: IInsightFacade_1.InsightDatasetKind.Courses,
        },
        "1 3 4": {
            path: "./test/data/1 3 4.zip",
            kind: IInsightFacade_1.InsightDatasetKind.Courses,
        },
        "rooms": {
            path: "./test/data/rooms.zip",
            kind: IInsightFacade_1.InsightDatasetKind.Rooms,
        },
    };
    let insightFacade;
    let testQueries = [];
    before(function () {
        Util_1.default.test(`Before: ${this.test.parent.title}`);
        chai.use(chaiAsPromised);
        try {
            testQueries = TestUtil_1.default.readTestQueries();
        }
        catch (err) {
            chai_1.expect.fail("", "", `Failed to read one or more test queries. ${err}`);
        }
        const loadDatasetPromises = [];
        insightFacade = new InsightFacade_1.default();
        for (const id of Object.keys(datasetsToQuery)) {
            const ds = datasetsToQuery[id];
            const data = fs.readFileSync(ds.path).toString("base64");
            loadDatasetPromises.push(insightFacade.addDataset(id, data, ds.kind));
        }
        return Promise.all(loadDatasetPromises);
    });
    beforeEach(function () {
        Util_1.default.test(`BeforeTest: ${this.currentTest.title}`);
    });
    after(function () {
        Util_1.default.test(`After: ${this.test.parent.title}`);
    });
    afterEach(function () {
        Util_1.default.test(`AfterTest: ${this.currentTest.title}`);
    });
    it("Should run test queries", function () {
        describe("Dynamic InsightFacade PerformQuery tests", function () {
            for (const test of testQueries) {
                it(`[${test.filename}] ${test.title}`, function () {
                    const futureResult = insightFacade.performQuery(test.query);
                    return TestUtil_1.default.verifyQueryResult(futureResult, test);
                });
            }
        });
    });
});
//# sourceMappingURL=InsightFacade.spec.js.map