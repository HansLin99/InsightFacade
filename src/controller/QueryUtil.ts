import Decimal from "decimal.js";
import InsightFacade from "./InsightFacade";

export default class QueryUtil {
    public static getField(key: string): string {
        return key.split("_")[1];
    }

    public static keyTranslation_api2dataset_array(
        arr: string[],
        isRoom: boolean,
    ): string[] {
        if (isRoom) {
            return arr;
        }
        let retval: string[] = [];
        for (const key of arr) {
            let field: string = this.keyTranslation_api2dataset(
                this.getField(key),
                isRoom,
            );
            retval.push(field);
        }
        return retval;
    }

    public static keyTranslation_api2dataset(
        key: string,
        isRoom: boolean,
    ): string {
        if (isRoom) {
            return key;
        }
        let translatedKey = "";
        let specialKeys = ["dept", "id", "uuid", "instructor"];
        if (specialKeys.includes(key)) {
            if (key === "dept") {
                translatedKey = "Subject";
            } else if (key === "id") {
                translatedKey = "Course";
            } else if (key === "uuid") {
                translatedKey = "id";
            } else if (key === "instructor") {
                translatedKey = "Professor";
            }
        } else {
            translatedKey = key[0].toUpperCase() + key.slice(1);
        }
        return translatedKey;
    }

    public static keyTranslation_dataset2api(
        key: string,
        isRoom: boolean,
    ): string {
        if (isRoom) {
            return key;
        }
        let translatedKey = "";
        let specialKeys = ["Subject", "Course", "id", "Professor"];
        if (specialKeys.includes(key)) {
            if (key === "Subject") {
                translatedKey = "dept";
            } else if (key === "id") {
                translatedKey = "uuid";
            } else if (key === "Course") {
                translatedKey = "id";
            } else if (key === "Professor") {
                translatedKey = "instructor";
            }
        } else {
            translatedKey = key[0].toLowerCase() + key.slice(1);
        }
        return translatedKey;
    }

    public static getAllSection(
        content: any,
    ): Array<{ [key: string]: number | string }> {
        let retval: Array<{ [key: string]: number | string }> = [];
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

    public static yearto1900(content: any): object[] {
        for (const course of content) {
            for (const section of course.result) {
                if (section.Section === "overall") {
                    section.Year = 1900;
                }
            }
        }
        return content;
    }

    public static resultReformat(
        result: Array<{ [p: string]: number | string }>,
        id: string,
        ifobj: InsightFacade,
        isRoom: boolean,
    ): Array<{ [p: string]: number | string }> {
        let reformatted: Array<{ [key: string]: number | string }> = [];
        for (const item of result) {
            let newobject: { [key: string]: number | string } = {};
            for (const [key, value] of Object.entries(item)) {
                let newkey: string;
                if (!ifobj.applyKeysAndGroupKey.includes(key)) {
                    newkey = id.concat(
                        "_".concat(
                            this.keyTranslation_dataset2api(key, isRoom),
                        ),
                    );
                } else {
                    newkey = key;
                }
                newobject[newkey] = value;
            }
            reformatted.push(newobject);
        }
        return reformatted;
    }

    public static compareInputstr(
        inputstring: string,
        contentstring: string,
    ): boolean {
        let firstChar: string = inputstring[0];
        let lastChar: string = inputstring[inputstring.length - 1];
        let searchStr;

        if (inputstring === "*" || inputstring === "**") {
            return true;
        }

        if (firstChar === "*" && lastChar === "*") {
            searchStr = inputstring.substring(1, inputstring.length - 1);
            return contentstring.includes(searchStr);
        } else if (firstChar === "*") {
            searchStr = inputstring.substring(1);
            return contentstring.endsWith(searchStr);
        } else if (lastChar === "*") {
            searchStr = inputstring.substring(0, inputstring.length - 1);
            return contentstring.startsWith(searchStr);
        } else {
            return contentstring === inputstring;
        }
    }

    // True if two objects are considered the same section
    public static compare2objects(args: any[], obj0: any): boolean {
        let obj1 = args[0];
        let isRoom = args[1];
        let roomId = args[2];
        if (isRoom) {
            let id: string = roomId.concat("_name");
            return obj0[id] === obj1[id];
        }
        return obj0.id === obj1.id;
    }

    public static getAllValuesGivenKey(
        key: string,
        result: Array<{ [key: string]: number | string }>,
    ): any[] {
        let retval: any[] = [];
        for (const item of result) {
            retval.push(item[key]);
        }
        this.assert(retval.length === result.length);
        return retval;
    }

    public static countUniqueValues(arr: any[]): number {
        return new Set(arr).size;
    }

    public static sum(arr: any[]): number {
        return Number(arr.reduce((a, b) => a + b, 0).toFixed(2));
    }

    public static avg(arr: any[]): number {
        let total: Decimal = new Decimal(0);
        for (const num of arr) {
            let convertedNum = new Decimal(num);
            total = Decimal.add(total, convertedNum);
        }
        let avg = total.toNumber() / arr.length;
        return Number(avg.toFixed(2));
    }

    public static assert(condition: boolean) {
        if (!condition) {
            throw Error("Assert failed.");
        }
    }

    public static sort(a: any, b: any, orderValue: string): number {
        if (a[orderValue] < b[orderValue]) {
            return -1;
        }
        if (a[orderValue] > b[orderValue]) {
            return 1;
        }
        return 0;
    }

    public static hierarchicalSort(
        sort: any,
        result: Array<{ [key: string]: number | string }>,
    ): Array<{ [key: string]: number | string }> {
        let direction: string = sort["dir"];
        let reversedKeysArr: string[] = sort["keys"].reverse();

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
