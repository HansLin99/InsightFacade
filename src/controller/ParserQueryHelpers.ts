import QueryUtil from "./QueryUtil";
import InsightFacade from "./InsightFacade";
import { objectify } from "tslint/lib/utils";
import CheckQueryHelpers from "./CheckQueryHelpers";
import Util from "../Util";

export default class ParserQueryHelpers {
    // Recursive function that parse the query from the most nested filter
    public static body(
        bodyQuery: any,
        content: object[],
        hasNot: boolean,
        isRoom: boolean,
        roomId: string,
    ): Array<{ [p: string]: number | string }> {
        let retval: Array<{ [key: string]: number | string }> = [];
        let filter: string = Object.keys(bodyQuery)[0];
        let value: any = Object.values(bodyQuery)[0];

        if (InsightFacade.mcomparator.includes(filter)) {
            retval = retval.concat(
                ParserQueryHelpers.queryMcomparison(filter, value, content, hasNot, isRoom)
            );
        } else if (InsightFacade.logic.includes(filter)) {
            let resultList: any = [];
            for (const subfilter of value) {
                resultList.push(
                    this.body(subfilter, content, hasNot, isRoom, roomId),
                );
            }
            if (hasNot) {
                if (filter === "AND") {
                    retval = retval.concat(
                        ParserQueryHelpers.queryLogic("OR", resultList, isRoom, roomId)
                    );
                } else {
                    retval = retval.concat(
                        ParserQueryHelpers.queryLogic(
                            "AND",
                            resultList,
                            isRoom,
                            roomId,
                        ),
                    );
                }
            } else {
                retval = retval.concat(
                    ParserQueryHelpers.queryLogic(filter, resultList, isRoom, roomId)
                );
            }
        } else if (filter === "IS") {
            retval = retval.concat(
                ParserQueryHelpers.queryScomparison(value, content, hasNot, isRoom)
            );
        } else if (filter === "NOT") {
            retval = retval.concat(
                this.body(value, content, !hasNot, isRoom, roomId),
            );
        }
        // Util.trace(retval);
        return retval;
    }

    public static queryLogic(
        filter: string,
        resultList: Array<Array<{ [p: string]: number | string }>>,
        isRoom: boolean,
        roomId: string,
    ): any[] {
        // Util.trace(resultList);
        // Nothing in result list
        if (resultList.length === 0) {
            return [];
        }
        // Only one condition, don't need to chec
        if (resultList.length === 1) {
            return resultList[0];
        }

        // More than one condition, check with AND/OR
        let retval: Array<{ [key: string]: number | string }> = [];
        // Find common elements in an array of arrays:
        // https://stackoverflow.com/questions/11076067/finding-matches-between-multiple-javascript-arrays
        if (filter === "AND") {
            // Concat into one array
            let temp = [].concat.apply([], resultList);
            // Count same object
            let countdict: { [id: string]: [any, any] } = {};
            for (const item of temp) {
                let id: string;
                if (isRoom) {
                    id = item[roomId.concat("_name")];
                } else {
                    id = item.id;
                }

                if (id in countdict) {
                    countdict[id][0] += 1;
                } else {
                    countdict[id] = [1, item];
                }
                // Util.trace(countdict);
            }
            // Util.trace(countdict);
            // Common items
            let length = resultList.length;
            for (const [key, value] of Object.entries(countdict)) {
                if (value[0] === length) {
                    retval.push(value[1]);
                }
            }
            // Util.trace(retval);
        } else {
            // Concat arrays in an array:
            // https://stackoverflow.com/questions/10865025/merge-flatten-an-array-of-arrays
            retval = [].concat.apply([], resultList);

            // Remove duplicates:
            // https://stackoverflow.com/a/46944425
            retval = retval.reduce(
                (r, i) =>
                    !r.some(QueryUtil.compare2objects.bind(null, [i, isRoom, roomId]))
                        ? [...r, i]
                        : r,
                [],
            );
        }

        return retval;
    }

    public static queryMcomparison(
        mcomparator: string,
        value: any,
        content: any,
        hasNot: boolean,
        isRoom: boolean,
    ): Array<{ [p: string]: number | string }> {
        let retval: Array<{ [key: string]: number | string }> = [];
        let mkey: string = QueryUtil.keyTranslation_api2dataset(
            Object.keys(value)[0].split("_")[1],
            isRoom,
        );
        if (isRoom) {
            mkey = QueryUtil.keyTranslation_api2dataset(
                Object.keys(value)[0],
                isRoom,
            );
        }
        let num: any = Object.values(value)[0];

        // content is all courses
        // item is one courses, which have zero or more sections, need to go through each section
        for (const course of content) {
            for (const section of course.result) {
                let val: any = section[mkey];
                val = Number(val);
                if (hasNot) {
                    if (
                        (mcomparator === "LT" && val >= num) ||
                        (mcomparator === "EQ" && val !== num) ||
                        (mcomparator === "GT" && val <= num)
                    ) {
                        retval.push(section);
                    }
                } else {
                    if (
                        (mcomparator === "LT" && val < num) ||
                        (mcomparator === "EQ" && val === num) ||
                        (mcomparator === "GT" && val > num)
                    ) {
                        retval.push(section);
                    }
                }
            }
        }
        return retval;
    }

    public static queryScomparison(
        value: any,
        content: any,
        hasNot: boolean,
        isRoom: boolean,
    ): Array<{ [p: string]: number | string }> {
        let retval: Array<{ [key: string]: number | string }> = [];
        let skey: string = QueryUtil.keyTranslation_api2dataset(
            Object.keys(value)[0].split("_")[1],
            isRoom,
        );
        if (isRoom) {
            skey = QueryUtil.keyTranslation_api2dataset(
                Object.keys(value)[0],
                isRoom,
            );
        }
        let inputstring: string = String(Object.values(value)[0]);

        for (const course of content) {
            for (const section of course.result) {
                let val: string = "";
                val = section[skey];
                val = String(val);
                if (hasNot) {
                    if (!QueryUtil.compareInputstr(inputstring, val)) {
                        retval.push(section);
                    }
                } else {
                    if (QueryUtil.compareInputstr(inputstring, val)) {
                        retval.push(section);
                    }
                }
            }
        }
        return retval;
    }

    public static makeUniqueGroupCombinations(
        result: Array<{ [key: string]: number | string }>,
        groupValues: string[],
    ): { [key: string]: [{ [key: string]: number | string }] } {
        let uniqueCombinations: {
            [key: string]: [{ [key: string]: number | string }];
        } = {};
        for (const item of result) {
            let groupValDict: { [key: string]: number | string } = {};
            for (const val of groupValues) {
                groupValDict[val] = item[val];
            }
            let combinationKey = JSON.stringify(groupValDict);
            if (combinationKey in uniqueCombinations) {
                uniqueCombinations[combinationKey].push(item);
            } else {
                uniqueCombinations[combinationKey] = [item];
            }
        }
        return uniqueCombinations;
    }

    public static getValByApplytoken(
        applytoken: string,
        appliedKey: string,
        result: Array<{ [key: string]: number | string }>,
    ): number {
        let values: any[] = QueryUtil.getAllValuesGivenKey(appliedKey, result);
        switch (applytoken) {
            case "MAX": return Math.max.apply(null, values);
            case "MIN": return Math.min.apply(null, values);
            case "AVG": return QueryUtil.avg(values);
            case "COUNT": return QueryUtil.countUniqueValues(values);
            case "SUM": return QueryUtil.sum(values);
        }
        return 0;
    }

    // Input: columnValues: an array of columns to keep, drop others
    public static dropColumns(
        result: Array<{ [key: string]: number | string }>,
        columnValues: string[],
    ): Array<{ [key: string]: number | string }> {
        let retval: Array<{ [key: string]: number | string }> = [];
        for (const item of result) {
            let newitem: { [key: string]: number | string } = {};
            for (const [key, value] of Object.entries(item)) {
                if (columnValues.includes(key)) {
                    if (key === "id") {// uuid
                        newitem[key] = String(value);
                    } else if (key === "Year") {
                        newitem[key] = Number(value);
                    } else if (key === "Course") {// id
                        newitem[key] = String(value);
                    } else {
                        newitem[key] = value;
                    }
                }
            }
            retval.push(newitem);
        }
        return retval;
    }

    public static orderSort(
        result: Array<{ [key: string]: number | string }>,
        orderValue: any,
    ): Array<{ [key: string]: number | string }> {
        if (CheckQueryHelpers.checkString(orderValue)) {
            result.sort((a, b) => {
                return QueryUtil.sort(a, b, orderValue);
            });
            return result;
        } else {
            return QueryUtil.hierarchicalSort(orderValue, result);
        }
    }
}
