import InsightFacade from "./InsightFacade";
import DiskOperationsHelper from "./DiskOperationsHelper";
import { InsightDataset } from "./IInsightFacade";

export default class CheckQueryHelpers {
    // Invalid cases: 1. has underscore 2. zero length 3. has only whitespace
    public static isIdValid(id: string): boolean {
        return (
            this.checkString(id) &&
            !(id.length < 1) &&
            !id.includes("_") &&
            !(id.replace(/\s/g, "").length < 1)
        );
    }

    public static isIdstringAndApplykeyValid(id: string): boolean {
        return (
            this.checkString(id) &&
            !(id.length < 1) &&
            !id.includes("_")
        );
    }

    // assuming private fields has been filled by loaddata already and don't need to check disk
    public static isIDAdded(ifobj: InsightFacade, id: string): boolean {
        return ifobj.ids.hasOwnProperty(id);
    }

    // key: idstring_field; type: mkey/skey/any
    public static checkKey(
        ifobj: InsightFacade,
        value: any,
        type: string,
    ): boolean {
        if (!this.checkString(value)) {
            return false;
        }

        let key: string = value;
        // Invalid if there's no underscore
        if (!key.includes("_")) {
            return false;
        }
        // https://stackoverflow.com/questions/881085/
        // count-the-number-of-occurrences-of-a-character-in-a-string-in-javascript
        let numOfUnderscore = (key.match(/_/g) || []).length;

        // Invalid if there're more than 1 underscores
        if (numOfUnderscore !== 1) {
            return false;
        }

        let id = key.split("_")[0];
        let field = key.split("_")[1];

        // Check if the dataset has been added
        // Do not need to check if it's valid since invalid key will not be added at all
        if (!this.isIDAdded(ifobj, id) || !this.isIdstringAndApplykeyValid(id)) {
            if (!this.isIDAdded(ifobj, id)) {
                if (DiskOperationsHelper.checkIfDataInDisk(ifobj, id)) {
                    DiskOperationsHelper.loadDatasetFromDisk(ifobj);
                } else {
                    return false;
                }
            } else {
                return false;
            }
        }

        let kind: string = this.checkIdType(ifobj, id);
        if (!this.checkMkeySkey(kind, type, field)) {
            return false;
        }

        // For checking if performQuery refers to multiple key
        if (!ifobj.performQueryIds.includes(id)) {
            ifobj.performQueryIds.push(id);
        }
        return true;
    }

    public static checkMkeySkey(kind: string, type: string, field: string) {
        if (kind === "courses") {
            // Check if fields are valid
            if (
                type === "skey" &&
                !InsightFacade.coursesSfield.includes(field)
            ) {
                return false;
            }
            if (
                type === "mkey" &&
                !InsightFacade.coursesMfield.includes(field)
            ) {
                return false;
            }
            if (
                type === "any" &&
                !InsightFacade.coursesMfield.includes(field) &&
                !InsightFacade.coursesSfield.includes(field)
            ) {
                return false;
            }
        } else if (kind === "rooms") {
            // Check if fields are valid
            if (type === "skey" && !InsightFacade.roomsSfield.includes(field)) {
                return false;
            }
            if (type === "mkey" && !InsightFacade.roomsMfield.includes(field)) {
                return false;
            }
            if (
                type === "any" &&
                !InsightFacade.roomsSfield.includes(field) &&
                !InsightFacade.roomsMfield.includes(field)
            ) {
                return false;
            }
        } else {
            return false;
        }
        return true;
    }

    public static checkIdType(ifobj: InsightFacade, id: any): string {
        let ds: InsightDataset = ifobj.ids[id];
        return ds.kind;
    }

    // Case sensitive, i.e. "WHERE" !== "where"
    // Assuming repetitive entries will be handled by JSON
    // Reference of array comparing: https://www.geeksforgeeks.org/how-to-compare-two-arrays-in-javascript/
    public static checkInvalidEntry(
        queryEntries: string[],
        expectedEntries: string[],
    ): boolean {
        let sortedQueryEntries = queryEntries.concat().sort();
        let sortedExpectedEntries = expectedEntries.concat().sort();
        return (
            JSON.stringify(sortedExpectedEntries) ===
            JSON.stringify(sortedQueryEntries)
        );
    }

    public static checkSvalue(value: any): boolean {
        if (!this.checkString(value)) {
            return false;
        }
        let regex = /^[*]?[^*]*[*]?$/g;
        return regex.test(value);
    }

    public static checkMcomparison(ifobj: InsightFacade, query: any): boolean {
        return (
            this.checkIsObjectAndHasNPair(query, 1) &&
            this.checkKey(ifobj, Object.keys(query)[0], "mkey") &&
            typeof Object.values(query)[0] === "number"
        );
    }

    public static checkScomparison(ifobj: InsightFacade, query: any): boolean {
        return (
            this.checkIsObjectAndHasNPair(query, 1) &&
            this.checkKey(ifobj, Object.keys(query)[0], "skey") &&
            this.checkSvalue(Object.values(query)[0])
        );
    }

    public static checkIsObjectAndHasNPair(
        query: any,
        numPairs: number,
    ): boolean {
        return (
            this.checkObject(query) && Object.keys(query).length === numPairs
        );
    }

    // https://stackoverflow.com/a/8511332
    public static checkObject(query: any): boolean {
        return query && typeof query === "object" && !(query instanceof Array);
    }

    // https://stackoverflow.com/questions/6286542/how-can-i-check-if-a-var-is-a-string-in-javascript
    public static checkString(value: any): boolean {
        return typeof value === "string" || value instanceof String;
    }

    public static checkArray(value: any): boolean {
        return Array.isArray(value);
    }
}
