"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const JSZip = require("jszip");
const IInsightFacade_1 = require("./IInsightFacade");
const DiskOperationsHelper_1 = require("./DiskOperationsHelper");
const parse5 = require("parse5");
const Util_1 = require("../Util");
const HTTPHelper_1 = require("./HTTPHelper");
const HTMLHelper2_1 = require("./HTMLHelper2");
class DatasetOperationHTML {
    static load(obj, id, content, resolve, reject) {
        this.allRoomsInfos = [];
        this.allBuildingNames = [];
        this.allBuildingInfos = [];
        this.allRoomsLinks = [];
        let zip = new JSZip();
        zip.loadAsync(content, { base64: true })
            .then((zipFile) => {
            return this.loadRooms(zipFile, obj, id);
        })
            .then((zipFile) => {
            return this.readAllBuildings(this.allRoomsLinks, zipFile);
        })
            .then((files) => {
            this.parseHTML(obj, id, files);
            DiskOperationsHelper_1.default.saveDatasetToDisk(obj).then((results) => {
                return resolve(Object.keys(obj.ids));
            });
        })
            .catch((error) => {
            return reject(new IInsightFacade_1.InsightError(error.message));
        });
    }
    static loadRooms(zipFile, obj, id) {
        const that = this;
        return new Promise(function (resolve, reject) {
            zipFile.file("rooms/index.htm").async("string").then((content) => {
                let html = parse5.parse(content);
                let buildingNames = [];
                let tables = [];
                let buildingInfo = [];
                let links = [];
                that.getNode(html, tables, "table", { name: "class", value: "views-table cols-5 table" });
                if (tables.length <= 0) {
                    throw new IInsightFacade_1.InsightError("No table find");
                }
                for (const table of tables) {
                    try {
                        that.recursiveGetAllBuildingsCode(table, buildingNames);
                        if (buildingNames.length > 0) {
                            that.recursiveGetAllBuildingInfo(table, buildingInfo);
                            that.getLinks(table, links);
                            break;
                        }
                    }
                    catch (e) {
                        Util_1.default.trace(e);
                        continue;
                    }
                }
                if (buildingNames.length <= 0) {
                    throw new IInsightFacade_1.InsightError("No table find");
                }
                that.allRoomsLinks = [...new Set(links)];
                that.allBuildingNames = buildingNames;
                that.allBuildingInfos = buildingInfo;
                HTTPHelper_1.default.getGeoLocation(that.allBuildingInfos).then((result) => {
                    HTTPHelper_1.default.parseGeolocations(result);
                }).then(() => {
                    return resolve(zipFile);
                });
            }).catch((e) => {
                Util_1.default.trace(e);
                return reject(e);
            });
        });
    }
    static getLinks(inputNode, results) {
        if (inputNode.tagName === "a") {
            for (let atr of inputNode.attrs) {
                if (atr.name === "href") {
                    results.push(atr.value);
                }
            }
        }
        else if (Object.keys(inputNode).includes("childNodes")) {
            for (let node of inputNode.childNodes) {
                this.getLinks(node, results);
            }
        }
    }
    static getNode(inputNode, results, tag, attribute) {
        if (inputNode.tagName === tag) {
            for (let atr of inputNode.attrs) {
                if (atr.name === attribute.name &&
                    atr.value === attribute.value) {
                    results.push(inputNode);
                }
            }
        }
        else if (Object.keys(inputNode).includes("childNodes")) {
            for (let node of inputNode.childNodes) {
                this.getNode(node, results, tag, attribute);
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
        if (this.allRoomsInfos.length <= 0) {
            throw new IInsightFacade_1.InsightError("No rooms.");
        }
        for (const room of this.allRoomsInfos) {
            if (room.length === 10) {
                obj.contentParsed[id].push(this.initRoomData(room));
            }
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
            let path = "rooms/" + building.split("./")[1];
            allContents.push(zipFile
                .file(path)
                .async("string"));
        }
        return Promise.all(allContents);
    }
    static parseHTML(obj, id, Allhtml) {
        for (let html of Allhtml) {
            let index = Allhtml.indexOf(html);
            let building = parse5.parse(html);
            let tables = [];
            this.getNode(building, tables, "table", { name: "class", value: "views-table cols-5 table" });
            if (tables.length > 0) {
                for (let table of tables) {
                    try {
                        HTMLHelper2_1.default.extractAllRoomsDetails(table, index);
                    }
                    catch (e) {
                        Util_1.default.trace(e);
                        continue;
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
    static initRoomData(info) {
        return { rooms_fullname: info[1], rooms_shortname: info[0], rooms_number: info[5],
            rooms_name: info[0] + "_" + info[5], rooms_address: info[2], rooms_lat: info[3],
            rooms_lon: info[4], rooms_seats: info[6], rooms_type: info[8], rooms_furniture: info[7],
            rooms_href: info[9],
        };
    }
}
exports.default = DatasetOperationHTML;
//# sourceMappingURL=DatasetOperationHTML.js.map