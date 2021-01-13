import Log from "../Util";
import {
    IInsightFacade,
    InsightDataset,
    InsightDatasetKind,
    InsightError,
    NotFoundError,
    ResultTooLargeError,
} from "./IInsightFacade";

import DatasetOperationHTML from "./DatasetOperationHTML";
import DatasetOperationJSON from "./DatasetOperationJSON";
import CheckQuery from "./CheckQuery";
import ParseQuery from "./ParseQuery";
import * as JSZip from "jszip";
import DiskOperationsHelper from "./DiskOperationsHelper";
import CheckQueryHelpers from "./CheckQueryHelpers";
import QueryUtil from "./QueryUtil";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
    // Private attributes
    public ids: { [id: string]: InsightDataset };
    public contentParsed: { [id: string]: any[] };

    public performQueryIds: string[];
    public applyKeysAndGroupKey: string[];
    public static coursesMfield: string[] = [
        "avg",
        "pass",
        "fail",
        "audit",
        "year",
    ];

    public static coursesSfield: string[] = [
        "dept",
        "id",
        "instructor",
        "title",
        "uuid",
    ];

    public static roomsMfield: string[] = ["lat", "lon", "seats"];
    public static roomsSfield: string[] = [
        "fullname",
        "shortname",
        "number",
        "name",
        "address",
        "type",
        "furniture",
        "href",
    ];

    public static mcomparator: string[] = ["LT", "GT", "EQ"];
    public static logic: string[] = ["AND", "OR"];
    public static applyToken: string[] = ["MAX", "MIN", "AVG", "COUNT", "SUM"];
    public static direction: string[] = ["UP", "DOWN"];
    public static numApplyToken: string[] = ["MAX", "MIN", "AVG", "SUM"];
    public static anyTypeApplyToken: string[] = ["COUNT"];

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
        // Initialize attributes
        this.ids = {};
        this.contentParsed = {};
        this.performQueryIds = [];
        this.applyKeysAndGroupKey = [];
        try {
            DiskOperationsHelper.loadDatasetFromDisk(this);
        } catch (e) {
            return;
        }
    }

    public addDataset(
        id: string,
        content: string,
        kind: InsightDatasetKind,
    ): Promise<string[]> {
        return new Promise<string[]>((resolve, reject) => {
            if (!CheckQueryHelpers.isIdValid(id)) {
                return reject(new InsightError("The id is invalid"));
            }

            if (CheckQueryHelpers.isIDAdded(this, id)) {
                return reject(
                    new InsightError("The id has already been added."),
                );
            } else if (DiskOperationsHelper.checkIfDataInDisk(this, id)) {
                DiskOperationsHelper.loadDatasetFromDisk(this);
                return reject(
                    new InsightError("The id has already been added."),
                );
            }

            if (kind === InsightDatasetKind.Courses) {
                return DatasetOperationJSON.load(
                    this,
                    id,
                    content,
                    resolve,
                    reject,
                );
            } else if (kind === InsightDatasetKind.Rooms) {
                return DatasetOperationHTML.load(
                    this,
                    id,
                    content,
                    resolve,
                    reject,
                );
            } else {
                return reject(new InsightError("The kind is invalid."));
            }
        });
    }

    public removeDataset(id: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            // Check if the id is valid
            if (!CheckQueryHelpers.isIdValid(id)) {
                return reject(new InsightError("This id is invalid."));
            }

            // Check if the id is added
            if (!CheckQueryHelpers.isIDAdded(this, id)) {
                if (!DiskOperationsHelper.checkIfDataInDisk(this, id)) {
                    return reject(
                        new NotFoundError("The dataset is not added."),
                    );
                } else {
                    DiskOperationsHelper.loadDatasetFromDisk(this);
                }
            }

            // Delete the id from it's list and check if that delete performs successfully
            delete this.ids[id];
            if (CheckQueryHelpers.isIDAdded(this, id)) {
                return reject(
                    new InsightError(
                        "Something wrong with this program. ID not successfully " +
                            "removed. Needs to debug.",
                    ),
                );
            }

            // Delete the content from it's list. Memory side.
            delete this.contentParsed[id];
            if (this.contentParsed.hasOwnProperty(id)) {
                return reject(
                    new InsightError(
                        "Something wrong with this program. Content not successfully removed. " +
                            "Please debug.",
                    ),
                );
            }

            DiskOperationsHelper.cleanCache();
            DiskOperationsHelper.saveDatasetToDisk(this).then((results) => {
                if (results === 1) {
                    Log.trace("The dataset memory is empty. No disk write perfroms.");
                    return resolve(id);
                } else {
                    Log.trace("The dataset requested has been removed. New copy has been written into disk.");
                    return resolve(id);
                }
            }).catch((e) => {
                return reject("Error when saving to disk" + e.message);
            });
        });
    }

    public performQuery(query: any): Promise<any[]> {
        return new Promise<any>((resolve, reject) => {
            this.performQueryIds = [];
            this.applyKeysAndGroupKey = [];

            let isValid = CheckQuery.checkSemantic(this, query);
            if (isValid === true) {
                let id = this.performQueryIds[0];
                let result: any[] = ParseQuery.queryBody(query, this, id);
                result = ParseQuery.queryTrans(
                    result,
                    query.TRANSFORMATIONS,
                );
                if (result.length > 5000) {
                    return reject(
                        new ResultTooLargeError(
                            "More than 5000 results found.",
                        ),
                    );
                } else {
                    result = ParseQuery.queryOptions(
                        result,
                        query.OPTIONS,
                        id,
                        this,
                    );
                    return resolve(result);
                }
            } else {
                return reject(new InsightError("Invalid query."));
            }
        });
    }

    public listDatasets(): Promise<InsightDataset[]> {
        return new Promise<InsightDataset[]>((resolve, reject) => {
            let results: InsightDataset[] = [];
            try {
                for (const [key, value] of Object.entries(this.ids)) {
                    results.push(value);
                }
            } catch (e) {
                return reject(e);
            }
            return resolve(results);
        });
    }
}
