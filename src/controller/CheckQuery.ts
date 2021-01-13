import InsightFacade from "./InsightFacade";
import CheckQueryHelpers from "./CheckQueryHelpers";
import QueryUtil from "./QueryUtil";

export default class CheckQuery {
    public static checkSemantic(ifobj: InsightFacade, query: any): boolean {
        if (!CheckQueryHelpers.checkObject(query)) {
            return false;
        }
        let queryEntries = Object.keys(query);

        let expectedEntriesNoTrans = ["WHERE", "OPTIONS"];
        let expectedEntriesHasTrans = ["WHERE", "OPTIONS", "TRANSFORMATIONS"];
        if (queryEntries.length === 2) {
            if (!CheckQueryHelpers.checkInvalidEntry(queryEntries, expectedEntriesNoTrans)) {
                return false;
            }
        } else if (queryEntries.length === 3) {
            if (!CheckQueryHelpers.checkInvalidEntry(queryEntries, expectedEntriesHasTrans)) {
                return false;
            }
        } else {
            return false;
        }

        return (
            (this.checkSemanticBody(ifobj, query.WHERE) ||
                CheckQueryHelpers.checkIsObjectAndHasNPair(query.WHERE, 0)) &&
            this.checkSemanticTrans(ifobj, query.TRANSFORMATIONS) &&
            this.checkSemanticOptions(
                ifobj,
                query.OPTIONS,
                query.TRANSFORMATIONS !== undefined,
            ) &&
            ifobj.performQueryIds.length === 1
        );
    }

    // 1. BODY
    private static checkSemanticBody(
        ifobj: InsightFacade,
        bodyQuery: any,
    ): boolean {
        if (!CheckQueryHelpers.checkIsObjectAndHasNPair(bodyQuery, 1)) {
            return false;
        }

        let filter: string = Object.keys(bodyQuery)[0];
        let value = Object.values(bodyQuery)[0];
        let retval: boolean = true;

        if (InsightFacade.mcomparator.includes(filter)) {
            retval = CheckQueryHelpers.checkMcomparison(ifobj, value);
        } else if (InsightFacade.logic.includes(filter)) {
            if (!Array.isArray(value)) {
                retval = false;
            } else if (value.length < 1) {
                retval = false;
            } else {
                for (const subfilter of value) {
                    retval = retval && this.checkSemanticBody(ifobj, subfilter);
                }
            }
        } else if (filter === "IS") {
            retval = CheckQueryHelpers.checkScomparison(ifobj, value);
        } else if (filter === "NOT") {
            retval = this.checkSemanticBody(ifobj, value);
        } else {
            retval = false; // Invalid filter
        }

        return retval;
    }

    // 2. OPTIONS
    private static checkSemanticOptions(
        ifobj: InsightFacade,
        optionsQuery: any,
        hasGroup: boolean,
    ): boolean {
        if (!CheckQueryHelpers.checkObject(optionsQuery)) {
            return false;
        }
        // Check if invalid entry
        let queryEntries = Object.keys(optionsQuery);
        let expectedEntries = [];

        if (queryEntries.length === 1) {
            expectedEntries = ["COLUMNS"];
            return (
                CheckQueryHelpers.checkInvalidEntry(
                    queryEntries,
                    expectedEntries,
                ) && this.checkColumns(ifobj, optionsQuery.COLUMNS, hasGroup)
            );
        } else if (queryEntries.length === 2) {
            expectedEntries = ["COLUMNS", "ORDER"];
            return (
                CheckQueryHelpers.checkInvalidEntry(
                    queryEntries,
                    expectedEntries,
                ) &&
                this.checkColumns(ifobj, optionsQuery.COLUMNS, hasGroup) &&
                this.checkOrder(optionsQuery.ORDER, optionsQuery.COLUMNS)
            );
        } else {
            return false;
        }
    }

    private static checkColumns(
        ifobj: InsightFacade,
        columnValue: any,
        hasGroup: boolean,
    ): boolean {
        if (!CheckQueryHelpers.checkArray(columnValue)) {
            return false;
        }
        if (columnValue.length < 1) {
            return false;
        }
        let keys: string[] = columnValue;
        if (hasGroup) {
            for (const key of keys) {
                if (!ifobj.applyKeysAndGroupKey.includes(key)) {
                    return false;
                }
            }
        } else {
            for (const key of keys) {
                if (!CheckQueryHelpers.checkKey(ifobj, key, "any")) {
                    return false;
                }
            }
        }
        return true;
    }

    private static checkOrder(
        orderValue: any,
        columnValue: string[],
    ): boolean {
        if (CheckQueryHelpers.checkString(orderValue)) {
            // If ordervalue is string, expect ANYKEY
            return columnValue.includes(orderValue);
        } else {
            if (
                // If ordervalue is an object and has dir && keys
                CheckQueryHelpers.checkIsObjectAndHasNPair(orderValue, 2) &&
                CheckQueryHelpers.checkInvalidEntry(Object.keys(orderValue), [
                    "dir",
                    "keys",
                ])
            ) {
                let direction: any = orderValue["dir"];
                let keys: any = orderValue["keys"];

                if (!InsightFacade.direction.includes(direction)) {
                    return false;
                }
                if (!CheckQueryHelpers.checkArray(keys)) {
                    return false;
                }
                if (keys.length < 1) {
                    return false;
                }
                // Check if every key is found in COLUMNS
                for (const key of keys) {
                    if (!columnValue.includes(key)) {
                        return false;
                    }
                }
                return true;
            } else {
                return false;
            }
        }
    }

    // 3. TRANSFORMATION
    // Should have both GROUP and APPLY
    private static checkSemanticTrans(
        ifobj: InsightFacade,
        transQuery: any,
    ): boolean {
        if (transQuery === undefined) {
            return true; // It's ok to not have TRANSFORMATIONS
        }
        if (!CheckQueryHelpers.checkObject(transQuery)) {
            return false;
        }
        // Check if invalid entry
        let queryEntries = Object.keys(transQuery);
        let expectedEntries = ["GROUP", "APPLY"];
        return (
            CheckQueryHelpers.checkInvalidEntry(
                queryEntries,
                expectedEntries,
            ) &&
            this.checkGroup(ifobj, transQuery.GROUP) &&
            this.checkApply(ifobj, transQuery.APPLY)
        );
    }

    private static checkGroup(ifobj: InsightFacade, groupValue: any): boolean {
        if (!CheckQueryHelpers.checkArray(groupValue)) {
            return false;
        }
        if (groupValue.length < 1) {
            return false;
        }
        let keys: string[] = groupValue;
        for (const key of keys) {
            if (!CheckQueryHelpers.checkKey(ifobj, key, "any")) {
                return false;
            }
        }
        ifobj.applyKeysAndGroupKey = keys.concat(ifobj.applyKeysAndGroupKey);
        return true;
    }

    private static checkApply(ifobj: InsightFacade, applyValue: any): boolean {
        if (!Array.isArray(applyValue)) {
            return false;
        }
        if (applyValue.length === 0) {
            return true;
        }
        let applyRules: any[] = applyValue;
        let applyKeys: string[] = [];
        for (const rule of applyRules) {
            if (!this.checkApplyRule(ifobj, rule, applyKeys)) {
                return false;
            }
        }
        ifobj.applyKeysAndGroupKey = ifobj.applyKeysAndGroupKey.concat(
            applyKeys,
        );
        return true;
    }

    private static checkApplyRule(
        ifobj: InsightFacade,
        rule: any,
        applyKeys: string[],
    ): boolean {
        if (!CheckQueryHelpers.checkIsObjectAndHasNPair(rule, 1)) {
            return false;
        }
        let applyKey: any = Object.keys(rule)[0];
        let applyVal: any = Object.values(rule)[0];
        if (!CheckQueryHelpers.isIdstringAndApplykeyValid(applyKey)) {
            return false;
        }
        if (applyKeys.includes(applyKey)) {
            return false;
        }
        applyKeys.push(applyKey);
        if (!CheckQueryHelpers.checkIsObjectAndHasNPair(applyVal, 1)) {
            return false;
        }

        let applyToken: any = Object.keys(applyVal)[0];
        let key: any = Object.values(applyVal)[0];
        if (!InsightFacade.applyToken.includes(applyToken)) {
            return false;
        }
        if (!CheckQueryHelpers.checkKey(ifobj, key, "any")) {
            return false;
        }
        if (InsightFacade.numApplyToken.includes(applyToken)) {
            let id: string = key.split("_")[0];
            let field: string = key.split("_")[1];
            let kind: string = CheckQueryHelpers.checkIdType(ifobj, id);
            if (
                kind === "courses" &&
                !InsightFacade.coursesMfield.includes(field)
            ) {
                return false;
            } else if (
                kind === "rooms" &&
                !InsightFacade.roomsMfield.includes(field)
            ) {
                return false;
            }
        }
        return true;
    }
}
