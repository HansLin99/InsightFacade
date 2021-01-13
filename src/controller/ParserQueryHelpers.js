"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const QueryUtil_1 = require("./QueryUtil");
const InsightFacade_1 = require("./InsightFacade");
const CheckQueryHelpers_1 = require("./CheckQueryHelpers");
class ParserQueryHelpers {
    static body(bodyQuery, content, hasNot, isRoom, roomId) {
        let retval = [];
        let filter = Object.keys(bodyQuery)[0];
        let value = Object.values(bodyQuery)[0];
        if (InsightFacade_1.default.mcomparator.includes(filter)) {
            retval = retval.concat(ParserQueryHelpers.queryMcomparison(filter, value, content, hasNot, isRoom));
        }
        else if (InsightFacade_1.default.logic.includes(filter)) {
            let resultList = [];
            for (const subfilter of value) {
                resultList.push(this.body(subfilter, content, hasNot, isRoom, roomId));
            }
            if (hasNot) {
                if (filter === "AND") {
                    retval = retval.concat(ParserQueryHelpers.queryLogic("OR", resultList, isRoom, roomId));
                }
                else {
                    retval = retval.concat(ParserQueryHelpers.queryLogic("AND", resultList, isRoom, roomId));
                }
            }
            else {
                retval = retval.concat(ParserQueryHelpers.queryLogic(filter, resultList, isRoom, roomId));
            }
        }
        else if (filter === "IS") {
            retval = retval.concat(ParserQueryHelpers.queryScomparison(value, content, hasNot, isRoom));
        }
        else if (filter === "NOT") {
            retval = retval.concat(this.body(value, content, !hasNot, isRoom, roomId));
        }
        return retval;
    }
    static queryLogic(filter, resultList, isRoom, roomId) {
        if (resultList.length === 0) {
            return [];
        }
        if (resultList.length === 1) {
            return resultList[0];
        }
        let retval = [];
        if (filter === "AND") {
            let temp = [].concat.apply([], resultList);
            let countdict = {};
            for (const item of temp) {
                let id;
                if (isRoom) {
                    id = item[roomId.concat("_name")];
                }
                else {
                    id = item.id;
                }
                if (id in countdict) {
                    countdict[id][0] += 1;
                }
                else {
                    countdict[id] = [1, item];
                }
            }
            let length = resultList.length;
            for (const [key, value] of Object.entries(countdict)) {
                if (value[0] === length) {
                    retval.push(value[1]);
                }
            }
        }
        else {
            retval = [].concat.apply([], resultList);
            retval = retval.reduce((r, i) => !r.some(QueryUtil_1.default.compare2objects.bind(null, [i, isRoom, roomId]))
                ? [...r, i]
                : r, []);
        }
        return retval;
    }
    static queryMcomparison(mcomparator, value, content, hasNot, isRoom) {
        let retval = [];
        let mkey = QueryUtil_1.default.keyTranslation_api2dataset(Object.keys(value)[0].split("_")[1], isRoom);
        if (isRoom) {
            mkey = QueryUtil_1.default.keyTranslation_api2dataset(Object.keys(value)[0], isRoom);
        }
        let num = Object.values(value)[0];
        for (const course of content) {
            for (const section of course.result) {
                let val = section[mkey];
                val = Number(val);
                if (hasNot) {
                    if ((mcomparator === "LT" && val >= num) ||
                        (mcomparator === "EQ" && val !== num) ||
                        (mcomparator === "GT" && val <= num)) {
                        retval.push(section);
                    }
                }
                else {
                    if ((mcomparator === "LT" && val < num) ||
                        (mcomparator === "EQ" && val === num) ||
                        (mcomparator === "GT" && val > num)) {
                        retval.push(section);
                    }
                }
            }
        }
        return retval;
    }
    static queryScomparison(value, content, hasNot, isRoom) {
        let retval = [];
        let skey = QueryUtil_1.default.keyTranslation_api2dataset(Object.keys(value)[0].split("_")[1], isRoom);
        if (isRoom) {
            skey = QueryUtil_1.default.keyTranslation_api2dataset(Object.keys(value)[0], isRoom);
        }
        let inputstring = String(Object.values(value)[0]);
        for (const course of content) {
            for (const section of course.result) {
                let val = "";
                val = section[skey];
                val = String(val);
                if (hasNot) {
                    if (!QueryUtil_1.default.compareInputstr(inputstring, val)) {
                        retval.push(section);
                    }
                }
                else {
                    if (QueryUtil_1.default.compareInputstr(inputstring, val)) {
                        retval.push(section);
                    }
                }
            }
        }
        return retval;
    }
    static makeUniqueGroupCombinations(result, groupValues) {
        let uniqueCombinations = {};
        for (const item of result) {
            let groupValDict = {};
            for (const val of groupValues) {
                groupValDict[val] = item[val];
            }
            let combinationKey = JSON.stringify(groupValDict);
            if (combinationKey in uniqueCombinations) {
                uniqueCombinations[combinationKey].push(item);
            }
            else {
                uniqueCombinations[combinationKey] = [item];
            }
        }
        return uniqueCombinations;
    }
    static getValByApplytoken(applytoken, appliedKey, result) {
        let values = QueryUtil_1.default.getAllValuesGivenKey(appliedKey, result);
        switch (applytoken) {
            case "MAX": return Math.max.apply(null, values);
            case "MIN": return Math.min.apply(null, values);
            case "AVG": return QueryUtil_1.default.avg(values);
            case "COUNT": return QueryUtil_1.default.countUniqueValues(values);
            case "SUM": return QueryUtil_1.default.sum(values);
        }
        return 0;
    }
    static dropColumns(result, columnValues) {
        let retval = [];
        for (const item of result) {
            let newitem = {};
            for (const [key, value] of Object.entries(item)) {
                if (columnValues.includes(key)) {
                    if (key === "id") {
                        newitem[key] = String(value);
                    }
                    else if (key === "Year") {
                        newitem[key] = Number(value);
                    }
                    else if (key === "Course") {
                        newitem[key] = String(value);
                    }
                    else {
                        newitem[key] = value;
                    }
                }
            }
            retval.push(newitem);
        }
        return retval;
    }
    static orderSort(result, orderValue) {
        if (CheckQueryHelpers_1.default.checkString(orderValue)) {
            result.sort((a, b) => {
                return QueryUtil_1.default.sort(a, b, orderValue);
            });
            return result;
        }
        else {
            return QueryUtil_1.default.hierarchicalSort(orderValue, result);
        }
    }
}
exports.default = ParserQueryHelpers;
//# sourceMappingURL=ParserQueryHelpers.js.map