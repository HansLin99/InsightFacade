"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const InsightFacade_1 = require("./InsightFacade");
const DiskOperationsHelper_1 = require("./DiskOperationsHelper");
class CheckQueryHelpers {
    static isIdValid(id) {
        return (this.checkString(id) &&
            !(id.length < 1) &&
            !id.includes("_") &&
            !(id.replace(/\s/g, "").length < 1));
    }
    static isIdstringAndApplykeyValid(id) {
        return (this.checkString(id) &&
            !(id.length < 1) &&
            !id.includes("_"));
    }
    static isIDAdded(ifobj, id) {
        return ifobj.ids.hasOwnProperty(id);
    }
    static checkKey(ifobj, value, type) {
        if (!this.checkString(value)) {
            return false;
        }
        let key = value;
        if (!key.includes("_")) {
            return false;
        }
        let numOfUnderscore = (key.match(/_/g) || []).length;
        if (numOfUnderscore !== 1) {
            return false;
        }
        let id = key.split("_")[0];
        let field = key.split("_")[1];
        if (!this.isIDAdded(ifobj, id) || !this.isIdstringAndApplykeyValid(id)) {
            if (!this.isIDAdded(ifobj, id)) {
                if (DiskOperationsHelper_1.default.checkIfDataInDisk(ifobj, id)) {
                    DiskOperationsHelper_1.default.loadDatasetFromDisk(ifobj);
                }
                else {
                    return false;
                }
            }
            else {
                return false;
            }
        }
        let kind = this.checkIdType(ifobj, id);
        if (!this.checkMkeySkey(kind, type, field)) {
            return false;
        }
        if (!ifobj.performQueryIds.includes(id)) {
            ifobj.performQueryIds.push(id);
        }
        return true;
    }
    static checkMkeySkey(kind, type, field) {
        if (kind === "courses") {
            if (type === "skey" &&
                !InsightFacade_1.default.coursesSfield.includes(field)) {
                return false;
            }
            if (type === "mkey" &&
                !InsightFacade_1.default.coursesMfield.includes(field)) {
                return false;
            }
            if (type === "any" &&
                !InsightFacade_1.default.coursesMfield.includes(field) &&
                !InsightFacade_1.default.coursesSfield.includes(field)) {
                return false;
            }
        }
        else if (kind === "rooms") {
            if (type === "skey" && !InsightFacade_1.default.roomsSfield.includes(field)) {
                return false;
            }
            if (type === "mkey" && !InsightFacade_1.default.roomsMfield.includes(field)) {
                return false;
            }
            if (type === "any" &&
                !InsightFacade_1.default.roomsSfield.includes(field) &&
                !InsightFacade_1.default.roomsMfield.includes(field)) {
                return false;
            }
        }
        else {
            return false;
        }
        return true;
    }
    static checkIdType(ifobj, id) {
        let ds = ifobj.ids[id];
        return ds.kind;
    }
    static checkInvalidEntry(queryEntries, expectedEntries) {
        let sortedQueryEntries = queryEntries.concat().sort();
        let sortedExpectedEntries = expectedEntries.concat().sort();
        return (JSON.stringify(sortedExpectedEntries) ===
            JSON.stringify(sortedQueryEntries));
    }
    static checkSvalue(value) {
        if (!this.checkString(value)) {
            return false;
        }
        let regex = /^[*]?[^*]*[*]?$/g;
        return regex.test(value);
    }
    static checkMcomparison(ifobj, query) {
        return (this.checkIsObjectAndHasNPair(query, 1) &&
            this.checkKey(ifobj, Object.keys(query)[0], "mkey") &&
            typeof Object.values(query)[0] === "number");
    }
    static checkScomparison(ifobj, query) {
        return (this.checkIsObjectAndHasNPair(query, 1) &&
            this.checkKey(ifobj, Object.keys(query)[0], "skey") &&
            this.checkSvalue(Object.values(query)[0]));
    }
    static checkIsObjectAndHasNPair(query, numPairs) {
        return (this.checkObject(query) && Object.keys(query).length === numPairs);
    }
    static checkObject(query) {
        return query && typeof query === "object" && !(query instanceof Array);
    }
    static checkString(value) {
        return typeof value === "string" || value instanceof String;
    }
    static checkArray(value) {
        return Array.isArray(value);
    }
}
exports.default = CheckQueryHelpers;
//# sourceMappingURL=CheckQueryHelpers.js.map