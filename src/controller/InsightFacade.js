"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Util_1 = require("../Util");
const IInsightFacade_1 = require("./IInsightFacade");
const DatasetOperationHTML_1 = require("./DatasetOperationHTML");
const DatasetOperationJSON_1 = require("./DatasetOperationJSON");
const CheckQuery_1 = require("./CheckQuery");
const ParseQuery_1 = require("./ParseQuery");
const DiskOperationsHelper_1 = require("./DiskOperationsHelper");
const CheckQueryHelpers_1 = require("./CheckQueryHelpers");
class InsightFacade {
    constructor() {
        Util_1.default.trace("InsightFacadeImpl::init()");
        this.ids = {};
        this.contentParsed = {};
        this.performQueryIds = [];
        this.applyKeysAndGroupKey = [];
        try {
            DiskOperationsHelper_1.default.loadDatasetFromDisk(this);
        }
        catch (e) {
            return;
        }
    }
    addDataset(id, content, kind) {
        return new Promise((resolve, reject) => {
            if (!CheckQueryHelpers_1.default.isIdValid(id)) {
                return reject(new IInsightFacade_1.InsightError("The id is invalid"));
            }
            if (CheckQueryHelpers_1.default.isIDAdded(this, id)) {
                return reject(new IInsightFacade_1.InsightError("The id has already been added."));
            }
            else if (DiskOperationsHelper_1.default.checkIfDataInDisk(this, id)) {
                DiskOperationsHelper_1.default.loadDatasetFromDisk(this);
                return reject(new IInsightFacade_1.InsightError("The id has already been added."));
            }
            if (kind === IInsightFacade_1.InsightDatasetKind.Courses) {
                return DatasetOperationJSON_1.default.load(this, id, content, resolve, reject);
            }
            else if (kind === IInsightFacade_1.InsightDatasetKind.Rooms) {
                return DatasetOperationHTML_1.default.load(this, id, content, resolve, reject);
            }
            else {
                return reject(new IInsightFacade_1.InsightError("The kind is invalid."));
            }
        });
    }
    removeDataset(id) {
        return new Promise((resolve, reject) => {
            if (!CheckQueryHelpers_1.default.isIdValid(id)) {
                return reject(new IInsightFacade_1.InsightError("This id is invalid."));
            }
            if (!CheckQueryHelpers_1.default.isIDAdded(this, id)) {
                if (!DiskOperationsHelper_1.default.checkIfDataInDisk(this, id)) {
                    return reject(new IInsightFacade_1.NotFoundError("The dataset is not added."));
                }
                else {
                    DiskOperationsHelper_1.default.loadDatasetFromDisk(this);
                }
            }
            delete this.ids[id];
            if (CheckQueryHelpers_1.default.isIDAdded(this, id)) {
                return reject(new IInsightFacade_1.InsightError("Something wrong with this program. ID not successfully " +
                    "removed. Needs to debug."));
            }
            delete this.contentParsed[id];
            if (this.contentParsed.hasOwnProperty(id)) {
                return reject(new IInsightFacade_1.InsightError("Something wrong with this program. Content not successfully removed. " +
                    "Please debug."));
            }
            DiskOperationsHelper_1.default.cleanCache();
            DiskOperationsHelper_1.default.saveDatasetToDisk(this).then((results) => {
                if (results === 1) {
                    Util_1.default.trace("The dataset memory is empty. No disk write perfroms.");
                    return resolve(id);
                }
                else {
                    Util_1.default.trace("The dataset requested has been removed. New copy has been written into disk.");
                    return resolve(id);
                }
            }).catch((e) => {
                return reject("Error when saving to disk" + e.message);
            });
        });
    }
    performQuery(query) {
        return new Promise((resolve, reject) => {
            this.performQueryIds = [];
            this.applyKeysAndGroupKey = [];
            let isValid = CheckQuery_1.default.checkSemantic(this, query);
            if (isValid === true) {
                let id = this.performQueryIds[0];
                let result = ParseQuery_1.default.queryBody(query, this, id);
                result = ParseQuery_1.default.queryTrans(result, query.TRANSFORMATIONS);
                if (result.length > 5000) {
                    return reject(new IInsightFacade_1.ResultTooLargeError("More than 5000 results found."));
                }
                else {
                    result = ParseQuery_1.default.queryOptions(result, query.OPTIONS, id, this);
                    return resolve(result);
                }
            }
            else {
                return reject(new IInsightFacade_1.InsightError("Invalid query."));
            }
        });
    }
    listDatasets() {
        return new Promise((resolve, reject) => {
            let results = [];
            try {
                for (const [key, value] of Object.entries(this.ids)) {
                    results.push(value);
                }
            }
            catch (e) {
                return reject(e);
            }
            return resolve(results);
        });
    }
}
exports.default = InsightFacade;
InsightFacade.coursesMfield = [
    "avg",
    "pass",
    "fail",
    "audit",
    "year",
];
InsightFacade.coursesSfield = [
    "dept",
    "id",
    "instructor",
    "title",
    "uuid",
];
InsightFacade.roomsMfield = ["lat", "lon", "seats"];
InsightFacade.roomsSfield = [
    "fullname",
    "shortname",
    "number",
    "name",
    "address",
    "type",
    "furniture",
    "href",
];
InsightFacade.mcomparator = ["LT", "GT", "EQ"];
InsightFacade.logic = ["AND", "OR"];
InsightFacade.applyToken = ["MAX", "MIN", "AVG", "COUNT", "SUM"];
InsightFacade.direction = ["UP", "DOWN"];
InsightFacade.numApplyToken = ["MAX", "MIN", "AVG", "SUM"];
InsightFacade.anyTypeApplyToken = ["COUNT"];
//# sourceMappingURL=InsightFacade.js.map