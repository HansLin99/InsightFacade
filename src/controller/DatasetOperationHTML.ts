import InsightFacade from "./InsightFacade";
import * as JSZip from "jszip";
import {
    InsightDataset,
    InsightDatasetKind,
    InsightError,
} from "./IInsightFacade";
import DiskOperationsHelper from "./DiskOperationsHelper";
import * as parse5 from "parse5";
import Util from "../Util";
import HTTPHelper, { Geolocation } from "./HTTPHelper";
import HTMLHelper2 from "./HTMLHelper2";

export interface RoomData extends Object {
    rooms_fullname: string; rooms_shortname: string; rooms_number: string; rooms_name: string; rooms_address: string;
    rooms_lat: number; rooms_lon: number; rooms_seats: number; rooms_type: string; rooms_furniture: string;
    rooms_href: string;
}

export default class DatasetOperationHTML {
    public static allBuildingNames: string[];
    public static allBuildingInfos: any[][];
    public static allRoomsInfos: any[][];
    public static allRoomsLinks: string[];

    public static load(
        obj: InsightFacade,
        id: string,
        content: string,
        resolve: (value: any) => any,
        reject: (value: any) => any,
    ): any {
        this.allRoomsInfos = [];
        this.allBuildingNames = [];
        this.allBuildingInfos = [];
        this.allRoomsLinks = [];
        let zip: JSZip = new JSZip();
        zip.loadAsync(content, { base64: true })
            .then((zipFile: JSZip) => {
                return this.loadRooms(zipFile, obj, id);
            })
            .then((zipFile: JSZip) => {
                return this.readAllBuildings(this.allRoomsLinks, zipFile);
            })
            .then((files: string[]) => {
                this.parseHTML(obj, id, files);
                DiskOperationsHelper.saveDatasetToDisk(obj).then((results) => {
                    return resolve(Object.keys(obj.ids));
                });
                // return resolve(Object.keys(obj.ids));
            })
            .catch((error) => {
                return reject(new InsightError(error.message));
            });
    }

    public static loadRooms(zipFile: JSZip, obj: InsightFacade, id: string): Promise<any> {
        const that = this;
        return new Promise<any>(function (resolve, reject) {
            zipFile.file("rooms/index.htm").async("string").then((content) => {
                let html: any = parse5.parse(content);
                let buildingNames: string[] = [];
                let tables: string[] = [];
                let buildingInfo: string[][] = [];
                let links: string[] = [];
                that.getNode(html, tables, "table", {name: "class", value: "views-table cols-5 table"});
                if (tables.length <= 0) {
                    throw new InsightError("No table find");
                }
                for (const table of tables) {
                    try {
                        that.recursiveGetAllBuildingsCode(table, buildingNames);
                        if (buildingNames.length > 0) {
                            that.recursiveGetAllBuildingInfo(table, buildingInfo);
                            that.getLinks(table, links);
                            break;
                        }
                    } catch (e) {
                        Util.trace(e);
                        continue;
                    }
                }
                if (buildingNames.length <= 0) {
                    throw new InsightError("No table find");
                }
                that.allRoomsLinks = [...new Set(links)];
                that.allBuildingNames = buildingNames;
                that.allBuildingInfos = buildingInfo;
                HTTPHelper.getGeoLocation(that.allBuildingInfos).then((result: string[][]) => {
                    HTTPHelper.parseGeolocations(result);
                }).then(() => {
                    return resolve(zipFile);
                });
            }).catch((e) => {
                Util.trace(e);
                return reject(e);
            });
        });
    }

    private static getLinks(inputNode: any, results: string[]) {
        if (inputNode.tagName === "a") {
            for (let atr of inputNode.attrs) {
                if (
                    atr.name === "href"
                ) {
                    results.push(atr.value);
                }
            }
        } else if (Object.keys(inputNode).includes("childNodes")) {
            for (let node of inputNode.childNodes) {
                this.getLinks(node, results);
            }
        }
    }

    private static getNode(inputNode: any, results: string[], tag: string, attribute: any) {
        if (inputNode.tagName === tag) {
            for (let atr of inputNode.attrs) {
                if (
                    atr.name === attribute.name &&
                    atr.value === attribute.value
                ) {
                    results.push(inputNode);
                }
            }
        } else if (Object.keys(inputNode).includes("childNodes")) {
            for (let node of inputNode.childNodes) {
                this.getNode(node, results, tag, attribute);
            }
        }
    }

    private static recursiveGetAllBuildingsCode(
        inputNode: any,
        buildingNames: string[],
    ) {
        if (inputNode.tagName === "td") {
            for (let atr of inputNode.attrs) {
                if (
                    atr.name === "class" &&
                    atr.value === "views-field views-field-field-building-code"
                ) {
                    let buildingName = inputNode.childNodes[0].value.trim();
                    if (!buildingNames.includes(buildingName)) {
                        buildingNames.push(buildingName);
                    }
                }
            }
        } else if (Object.keys(inputNode).includes("childNodes")) {
            for (let node of inputNode.childNodes) {
                this.recursiveGetAllBuildingsCode(node, buildingNames);
            }
        }
    }

    private static recursiveGetAllBuildingInfo(
        inputNode: any,
        buildingInfo: string[][],
    ) {
        if (inputNode.tagName === "tbody") {
            if (Object.keys(inputNode).includes("childNodes")) {
                for (let cn of inputNode.childNodes) {
                    if (cn.tagName === "tr" && Object.keys(cn).includes("childNodes")) {
                        let temp = [];
                        for (let cnn of cn.childNodes) {
                            if (cnn.tagName === "td") {
                                if (this.checkAttributes(cnn, "class",
                                        "views-field views-field-field-building-code")) {
                                    temp.push(cnn.childNodes[0].value.trim());
                                } else if (this.checkAttributes(cnn, "class",
                                        "views-field views-field-title")) {
                                    temp.push(cnn.childNodes[1].childNodes[0].value.trim());
                                } else if (this.checkAttributes(cnn, "class",
                                        "views-field views-field-field-building-address")) {
                                    temp.push(cnn.childNodes[0].value.trim());
                                }
                            }
                        }
                        buildingInfo.push(temp);
                    }
                }
            }
        } else if (Object.keys(inputNode).includes("childNodes")) {
            for (let node of inputNode.childNodes) {
                this.recursiveGetAllBuildingInfo(node, buildingInfo);
            }
        }
    }

    private static constructDataset(obj: InsightFacade, id: string) {
        obj.contentParsed[id] = [];
        if (this.allRoomsInfos.length <= 0) {
            throw new InsightError("No rooms.");
        }
        for (const room of this.allRoomsInfos) {
            if (room.length === 10) {
                obj.contentParsed[id].push(this.initRoomData(room));
            }
        }
    }

    public static checkAttributes(
        node: any,
        cls: string,
        value: string,
    ): boolean {
        for (const atr of node.attrs) {
            if (atr.name === cls && atr.value === value) {
                return true;
            }
        }
        return false;
    }

    // zipFile is the root directory of the zip
    public static readAllBuildings(
        buildings: string[],
        zipFile: JSZip,
    ): any {
        let allContents: Array<Promise<string>> = [];
        for (const building of buildings) {
            let path = "rooms/" + building.split("./")[1];
            allContents.push(
                zipFile
                    .file(path)
                    .async("string"),
            );
        }
        return Promise.all(allContents);
    }

    public static parseHTML(obj: InsightFacade, id: string, Allhtml: string[]) {
        for (let html of Allhtml) {
            let index: number = Allhtml.indexOf(html);
            let building: any = parse5.parse(html);
            let tables: any = [];
            this.getNode(building, tables, "table", {name: "class", value: "views-table cols-5 table"});
            if (tables.length > 0) {
                for (let table of tables) {
                    try {
                        HTMLHelper2.extractAllRoomsDetails(table, index);
                    } catch (e) {
                        Util.trace(e);
                        continue;
                    }
                }
            }
        }
        this.constructDataset(obj, id);
        if (this.allRoomsInfos.length <= 0) {
            throw new InsightError( "No rooms");
        }
        obj.ids[id] = {id: id, kind: InsightDatasetKind.Rooms, numRows: this.allRoomsInfos.length} as InsightDataset;
        return;
    }

    /**
     *    0:shortname: string,
     *    1:fullname: string,
     *    2:address: string,
     *    3:lat: number,
     *    4:lon: number,
     *    5:number: string,
     *    6:capacity: number,
     *    7:furniture: string,
     *    8:type: string
     *    9:href: string,
     * @param info is array of above
     */
    private static initRoomData(info: any[]): RoomData {
        return {rooms_fullname: info[1], rooms_shortname: info[0], rooms_number: info[5],
            rooms_name: info[0] + "_" + info[5], rooms_address: info[2], rooms_lat: info[3],
            rooms_lon: info[4], rooms_seats: info[6], rooms_type: info[8], rooms_furniture: info[7],
            rooms_href: info[9],
        };
    }
}
