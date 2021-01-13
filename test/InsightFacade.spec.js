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
        "roomsDoubleTables": "./test/data/roomsDoubletables.zip",
        "roomsDifferentPath": "./test/data/roomsDifferentPath.zip",
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