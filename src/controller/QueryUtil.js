"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const decimal_js_1 = require("decimal.js");
class QueryUtil {
    static getField(key) {
        return key.split("_")[1];
    }
    static keyTranslation_api2dataset_array(arr, isRoom) {
        if (isRoom) {
            return arr;
        }
        let retval = [];
        for (const key of arr) {
            let field = this.keyTranslation_api2dataset(this.getField(key), isRoom);
            retval.push(field);
        }
        return retval;
    }
    static keyTranslation_api2dataset(key, isRoom) {
        if (isRoom) {
            return key;
        }
        let translatedKey = "";
        let specialKeys = ["dept", "id", "uuid", "instructor"];
        if (specialKeys.includes(key)) {
            if (key === "dept") {
                translatedKey = "Subject";
            }
            else if (key === "id") {
                translatedKey = "Course";
            }
            else if (key === "uuid") {
                translatedKey = "id";
            }
            else if (key === "instructor") {
                translatedKey = "Professor";
            }
        }
        else {
            translatedKey = key[0].toUpperCase() + key.slice(1);
        }
        return translatedKey;
    }
    static keyTranslation_dataset2api(key, isRoom) {
        if (isRoom) {
            return key;
        }
        let translatedKey = "";
        let specialKeys = ["Subject", "Course", "id", "Professor"];
        if (specialKeys.includes(key)) {
            if (key === "Subject") {
                translatedKey = "dept";
            }
            else if (key === "id") {
                translatedKey = "uuid";
            }
            else if (key === "Course") {
                translatedKey = "id";
            }
            else if (key === "Professor") {
                translatedKey = "instructor";
            }
        }
        else {
            translatedKey = key[0].toLowerCase() + key.slice(1);
        }
        return translatedKey;
    }
    static getAllSection(content) {
        let retval = [];
        for (const course of content) {
            for (const section of course.result) {
                retval.push(section);
                if (retval.length > 5000) {
                    return retval;
                }
            }
        }
        return retval;
    }
    static yearto1900(content) {
        for (const course of content) {
            for (const section of course.result) {
                if (section.Section === "overall") {
                    section.Year = 1900;
                }
            }
        }
        return content;
    }
    static resultReformat(result, id, ifobj, isRoom) {
        let reformatted = [];
        for (const item of result) {
            let newobject = {};
            for (const [key, value] of Object.entries(item)) {
                let newkey;
                if (!ifobj.applyKeysAndGroupKey.includes(key)) {
                    newkey = id.concat("_".concat(this.keyTranslation_dataset2api(key, isRoom)));
                }
                else {
                    newkey = key;
                }
                newobject[newkey] = value;
            }
            reformatted.push(newobject);
        }
        return reformatted;
    }
    static compareInputstr(inputstring, contentstring) {
        let firstChar = inputstring[0];
        let lastChar = inputstring[inputstring.length - 1];
        let searchStr;
        if (inputstring === "*" || inputstring === "**") {
            return true;
        }
        if (firstChar === "*" && lastChar === "*") {
            searchStr = inputstring.substring(1, inputstring.length - 1);
            return contentstring.includes(searchStr);
        }
        else if (firstChar === "*") {
            searchStr = inputstring.substring(1);
            return contentstring.endsWith(searchStr);
        }
        else if (lastChar === "*") {
            searchStr = inputstring.substring(0, inputstring.length - 1);
            return contentstring.startsWith(searchStr);
        }
        else {
            return contentstring === inputstring;
        }
    }
    static compare2objects(args, obj0) {
        let obj1 = args[0];
        let isRoom = args[1];
        let roomId = args[2];
        if (isRoom) {
            let id = roomId.concat("_name");
            return obj0[id] === obj1[id];
        }
        return obj0.id === obj1.id;
    }
    static getAllValuesGivenKey(key, result) {
        let retval = [];
        for (const item of result) {
            retval.push(item[key]);
        }
        this.assert(retval.length === result.length);
        return retval;
    }
    static countUniqueValues(arr) {
        return new Set(arr).size;
    }
    static sum(arr) {
        return Number(arr.reduce((a, b) => a + b, 0).toFixed(2));
    }
    static avg(arr) {
        let total = new decimal_js_1.default(0);
        for (const num of arr) {
            let convertedNum = new decimal_js_1.default(num);
            total = decimal_js_1.default.add(total, convertedNum);
        }
        let avg = total.toNumber() / arr.length;
        return Number(avg.toFixed(2));
    }
    static assert(condition) {
        if (!condition) {
            throw Error("Assert failed.");
        }
    }
    static sort(a, b, orderValue) {
        if (a[orderValue] < b[orderValue]) {
            return -1;
        }
        if (a[orderValue] > b[orderValue]) {
            return 1;
        }
        return 0;
    }
    static hierarchicalSort(sort, result) {
        let direction = sort["dir"];
        let reversedKeysArr = sort["keys"].reverse();
        for (const key of reversedKeysArr) {
            result.sort((a, b) => {
                return QueryUtil.sort(a, b, key);
            });
        }
        if (direction === "DOWN") {
            result = result.reverse();
        }
        return result;
    }
}
exports.default = QueryUtil;
//# sourceMappingURL=QueryUtil.js.map