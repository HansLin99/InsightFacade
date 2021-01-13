/**
 * Builds a query object using the current document object model (DOM).
 * Must use the browser's global document object {@link https://developer.mozilla.org/en-US/docs/Web/API/Document}
 * to read DOM information.
 *
 * @returns query object adhering to the query EBNF
 */
CampusExplorer.buildQuery = () => {
    let query = {};
    query["WHERE"] = {};
    query["OPTIONS"] = {};
    query["OPTIONS"]["COLUMNS"] = [];
    let form = document.getElementById("form-container")
        .getElementsByClassName("tab-panel active")[0].getElementsByTagName("form")[0];
    let datasetType = form.getAttribute("data-type");
    try {
        getConditions(form, query, datasetType);
        getGroups(form, query, datasetType);
        getOrder(form, query, datasetType);
        getTransformations(form, query, datasetType);
        getColumns(form, query, datasetType);
    } catch (e) {
        console.log(e);
    }
    return query;
};

function getConditions(form, query, datasetType) {
    let conditions = form.getElementsByClassName("form-group conditions")[0];
    let container = conditions.getElementsByClassName("conditions-container")[0];
    let type;
    let conditionType = conditions.getElementsByClassName("control-group condition-type")[0];
    for (let checkbox of conditionType.getElementsByTagName("input")) {
        if (checkbox.hasAttribute("checked")) {
            type = checkbox.getAttribute("value");
        }
    }
    if (container.childNodes.length === 0) {
        return;
    } else if (container.childNodes.length === 1) {
        let tempQuery = query["WHERE"];
        if (type === "none") {
            query["WHERE"]["NOT"] = {};
            tempQuery = query["WHERE"]["NOT"];
        }
        let filter = container.childNodes[0];
        let result = {};
        getCondHelper(filter, datasetType, result);
        if (result.not === "NOT") {
            tempQuery["NOT"] = {};
            tempQuery = tempQuery["NOT"];
        }
        tempQuery[result.operator] = {};
        tempQuery = tempQuery[result.operator];
        tempQuery[result.field] = result.term;
    } else{
        let tempQuery = query["WHERE"];
        if (type === "none") {
            query["WHERE"]["NOT"] = {};
            query["WHERE"]["NOT"]["OR"] = [];
            tempQuery = query["WHERE"]["NOT"]["OR"];
        } else if (type === "all") {
            query["WHERE"]["AND"] = [];
            tempQuery = query["WHERE"]["AND"];
        } else {
            query["WHERE"]["OR"] = [];
            tempQuery = query["WHERE"]["OR"];
        }
        for (const filter of container.childNodes) {
            let result = {};
            getCondHelper(filter, datasetType, result);
            let tmp = {};
            if (result.not === "NOT") {
                tmp["NOT"] = {};
                tmp["NOT"][result.operator] = {};
                tmp["NOT"][result.operator][result.field] = result.term;
            } else {
                tmp[result.operator] = {};
                tmp[result.operator][result.field] = result.term;
            }
            tempQuery.push(tmp);
        }
    }

}

function getCondHelper(filter, datasetType, obj) {
    let controlNot = filter.getElementsByClassName("control not")[0];
    let controlField = filter.getElementsByClassName("control fields")[0];
    let controlOperator = filter.getElementsByClassName("control operators")[0];
    let controlTerm = filter.getElementsByClassName("control term")[0];
    let numberField = ["avg", "pass", "fail", "audit", "year", "lat", "lon", "seats"];
    if (controlNot.getElementsByTagName("input")[0].hasAttribute("checked")) {
        obj.not = "NOT";
    } else {
        obj.not = 0;
    }
    for (const option of controlOperator.getElementsByTagName("option")) {
        if (option.hasAttribute("selected")) {
            obj.operator = option.getAttribute("value");
        }
    }

    for (const option of controlField.getElementsByTagName("option")) {
        if (option.hasAttribute("selected")) {
            obj.field = datasetType + "_" + option.getAttribute("value");
        }
    }
    if (!controlTerm.getElementsByTagName("input")[0].hasAttribute("value")) {
        obj.term = "";
    } else {
        let f = obj.field.split("_")[1];
        if (numberField.includes(f)) {
            obj.term = parseFloat(controlTerm.getElementsByTagName("input")[0]
                .getAttribute("value"));
        } else {
            obj.term = controlTerm.getElementsByTagName("input")[0]
                .getAttribute("value");
        }
    }
}

function getColumns(form, query, datasetType) {
    let columns = form.getElementsByClassName("form-group columns")[0];
    let controlFields = columns.getElementsByClassName("control field");
    let transFields = columns.getElementsByClassName("control transformation");
    let fArray = ["avg", "pass", "fail", "audit", "year", "lat", "lon", "seats", "dept", "id", "instructor", "title",
    "uuid", "fullname", "shortname", "number", "name", "address", "type", "furniture", "href"];
    for (let field of controlFields) {
        let checkbox = field.getElementsByTagName("input")[0];
        if (checkbox.hasAttribute("checked")) {
            query["OPTIONS"]["COLUMNS"].push(datasetType + "_" + checkbox.getAttribute("value"));
        }
    }
    if (transFields.length > 0) {
        for (let field of transFields) {
            let checkbox = field.getElementsByTagName("input")[0];
            if (checkbox.hasAttribute("checked")) {
                query["OPTIONS"]["COLUMNS"].push(checkbox.getAttribute("value"));
            }
        }
    }

}

function getOrder(form, query, datasetType) {
    let order = form.getElementsByClassName("form-group order")[0];
    let controlFields = order.getElementsByClassName("control order fields")[0];
    let descending = order.getElementsByClassName("control descending")[0]
        .getElementsByTagName("input")[0];
    let orderKeys = [];
    let fArray = ["avg", "pass", "fail", "audit", "year", "lat", "lon", "seats", "dept", "id", "instructor", "title",
        "uuid", "fullname", "shortname", "number", "name", "address", "type", "furniture", "href"];
    let orderString = "UP";

    for (let field of controlFields.getElementsByTagName("select")[0]) {
        if (field.hasAttribute("selected")) {
            orderKeys.push(field.getAttribute("value"));
        }
    }

    if (descending.hasAttribute("checked")) {
        orderString = "DOWN";
    }

    if (orderKeys.length > 0) {
        if (orderKeys.length === 1) {
            try {
                if (orderString === "DOWN") {
                    query["OPTIONS"]["ORDER"] = {};
                    query["OPTIONS"]["ORDER"]["dir"] = orderString;
                    if (fArray.includes(orderKeys[0])) {
                        query["OPTIONS"]["ORDER"]["keys"] = orderKeys.map(x => datasetType + "_" + x);
                    } else {
                        query["OPTIONS"]["ORDER"]["keys"] = orderKeys;
                    }
                } else {
                    query["OPTIONS"]["ORDER"] = orderKeys.map((x) => {
                        if (fArray.includes(x)) {
                            return datasetType + "_" + x;
                        } else {
                            return x;
                        }
                    })[0];
                }
            } catch (e) {
                console.log(e.message);
            }

        } else {
            try {
                query["OPTIONS"]["ORDER"] = {};
                query["OPTIONS"]["ORDER"]["dir"] = orderString;
                query["OPTIONS"]["ORDER"]["keys"] = orderKeys.map(x => datasetType + "_" + x);
            } catch (e) {
                console.log(e.message);
            }
        }
    }
}

function getGroups(form, query, datasetType) {
    let groups = form.getElementsByClassName("form-group groups")[0];
    let groupsArray  = [];
    let fields = groups.getElementsByTagName("input");
    for (const field of fields) {
        if (field.hasAttribute("checked")) {
            groupsArray.push(datasetType + "_" + field.getAttribute("value"));
        }
    }
    if (groupsArray.length > 0) {
        if (!query.hasOwnProperty("TRANSFORMATIONS")) {
            query["TRANSFORMATIONS"] = {};
            query["TRANSFORMATIONS"]["GROUP"] = [...groupsArray];
            query["TRANSFORMATIONS"]["APPLY"] = [];
        } else if (!query["TRANSFORMATIONS"].hasOwnProperty("APPLY")) {
            query["TRANSFORMATIONS"]["GROUP"] = [...groupsArray];
            query["TRANSFORMATIONS"]["APPLY"] = [];
        }
    }
}

function getTransformations(form, query, datasetType) {
    let transformations = form.getElementsByClassName("form-group transformations")[0];
    let container = transformations.getElementsByClassName("transformations-container")[0];
    if (container.childNodes.length > 0) {
        if (!query.hasOwnProperty("TRANSFORMATIONS")) {
            query["TRANSFORMATIONS"] = {};
            query["TRANSFORMATIONS"]["GROUP"] = [];
        } else if (!query["TRANSFORMATIONS"].hasOwnProperty("GROUP")) {
            query["TRANSFORMATIONS"]["GROUP"] = [];
        }
        query["TRANSFORMATIONS"]["APPLY"] = [];
        for (const trans of container.childNodes) {
            let result = {};
            getTransHelper(trans, datasetType, result);
            let temp = {};
            temp[result.term] = {};
            temp[result.term][result.operator] = result.field;
            query["TRANSFORMATIONS"]["APPLY"].push(temp);
        }

    }
}

function getTransHelper(trans, datasetType, obj) {
    let controlTerm = trans.getElementsByClassName("control term")[0];
    let controlOperators = trans.getElementsByClassName("control operators")[0];
    let controlFields = trans.getElementsByClassName("control fields")[0];
    for (const operator of controlOperators.getElementsByTagName("option")) {
        if (operator.hasAttribute("selected")) {
            obj.operator = operator.getAttribute("value");
        }
    }
    for (const field of controlFields.getElementsByTagName("option")) {
        if (field.hasAttribute("selected")) {
            obj.field = datasetType + "_" + field.getAttribute("value");
        }
    }
    if (!controlTerm.getElementsByTagName("input")[0]
        .hasAttribute("value")) {
        obj.term = "";
    } else {
        obj.term = controlTerm.getElementsByTagName("input")[0]
            .getAttribute("value");
    }
}
