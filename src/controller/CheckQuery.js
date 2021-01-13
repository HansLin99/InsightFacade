"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const InsightFacade_1 = require("./InsightFacade");
const CheckQueryHelpers_1 = require("./CheckQueryHelpers");
class CheckQuery {
    static checkSemantic(ifobj, query) {
        if (!CheckQueryHelpers_1.default.checkObject(query)) {
            return false;
        }
        let queryEntries = Object.keys(query);
        let expectedEntriesNoTrans = ["WHERE", "OPTIONS"];
        let expectedEntriesHasTrans = ["WHERE", "OPTIONS", "TRANSFORMATIONS"];
        if (queryEntries.length === 2) {
            if (!CheckQueryHelpers_1.default.checkInvalidEntry(queryEntries, expectedEntriesNoTrans)) {
                return false;
            }
        }
        else if (queryEntries.length === 3) {
            if (!CheckQueryHelpers_1.default.checkInvalidEntry(queryEntries, expectedEntriesHasTrans)) {
                return false;
            }
        }
        else {
            return false;
        }
        return ((this.checkSemanticBody(ifobj, query.WHERE) ||
            CheckQueryHelpers_1.default.checkIsObjectAndHasNPair(query.WHERE, 0)) &&
            this.checkSemanticTrans(ifobj, query.TRANSFORMATIONS) &&
            this.checkSemanticOptions(ifobj, query.OPTIONS, query.TRANSFORMATIONS !== undefined) &&
            ifobj.performQueryIds.length === 1);
    }
    static checkSemanticBody(ifobj, bodyQuery) {
        if (!CheckQueryHelpers_1.default.checkIsObjectAndHasNPair(bodyQuery, 1)) {
            return false;
        }
        let filter = Object.keys(bodyQuery)[0];
        let value = Object.values(bodyQuery)[0];
        let retval = true;
        if (InsightFacade_1.default.mcomparator.includes(filter)) {
            retval = CheckQueryHelpers_1.default.checkMcomparison(ifobj, value);
        }
        else if (InsightFacade_1.default.logic.includes(filter)) {
            if (!Array.isArray(value)) {
                retval = false;
            }
            else if (value.length < 1) {
                retval = false;
            }
            else {
                for (const subfilter of value) {
                    retval = retval && this.checkSemanticBody(ifobj, subfilter);
                }
            }
        }
        else if (filter === "IS") {
            retval = CheckQueryHelpers_1.default.checkScomparison(ifobj, value);
        }
        else if (filter === "NOT") {
            retval = this.checkSemanticBody(ifobj, value);
        }
        else {
            retval = false;
        }
        return retval;
    }
    static checkSemanticOptions(ifobj, optionsQuery, hasGroup) {
        if (!CheckQueryHelpers_1.default.checkObject(optionsQuery)) {
            return false;
        }
        let queryEntries = Object.keys(optionsQuery);
        let expectedEntries = [];
        if (queryEntries.length === 1) {
            expectedEntries = ["COLUMNS"];
            return (CheckQueryHelpers_1.default.checkInvalidEntry(queryEntries, expectedEntries) && this.checkColumns(ifobj, optionsQuery.COLUMNS, hasGroup));
        }
        else if (queryEntries.length === 2) {
            expectedEntries = ["COLUMNS", "ORDER"];
            return (CheckQueryHelpers_1.default.checkInvalidEntry(queryEntries, expectedEntries) &&
                this.checkColumns(ifobj, optionsQuery.COLUMNS, hasGroup) &&
                this.checkOrder(optionsQuery.ORDER, optionsQuery.COLUMNS));
        }
        else {
            return false;
        }
    }
    static checkColumns(ifobj, columnValue, hasGroup) {
        if (!CheckQueryHelpers_1.default.checkArray(columnValue)) {
            return false;
        }
        if (columnValue.length < 1) {
            return false;
        }
        let keys = columnValue;
        if (hasGroup) {
            for (const key of keys) {
                if (!ifobj.applyKeysAndGroupKey.includes(key)) {
                    return false;
                }
            }
        }
        else {
            for (const key of keys) {
                if (!CheckQueryHelpers_1.default.checkKey(ifobj, key, "any")) {
                    return false;
                }
            }
        }
        return true;
    }
    static checkOrder(orderValue, columnValue) {
        if (CheckQueryHelpers_1.default.checkString(orderValue)) {
            return columnValue.includes(orderValue);
        }
        else {
            if (CheckQueryHelpers_1.default.checkIsObjectAndHasNPair(orderValue, 2) &&
                CheckQueryHelpers_1.default.checkInvalidEntry(Object.keys(orderValue), [
                    "dir",
                    "keys",
                ])) {
                let direction = orderValue["dir"];
                let keys = orderValue["keys"];
                if (!InsightFacade_1.default.direction.includes(direction)) {
                    return false;
                }
                if (!CheckQueryHelpers_1.default.checkArray(keys)) {
                    return false;
                }
                if (keys.length < 1) {
                    return false;
                }
                for (const key of keys) {
                    if (!columnValue.includes(key)) {
                        return false;
                    }
                }
                return true;
            }
            else {
                return false;
            }
        }
    }
    static checkSemanticTrans(ifobj, transQuery) {
        if (transQuery === undefined) {
            return true;
        }
        if (!CheckQueryHelpers_1.default.checkObject(transQuery)) {
            return false;
        }
        let queryEntries = Object.keys(transQuery);
        let expectedEntries = ["GROUP", "APPLY"];
        return (CheckQueryHelpers_1.default.checkInvalidEntry(queryEntries, expectedEntries) &&
            this.checkGroup(ifobj, transQuery.GROUP) &&
            this.checkApply(ifobj, transQuery.APPLY));
    }
    static checkGroup(ifobj, groupValue) {
        if (!CheckQueryHelpers_1.default.checkArray(groupValue)) {
            return false;
        }
        if (groupValue.length < 1) {
            return false;
        }
        let keys = groupValue;
        for (const key of keys) {
            if (!CheckQueryHelpers_1.default.checkKey(ifobj, key, "any")) {
                return false;
            }
        }
        ifobj.applyKeysAndGroupKey = keys.concat(ifobj.applyKeysAndGroupKey);
        return true;
    }
    static checkApply(ifobj, applyValue) {
        if (!Array.isArray(applyValue)) {
            return false;
        }
        if (applyValue.length === 0) {
            return true;
        }
        let applyRules = applyValue;
        let applyKeys = [];
        for (const rule of applyRules) {
            if (!this.checkApplyRule(ifobj, rule, applyKeys)) {
                return false;
            }
        }
        ifobj.applyKeysAndGroupKey = ifobj.applyKeysAndGroupKey.concat(applyKeys);
        return true;
    }
    static checkApplyRule(ifobj, rule, applyKeys) {
        if (!CheckQueryHelpers_1.default.checkIsObjectAndHasNPair(rule, 1)) {
            return false;
        }
        let applyKey = Object.keys(rule)[0];
        let applyVal = Object.values(rule)[0];
        if (!CheckQueryHelpers_1.default.isIdstringAndApplykeyValid(applyKey)) {
            return false;
        }
        if (applyKeys.includes(applyKey)) {
            return false;
        }
        applyKeys.push(applyKey);
        if (!CheckQueryHelpers_1.default.checkIsObjectAndHasNPair(applyVal, 1)) {
            return false;
        }
        let applyToken = Object.keys(applyVal)[0];
        let key = Object.values(applyVal)[0];
        if (!InsightFacade_1.default.applyToken.includes(applyToken)) {
            return false;
        }
        if (!CheckQueryHelpers_1.default.checkKey(ifobj, key, "any")) {
            return false;
        }
        if (InsightFacade_1.default.numApplyToken.includes(applyToken)) {
            let id = key.split("_")[0];
            let field = key.split("_")[1];
            let kind = CheckQueryHelpers_1.default.checkIdType(ifobj, id);
            if (kind === "courses" &&
                !InsightFacade_1.default.coursesMfield.includes(field)) {
                return false;
            }
            else if (kind === "rooms" &&
                !InsightFacade_1.default.roomsMfield.includes(field)) {
                return false;
            }
        }
        return true;
    }
}
exports.default = CheckQuery;
//# sourceMappingURL=CheckQuery.js.map