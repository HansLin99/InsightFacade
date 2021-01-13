"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ParserQueryHelpers_1 = require("./ParserQueryHelpers");
const CheckQueryHelpers_1 = require("./CheckQueryHelpers");
const QueryUtil_1 = require("./QueryUtil");
const IInsightFacade_1 = require("./IInsightFacade");
class ParseQuery {
    static queryBody(queryStr, obj, id) {
        let result;
        let content = [];
        if (CheckQueryHelpers_1.default.checkIdType(obj, id) === IInsightFacade_1.InsightDatasetKind.Courses) {
            this.isRoom = false;
            content = obj.contentParsed[id].slice();
            content = QueryUtil_1.default.yearto1900(content);
        }
        else {
            this.isRoom = true;
            let contentTemp = obj.contentParsed[id].slice();
            let roomsContent = [];
            for (const item of contentTemp) {
                let newItem = {};
                newItem["result"] = [item];
                roomsContent.push(newItem);
            }
            content = roomsContent.slice();
        }
        if (CheckQueryHelpers_1.default.checkIsObjectAndHasNPair(queryStr.WHERE, 0)) {
            result = QueryUtil_1.default.getAllSection(content);
        }
        else {
            result = ParserQueryHelpers_1.default.body(queryStr.WHERE, content, false, this.isRoom, id);
        }
        return result;
    }
    static queryTrans(result, transQuery) {
        if (transQuery === undefined) {
            return result;
        }
        let groupValues = QueryUtil_1.default.keyTranslation_api2dataset_array(transQuery["GROUP"], this.isRoom);
        let applyRules = transQuery["APPLY"];
        let groupCombinations = ParserQueryHelpers_1.default.makeUniqueGroupCombinations(result, groupValues);
        let retval = [];
        for (const comb of Object.values(groupCombinations)) {
            let combDict = {};
            for (const rule of applyRules) {
                let applykey = Object.keys(rule)[0];
                let applytoken = Object.keys(Object.values(rule)[0])[0];
                let appliedkey;
                if (this.isRoom) {
                    appliedkey = QueryUtil_1.default.keyTranslation_api2dataset(Object.values(Object.values(rule)[0])[0], this.isRoom);
                }
                else {
                    appliedkey = QueryUtil_1.default.keyTranslation_api2dataset(QueryUtil_1.default.getField(Object.values(Object.values(rule)[0])[0]), this.isRoom);
                }
                combDict[applykey] = ParserQueryHelpers_1.default.getValByApplytoken(applytoken, appliedkey, comb);
            }
            for (const key of groupValues) {
                combDict[key] = comb[0][key];
            }
            retval.push(combDict);
        }
        return retval;
    }
    static queryOptions(result, optionsQuery, id, ifobj) {
        let columnValues = [];
        for (const column of optionsQuery.COLUMNS) {
            if (column.includes("_")) {
                if (this.isRoom) {
                    columnValues.push(QueryUtil_1.default.keyTranslation_api2dataset(column, this.isRoom));
                }
                else {
                    columnValues.push(QueryUtil_1.default.keyTranslation_api2dataset(QueryUtil_1.default.getField(column), this.isRoom));
                }
            }
            else {
                columnValues.push(column);
            }
        }
        result = ParserQueryHelpers_1.default.dropColumns(result, columnValues);
        if (!this.isRoom) {
            result = QueryUtil_1.default.resultReformat(result, id, ifobj, this.isRoom);
        }
        if (optionsQuery.hasOwnProperty("ORDER")) {
            result = ParserQueryHelpers_1.default.orderSort(result, optionsQuery.ORDER);
        }
        return result;
    }
}
exports.default = ParseQuery;
ParseQuery.isRoom = false;
//# sourceMappingURL=ParseQuery.js.map