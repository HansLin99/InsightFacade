import * as chai from "chai";
import { expect } from "chai";
import * as fs from "fs-extra";
import * as chaiAsPromised from "chai-as-promised";
import {
    InsightDataset,
    InsightDatasetKind,
    InsightError,
    NotFoundError,
} from "../src/controller/IInsightFacade";
import InsightFacade from "../src/controller/InsightFacade";
import Log from "../src/Util";
import TestUtil from "./TestUtil";

// This should match the schema given to TestUtil.validate(..) in TestUtil.readTestQueries(..)
// except 'filename' which is injected when the file is read.
export interface ITestQuery {
    title: string;
    query: any; // make any to allow testing structurally invalid queries
    isQueryValid: boolean;
    result: any;
    filename: string; // This is injected when reading the file
}

describe("InsightFacade Add/Remove/List Dataset", function () {
    // Reference any datasets you've added to test/data here and they will
    // automatically be loaded in the 'before' hook.
    const datasetsToLoad: { [id: string]: string } = {
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
    let datasets: { [id: string]: string } = {};
    let insightFacade: InsightFacade;
    const cacheDir = __dirname + "/../data";

    before(function () {
        // This section runs once and loads all datasets specified in the datasetsToLoad object
        // into the datasets object
        Log.test(`Before all`);
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
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        }
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        // This section resets the data directory (removing any cached data) and resets the InsightFacade instance
        // This runs after each test, which should make each test independent from the previous one
        Log.test(`AfterTest: ${this.currentTest.title}`);
        try {
            fs.removeSync(cacheDir);
            fs.mkdirSync(cacheDir);
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        }
    });

    // ---------------------------------------AddDataSet--------------------------------------------
    /**
     * Tests of kind:courses
     */
    // it("query test", function () {
    //     const id: string = "courses";
    //     const query: string = JSON.parse(
    //         "{\n" +
    //         "  \"WHERE\": {\n" +
    //         "    \"GT\": {\n" +
    //         "      \"courses_avg\": 97\n" +
    //         "    }\n" +
    //         "  },\n" +
    //         "  \"OPTIONS\": {\n" +
    //         "    \"COLUMNS\": [\n" +
    //         "      \"courses_dept\",\n" +
    //         "      \"courses_avg\",\n" +
    //         "      \"courses_avg\"\n" +
    //         "    ],\n" +
    //         "    \"ORDER\": \"courses_avg\"\n" +
    //         "  }\n" +
    //         "}",
    //     );
    //     const expected: any[] = [];
    //
    //     const futureResult: Promise<any[]> = insightFacade
    //         .addDataset(id, datasets[id], InsightDatasetKind.Courses)
    //         .then(() => {
    //             return insightFacade.performQuery(query);
    //         });
    //
    //     return expect(futureResult).to.eventually.deep.equal(expected);
    // });
    //
    // it("query test room", function () {
    //     const id: string = "rooms";
    //     const query: string = JSON.parse(
    //         "{\n" +
    //         "  \"WHERE\": {\n" +
    //         "    \"AND\": [\n" +
    //         "      {\n" +
    //         "        \"IS\": {\n" +
    //         "          \"rooms_furniture\": \"*Tables*\"\n" +
    //         "        }\n" +
    //         "      },\n" +
    //         "      {\n" +
    //         "        \"GT\": {\n" +
    //         "          \"rooms_seats\": 300\n" +
    //         "        }\n" +
    //         "      }\n" +
    //         "    ]\n" +
    //         "  },\n" +
    //         "  \"OPTIONS\": {\n" +
    //         "    \"COLUMNS\": [\n" +
    //         "      \"rooms_shortname\",\n" +
    //         "      \"maxSeats\",\n" +
    //         "      \"rooms_seats\"\n" +
    //         "    ],\n" +
    //         "    \"ORDER\": {\n" +
    //         "      \"dir\": \"UP\",\n" +
    //         "      \"keys\": [\n" +
    //         "        \"maxSeats\",\n" +
    //         "        \"rooms_seats\"\n" +
    //         "      ]\n" +
    //         "    }\n" +
    //         "  },\n" +
    //         "  \"TRANSFORMATIONS\": {\n" +
    //         "    \"GROUP\": [\n" +
    //         "      \"rooms_shortname\",\n" +
    //         "      \"rooms_seats\"\n" +
    //         "    ],\n" +
    //         "    \"APPLY\": [\n" +
    //         "      {\n" +
    //         "        \"maxSeats\": {\n" +
    //         "          \"MAX\": \"rooms_seats\"\n" +
    //         "        }\n" +
    //         "      },\n" +
    //         "      {\n" +
    //         "        \" \": {\n" +
    //         "          \"COUNT\": \"rooms_furniture\"\n" +
    //         "        }\n" +
    //         "      }\n" +
    //         "    ]\n" +
    //         "  }\n" +
    //         "}",
    //     );
    //     const expected: any[] = [
    //         {
    //             rooms_type: "Open Design General Purpose",
    //             maxSeats: 442,
    //         },
    //         {
    //             rooms_type: "Tiered Large Group",
    //             maxSeats: 375,
    //         },
    //     ];
    //
    //     const futureResult: Promise<any[]> = insightFacade
    //         .addDataset(id, datasets[id], InsightDatasetKind.Rooms)
    //         .then(() => {
    //             return insightFacade.performQuery(query);
    //         });
    //
    //     return expect(futureResult).to.eventually.deep.equal(expected);
    // });

    it("Should add a valid dataset", function () {
        const id: string = "coursesSmall";
        const expected: string[] = ["coursesSmall"];
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.eventually.deep.equals(expected);
    });

    it("Should the dataset has valid id that contains not only white spaces", function () {
        const idInvalid: string = "   ";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            idInvalid,
            datasets[idInvalid],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Should the dataset has valid id that isn't 0 length", function () {
        const idInvalid: string = "";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            idInvalid,
            datasets[idInvalid],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Should reject the dataset has multiple folders", function () {
        const id: string = "multipleFolders";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Should reject the dataset has no course folder", function () {
        const id: string = "noCourseFolder";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Should reject the dataset has no content", function () {
        const id: string = "noContent";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Should reject the dataset has no valid content", function () {
        const id: string = "noValidContent";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Should the dataset has no kind of Room & id blank", function () {
        const id: string = "";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Rooms,
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Should the dataset has valid id that contains no underscore", function () {
        const idInvalid: string = "1_3";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            idInvalid,
            datasets[idInvalid],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Should the dataset has valid id that contains no underscore & space", function () {
        const idInvalid: string = "_ _";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            idInvalid,
            datasets[idInvalid],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Should the dataset has valid id that contains not only white spaces", function () {
        const idInvalid: string = "\n\n  ";
        const id: string = "courses";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            idInvalid,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Should not add duplicate dataset", function () {
        const id: string = "courses";
        const futureResult: Promise<string[]> = insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then(
                (result): Promise<string[]> => {
                    expect(result).to.deep.equal([id]);
                    return insightFacade.addDataset(
                        id,
                        datasets[id],
                        InsightDatasetKind.Courses,
                    );
                },
            );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Should accept dataset has valid id that contains not only white spaces", function () {
        const idAcc: string = "1 2 3";
        const expected: string[] = [idAcc];
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            idAcc,
            datasets[idAcc],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    it("Should have all the id's on multiple adds", function () {
        const id: string = "coursesSmall";
        const id1Sub: string = "partialCourses";
        const expected: string[] = [id, id1Sub];
        const futureResult: Promise<string[]> = insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then(
                (result): Promise<string[]> => {
                    expect(result).to.deep.equal([id]);
                    const id1: string = "partialCourses";
                    return insightFacade.addDataset(
                        id1,
                        datasets[id1],
                        InsightDatasetKind.Courses,
                    );
                },
            );
        return expect(futureResult).to.eventually.deep.include.members(
            expected,
        );
    });

    it("Should the dataset skip some invalid files", function () {
        const idInvalidContent: string = "partialCoursesInvalid";
        const result: Promise<string[]> = insightFacade.addDataset(
            idInvalidContent,
            datasets[idInvalidContent],
            InsightDatasetKind.Courses,
        );
        return expect(result).to.eventually.deep.equal([idInvalidContent]);
    });

    it("Should the dataset have valid content, no corrupted", function () {
        const idInvalidContent: string = "corrupted";
        const result: Promise<string[]> = insightFacade.addDataset(
            idInvalidContent,
            datasets[idInvalidContent],
            InsightDatasetKind.Courses,
        );
        return expect(result).to.be.rejectedWith(InsightError);
    });

    // ------------------------------------RemoveDataset---------------------------------------
    it("Should reject if id is not found in empty dataset list", function () {
        const idNotExist: string = "DNE";
        const result: Promise<string> = insightFacade.removeDataset(idNotExist);
        return expect(result).to.be.rejectedWith(NotFoundError);
    });

    it("Should reject if id is not found", function () {
        const id: string = "courses";
        const result: Promise<string> = insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((addResult) => {
                expect(addResult).to.deep.equal([id]);
                const idNotExist: string = "DNE";
                return insightFacade.removeDataset(idNotExist);
            });
        return expect(result).to.be.rejectedWith(NotFoundError);
    });

    it("Should remove if id is found", function () {
        const id: string = "courses";
        const expected: string = "courses";
        const result: Promise<string> = insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then(
                (addResult): Promise<string> => {
                    expect(addResult).to.deep.equal([id]);
                    const idToBeFound: string = "courses";
                    return insightFacade.removeDataset(idToBeFound);
                },
            );
        return expect(result).to.eventually.deep.equal(expected);
    });

    it("Should be a dummy test", function () {
        const id: string = "coursesSmall";
        const result: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(result).to.eventually.deep.equal([id]);
    });

    it("Should remove dataset has valid id that contains not only white spaces", function () {
        const idAcc: string = "1 2 3";
        const expected: string = idAcc;
        const futureResult: Promise<string> = insightFacade
            .addDataset(idAcc, datasets[idAcc], InsightDatasetKind.Courses)
            .then(
                (addResult): Promise<string> => {
                    expect(addResult).to.deep.equal([idAcc]);
                    return insightFacade.removeDataset(idAcc);
                },
            );
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    it("Should not remove dataset has valid id that contains not only white spaces", function () {
        const idInvalid: string = "   ";
        const futureResult: Promise<string> = insightFacade.removeDataset(
            idInvalid,
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Should not remove dataset has valid id that contains no underscore", function () {
        const idInvalid: string = "1_3";
        const futureResult: Promise<string> = insightFacade.removeDataset(
            idInvalid,
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Should not remove dataset has valid id that contains not only white spaces", function () {
        const idInvalid: string = "\n\n  ";
        const futureResult: Promise<string> = insightFacade.removeDataset(
            idInvalid,
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    // ------------------------------------------ListDataset-----------------------------------------------

    it("Should list all the datasets after multiple adds", function () {
        const id: string = "courses";
        const id2: string = "coursesSmall";
        const dataset1 = {
            id: "courses",
            kind: InsightDatasetKind.Courses,
            numRows: 64612,
        } as InsightDataset;
        const dataset2 = {
            id: "coursesSmall",
            kind: InsightDatasetKind.Courses,
            numRows: 4,
        } as InsightDataset;
        const expected: InsightDataset[] = [dataset1, dataset2];
        const result: Promise<InsightDataset[]> = insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((addResult) => {
                expect(addResult).to.deep.equal([id]);
                return insightFacade.addDataset(
                    id2,
                    datasets[id2],
                    InsightDatasetKind.Courses,
                );
            })
            .then((resultAdd2) => {
                expect(resultAdd2).be.deep.equal([id, id2]);
                return insightFacade.listDatasets();
            });
        return expect(result).to.eventually.have.deep.members(expected);
    });

    it("Should list all the datasets after multiple adds in reverse order", function () {
        const id: string = "courses";
        const id2: string = "coursesSmall";
        const dataset1 = {
            id: "courses",
            kind: InsightDatasetKind.Courses,
            numRows: 64612,
        } as InsightDataset;
        const dataset2 = {
            id: "coursesSmall",
            kind: InsightDatasetKind.Courses,
            numRows: 4,
        } as InsightDataset;
        const expected: InsightDataset[] = [dataset2, dataset1];
        const result: Promise<InsightDataset[]> = insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((addResult) => {
                expect(addResult).to.deep.equal([id]);
                return insightFacade.addDataset(
                    id2,
                    datasets[id2],
                    InsightDatasetKind.Courses,
                );
            })
            .then((resultAdd2) => {
                expect(resultAdd2).be.deep.equal([id, id2]);
                return insightFacade.listDatasets();
            });
        return expect(result).to.eventually.have.deep.members(expected);
    });

    it("should return empty if no added", function () {
        const expected: InsightDataset[] = [];
        const futureResult: Promise<
            InsightDataset[]
        > = insightFacade.listDatasets();
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    /**
     * Tests of kind:Rooms
     */

    it("Should reject dataset of rooms that doesn't has a room folder", function () {
        const id: string = "noRoomFolder";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Rooms,
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Should add the dataset that has valid rooms", function () {
        const id: string = "rooms";
        const expected: string[] = [id];
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Rooms,
        );
        return expect(futureResult).to.eventually.deep.equals(expected);
    });
});

/*
 * This test suite dynamically generates tests from the JSON files in test/queries.
 * You should not need to modify it; instead, add additional files to the queries directory.
 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
 */
describe("InsightFacade PerformQuery", () => {
    const datasetsToQuery: {
        [id: string]: { path: string; kind: InsightDatasetKind };
    } = {
        "courses": {
            path: "./test/data/courses.zip",
            kind: InsightDatasetKind.Courses,
        },
        "partialCourses": {
            path: "./test/data/partialCourses.zip",
            kind: InsightDatasetKind.Courses,
        },
        "coursesSmall": {
            path: "./test/data/coursesSmall.zip",
            kind: InsightDatasetKind.Courses,
        },
        "1 3 4": {
            path: "./test/data/1 3 4.zip",
            kind: InsightDatasetKind.Courses,
        },
        "rooms": {
            path: "./test/data/rooms.zip",
            kind: InsightDatasetKind.Rooms,
        },
    };
    let insightFacade: InsightFacade;
    let testQueries: ITestQuery[] = [];

    // Load all the test queries, and call addDataset on the insightFacade instance for all the datasets
    before(function () {
        Log.test(`Before: ${this.test.parent.title}`);

        // Load the query JSON files under test/queries.
        // Fail if there is a problem reading ANY query.
        chai.use(chaiAsPromised);
        try {
            testQueries = TestUtil.readTestQueries();
        } catch (err) {
            expect.fail(
                "",
                "",
                `Failed to read one or more test queries. ${err}`,
            );
        }

        // Load the datasets specified in datasetsToQuery and add them to InsightFacade.
        // Will fail* if there is a problem reading ANY dataset.
        const loadDatasetPromises: Array<Promise<string[]>> = [];
        insightFacade = new InsightFacade();
        for (const id of Object.keys(datasetsToQuery)) {
            const ds = datasetsToQuery[id];
            const data = fs.readFileSync(ds.path).toString("base64");
            loadDatasetPromises.push(
                insightFacade.addDataset(id, data, ds.kind),
            );
        }
        return Promise.all(loadDatasetPromises);
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    // Dynamically create and run a test for each query in testQueries
    // Creates an extra "test" called "Should run test queries" as a byproduct. Don't worry about it
    it("Should run test queries", function () {
        describe("Dynamic InsightFacade PerformQuery tests", function () {
            for (const test of testQueries) {
                it(`[${test.filename}] ${test.title}`, function () {
                    const futureResult: Promise<
                        any[]
                    > = insightFacade.performQuery(test.query);
                    return TestUtil.verifyQueryResult(futureResult, test);
                });
            }
        });
    });
});
