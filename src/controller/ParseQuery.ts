import InsightFacade from "./InsightFacade";
import ParserQueryHelpers from "./ParserQueryHelpers";
import CheckQueryHelpers from "./CheckQueryHelpers";
import QueryUtil from "./QueryUtil";
import { InsightDatasetKind } from "./IInsightFacade";
import Util from "../Util";

export default class ParseQuery {
    public static isRoom: boolean = false;

    public static queryBody(
        queryStr: any,
        obj: InsightFacade,
        id: string,
    ): Array<{ [key: string]: number | string }> {
        let result: Array<{ [key: string]: number | string }>;
        let content: object[] = [];

        if (CheckQueryHelpers.checkIdType(obj, id) === InsightDatasetKind.Courses) {
            this.isRoom = false;
            content = obj.contentParsed[id].slice();
            content = QueryUtil.yearto1900(content);
        } else {
            this.isRoom = true;
            let contentTemp = obj.contentParsed[id].slice();
            let roomsContent: object[] = [];
            for (const item of contentTemp) {
                let newItem: { [key: string]: object[] } = {};
                newItem["result"] = [item];
                roomsContent.push(newItem);
            }
            content = roomsContent.slice();
            // Util.trace(content[0]);
            // Util.trace(content.length);
        }
        if (CheckQueryHelpers.checkIsObjectAndHasNPair(queryStr.WHERE, 0)) {
            result = QueryUtil.getAllSection(content);
        } else {
            result = ParserQueryHelpers.body(
                queryStr.WHERE,
                content,
                false,
                this.isRoom,
                id,
            );
        }
        // Util.trace(result);
        return result;
    }

    public static queryTrans(
        result: Array<{ [p: string]: number | string }>,
        transQuery: any,
    ): Array<{ [p: string]: number | string }> {
        if (transQuery === undefined) {
            return result;
        }
        let groupValues: string[] = QueryUtil.keyTranslation_api2dataset_array(
            transQuery["GROUP"],
            this.isRoom,
        );
        let applyRules: Array<{ [key: string]: object }> = transQuery["APPLY"];
        let groupCombinations: {
            [key: string]: [{ [key: string]: number | string }];
        } = ParserQueryHelpers.makeUniqueGroupCombinations(result, groupValues);

        let retval: Array<{ [key: string]: number | string }> = [];

        // Each comb will be an object in the final result array
        for (const comb of Object.values(groupCombinations)) {
            let combDict: { [key: string]: number | string } = {};
            for (const rule of applyRules) {
                let applykey: string = Object.keys(rule)[0];
                let applytoken: string = Object.keys(Object.values(rule)[0])[0];
                let appliedkey: string;
                if (this.isRoom) {
                    appliedkey = QueryUtil.keyTranslation_api2dataset(
                        Object.values(Object.values(rule)[0])[0],
                        this.isRoom,
                    );
                } else {
                    appliedkey = QueryUtil.keyTranslation_api2dataset(
                        QueryUtil.getField(
                            Object.values(Object.values(rule)[0])[0],
                        ),
                        this.isRoom,
                    );
                }

                combDict[applykey] = ParserQueryHelpers.getValByApplytoken(
                    applytoken,
                    appliedkey,
                    comb,
                );
            }
            // Add keys and vals in GROUP
            for (const key of groupValues) {
                combDict[key] = comb[0][key]; // Any val of the GROUP key is the same within a comb array
            }

            retval.push(combDict);
        }
        return retval;
    }

    // Input: an array of objects that meets the query strings in body
    // Effect: 1. delete unneeded keys in each object; 2. sort
    public static queryOptions(
        result: Array<{ [p: string]: number | string }>,
        optionsQuery: any,
        id: string,
        ifobj: InsightFacade,
    ): Array<{ [p: string]: number | string }> {
        let columnValues: string[] = [];
        for (const column of optionsQuery.COLUMNS) {
            if (column.includes("_")) {
                if (this.isRoom) {
                    columnValues.push(
                        QueryUtil.keyTranslation_api2dataset(
                            column,
                            this.isRoom,
                        ),
                    );
                } else {
                    columnValues.push(
                        QueryUtil.keyTranslation_api2dataset(
                            QueryUtil.getField(column),
                            this.isRoom,
                        ),
                    );
                }
            } else {
                columnValues.push(column);
            }
        }
        result = ParserQueryHelpers.dropColumns(result, columnValues);
        if (!this.isRoom) {
            result = QueryUtil.resultReformat(result, id, ifobj, this.isRoom);
        }
        if (optionsQuery.hasOwnProperty("ORDER")) {
            result = ParserQueryHelpers.orderSort(result, optionsQuery.ORDER);
        }
        return result;
    }
}
