"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const JSZip = require("jszip");
const IInsightFacade_1 = require("./IInsightFacade");
const DiskOperationsHelper_1 = require("./DiskOperationsHelper");
const parse5 = require("parse5");
const Util_1 = require("../Util");
const HTTPHelper_1 = require("./HTTPHelper");
class DatasetOperationHTML {
    static load(obj, id, content, resolve, reject) {
        this.allRoomsInfos = [];
        this.allBuildingNames = [];
        this.allBuildingInfos = [];
        let zip = new JSZip();
        zip.loadAsync(content, { base64: true })
            .then((zipFile) => {
            return this.loadRooms(zipFile, obj, id);
        })
            .then((zipFile) => {
            return this.readAllBuildings(this.allBuildingNames, zipFile);
        })
            .then((files) => {
            this.parseHTML(obj, id, files);
            DiskOperationsHelper_1.default.saveDatasetToDisk(obj).then(() => {
                return resolve(Object.keys(obj.ids));
            });
        })
            .catch((error) => {
            return reject(new IInsightFacade_1.InsightError(error));
        });
    }
    static loadRooms(zipFile, obj, id) {
        return new Promise((resolve, reject) => {
            zipFile.file("rooms/index.htm").async("string").then((content) => {
                let html = parse5.parse(content);
                let buildingNames = [];
                let tables = [];
                this.getTable(html, tables);
                this.recursiveGetAllBuildingsCode(tables[0], buildingNames);
                this.allBuildingNames = buildingNames;
                let buildingInfo = [];
                this.recursiveGetAllBuildingInfo(tables[0], buildingInfo);
                this.allBuildingInfos = buildingInfo;
                HTTPHelper_1.default.getGeoLocation(this.allBuildingInfos).then((result) => {
                    for (const index in this.allBuildingInfos) {
                        let resultEle;
                        try {
                            resultEle = JSON.parse(result[index].pop());
                        }
                        catch (e) {
                            this.allBuildingInfos.splice(parseInt(index, 10), 1);
                            this.allBuildingNames.splice(parseInt(index, 10), 1);
                            continue;
                        }
                        if (Object.keys(resultEle).includes("lat")
                            && Object.keys(resultEle).includes("lon")) {
                            this.allBuildingInfos[index].push(resultEle.lat);
                            this.allBuildingInfos[index].push(resultEle.lon);
                        }
                        else {
                            this.allBuildingInfos.splice(parseInt(index, 10), 1);
                            this.allBuildingNames.splice(parseInt(index, 10), 1);
                        }
                    }
                }).then(() => {
                    return resolve(zipFile);
                });
            }).catch((e) => {
                Util_1.default.trace(e);
                return reject(e);
            });
        });
    }
    static getTable(inputNode, results) {
        if (inputNode.tagName === "table") {
            for (let atr of inputNode.attrs) {
                if (atr.name === "class" &&
                    atr.value === "views-table cols-5 table") {
                    results.push(inputNode);
                }
            }
        }
        else if (Object.keys(inputNode).includes("childNodes")) {
            for (let node of inputNode.childNodes) {
                this.getTable(node, results);
            }
        }
    }
    static recursiveGetAllBuildingsCode(inputNode, buildingNames) {
        if (inputNode.tagName === "td") {
            for (let atr of inputNode.attrs) {
                if (atr.name === "class" &&
                    atr.value === "views-field views-field-field-building-code") {
                    let buildingName = inputNode.childNodes[0].value.trim();
                    if (!buildingNames.includes(buildingName)) {
                        buildingNames.push(buildingName);
                    }
                }
            }
        }
        else if (Object.keys(inputNode).includes("childNodes")) {
            for (let node of inputNode.childNodes) {
                this.recursiveGetAllBuildingsCode(node, buildingNames);
            }
        }
    }
    static recursiveGetAllBuildingInfo(inputNode, buildingInfo) {
        if (inputNode.tagName === "tbody") {
            if (Object.keys(inputNode).includes("childNodes")) {
                for (let cn of inputNode.childNodes) {
                    if (cn.tagName === "tr" && Object.keys(cn).includes("childNodes")) {
                        let temp = [];
                        for (let cnn of cn.childNodes) {
                            if (cnn.tagName === "td") {
                                if (this.checkAttributes(cnn, "class", "views-field views-field-field-building-code")) {
                                    temp.push(cnn.childNodes[0].value.trim());
                                }
                                else if (this.checkAttributes(cnn, "class", "views-field views-field-title")) {
                                    temp.push(cnn.childNodes[1].childNodes[0].value.trim());
                                }
                                else if (this.checkAttributes(cnn, "class", "views-field views-field-field-building-address")) {
                                    temp.push(cnn.childNodes[0].value.trim());
                                }
                            }
                        }
                        buildingInfo.push(temp);
                    }
                }
            }
        }
        else if (Object.keys(inputNode).includes("childNodes")) {
            for (let node of inputNode.childNodes) {
                this.recursiveGetAllBuildingInfo(node, buildingInfo);
            }
        }
    }
    static constructDataset(obj, id) {
        obj.contentParsed[id] = [];
        for (const room of this.allRoomsInfos) {
            obj.contentParsed[id].push(this.initRoomData(room));
        }
    }
    static checkAttributes(node, cls, value) {
        for (const atr of node.attrs) {
            if (atr.name === cls && atr.value === value) {
                return true;
            }
        }
        return false;
    }
    static readAllBuildings(buildings, zipFile) {
        let allContents = [];
        for (const building of buildings) {
            allContents.push(zipFile
                .folder("rooms/campus/discover/buildings-and-classrooms/")
                .file(building)
                .async("string"));
        }
        return Promise.all(allContents);
    }
    static parseHTML(obj, id, Allhtml) {
        for (let html of Allhtml) {
            let index = Allhtml.indexOf(html);
            let building = parse5.parse(html);
            let tables = [];
            this.getTable(building, tables);
            if (tables.length > 0) {
                for (let table of tables) {
                    try {
                        this.extractAllRoomsDetails(table, index);
                    }
                    catch (e) {
                        Util_1.default.trace(e);
                    }
                }
            }
        }
        this.constructDataset(obj, id);
        if (this.allRoomsInfos.length <= 0) {
            throw new IInsightFacade_1.InsightError("No rooms");
        }
        obj.ids[id] = { id: id, kind: IInsightFacade_1.InsightDatasetKind.Rooms, numRows: this.allRoomsInfos.length };
        return;
    }
    static extractAllRoomsDetails(inputNode, index) {
        if (inputNode.tagName === "tbody") {
            if (Object.keys(inputNode).includes("childNodes")) {
                for (let cn of inputNode.childNodes) {
                    if (cn.tagName === "tr" && Object.keys(cn).includes("childNodes")) {
                        let template = [...this.allBuildingInfos[index]];
                        for (let cnn of cn.childNodes) {
                            if (cnn.tagName === "td" && Object.keys(cnn).includes("childNodes")) {
                                if (this.checkAttributes(cnn, "class", "views-field views-field-field-room-number")) {
                                    template.push(cnn.childNodes[1].childNodes[0].value.trim());
                                }
                                else if (this.checkAttributes(cnn, "class", "views-field views-field-field-room-capacity")) {
                                    template.push(parseInt(cnn.childNodes[0].value.trim(), 10));
                                }
                                else if (this.checkAttributes(cnn, "class", "views-field views-field-field-room-furniture")) {
                                    template.push(cnn.childNodes[0].value.trim());
                                }
                                else if (this.checkAttributes(cnn, "class", "views-field views-field-field-room-type")) {
                                    template.push(cnn.childNodes[0].value.trim());
                                }
                                else if (this.checkAttributes(cnn, "class", "views-field views-field-nothing")) {
                                    template.push(cnn.childNodes[1].attrs[0].value.trim());
                                }
                            }
                        }
                        this.allRoomsInfos.push(template);
                    }
                }
            }
        }
        else if (Object.keys(inputNode).includes("childNodes")) {
            for (let node of inputNode.childNodes) {
                this.extractAllRoomsDetails(node, index);
            }
        }
    }
    static initRoomData(info) {
        return { rooms_fullname: info[1], rooms_shortname: info[0], rooms_number: info[5],
            rooms_name: info[0] + "_" + info[5], rooms_address: info[2], rooms_lat: info[3],
            rooms_lon: info[4], rooms_seats: info[6], rooms_type: info[8], rooms_furniture: info[7],
            rooms_href: info[9],
        };
    }
}
exports.default = DatasetOperationHTML;
DatasetOperationHTML.allBuildingNames = [];
DatasetOperationHTML.allBuildingInfos = [];
DatasetOperationHTML.allRoomsInfos = [];
//# sourceMappingURL=DatasetOperationHTML.js.map