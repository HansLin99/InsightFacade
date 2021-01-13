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

export interface RoomData extends Object {
    rooms_fullname: string; rooms_shortname: string; rooms_number: string; rooms_name: string; rooms_address: string;
    rooms_lat: number; rooms_lon: number; rooms_seats: number; rooms_type: string; rooms_furniture: string;
    rooms_href: string;
}

export default class DatasetOperationHTML {
    public static allBuildingNames: string[] = [];
    public static allBuildingInfos: any[][] = [];
    private static allRoomsInfos: any[][] = [];

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
        let zip: JSZip = new JSZip();
        zip.loadAsync(content, { base64: true })
            .then((zipFile: JSZip) => {
                return this.loadRooms(zipFile, obj, id);
            })
            .then((zipFile: JSZip) => {
                return this.readAllBuildings(this.allBuildingNames, zipFile);
            })
            .then((files: string[]) => {
                this.parseHTML(obj, id, files);
                DiskOperationsHelper.saveDatasetToDisk(obj).then(() => {
                    return resolve(Object.keys(obj.ids));
                });
                // return resolve(Object.keys(obj.ids));
            })
            .catch((error) => {
                return reject(new InsightError(error));
            });
    }

    public static loadRooms(zipFile: JSZip, obj: InsightFacade, id: string): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            zipFile.file("rooms/index.htm").async("string").then((content) => {
                let html: any = parse5.parse(content);
                let buildingNames: string[] = [];
                let tables: string[] = [];
                this.getTable(html, tables);
                // TODO: Table[0] here might be some problems
                this.recursiveGetAllBuildingsCode(tables[0], buildingNames);
                this.allBuildingNames = buildingNames;
                let buildingInfo: string[][] = [];
                this.recursiveGetAllBuildingInfo(tables[0], buildingInfo);
                this.allBuildingInfos = buildingInfo;
                HTTPHelper.getGeoLocation(this.allBuildingInfos).then((result: string[][]) => {
                    for (const index in this.allBuildingInfos) {
                        let resultEle: Geolocation;
                        try {
                            resultEle = JSON.parse(result[index].pop());
                        } catch (e) {
                            this.allBuildingInfos.splice(parseInt(index, 10), 1);
                            this.allBuildingNames.splice(parseInt(index, 10), 1);
                            continue;
                        }
                        if (Object.keys(resultEle).includes("lat")
                            && Object.keys(resultEle).includes("lon")) {
                            this.allBuildingInfos[index].push(resultEle.lat);
                            this.allBuildingInfos[index].push(resultEle.lon);
                        } else {
                            this.allBuildingInfos.splice(parseInt(index, 10), 1);
                            this.allBuildingNames.splice(parseInt(index, 10), 1);
                        }
                    }
                    // return resolve(zipFile);
                }).then(() => {
                    return resolve(zipFile);
                });
            }).catch((e) => {
                Util.trace(e);
                return reject(e);
            });
        });
    }

    private static getTable(inputNode: any, results: string[]) {
        if (inputNode.tagName === "table") {
            for (let atr of inputNode.attrs) {
                if (
                    atr.name === "class" &&
                    atr.value === "views-table cols-5 table"
                ) {
                    results.push(inputNode);
                }
            }
        } else if (Object.keys(inputNode).includes("childNodes")) {
            for (let node of inputNode.childNodes) {
                this.getTable(node, results);
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
        // Util.trace(this.allRoomsInfos.length);
        for (const room of this.allRoomsInfos) {
            obj.contentParsed[id].push(this.initRoomData(room));
        }
        // Util.trace(obj.contentParsed[id].length);
    }

    private static checkAttributes(
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
            allContents.push(
                zipFile
                    .folder("rooms/campus/discover/buildings-and-classrooms/")
                    .file(building)
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
            this.getTable(building, tables);
            if (tables.length > 0) {
                for (let table of tables) {
                    try {
                        this.extractAllRoomsDetails(table, index);
                    } catch (e) {
                        Util.trace(e);
                    }
                }
            }
        }
        this.constructDataset(obj, id);
        if (this.allRoomsInfos.length <= 0) {
            throw new InsightError("No rooms");
        }
        obj.ids[id] = {id: id, kind: InsightDatasetKind.Rooms, numRows: this.allRoomsInfos.length} as InsightDataset;
        return;
    }

    public static extractAllRoomsDetails(inputNode: any, index: number) {
        if (inputNode.tagName === "tbody") {
            if (Object.keys(inputNode).includes("childNodes")) {
                for (let cn of inputNode.childNodes) {
                    if (cn.tagName === "tr" && Object.keys(cn).includes("childNodes")) {
                        let template: any[] = [...this.allBuildingInfos[index]];
                        for (let cnn of cn.childNodes) {
                            if (cnn.tagName === "td" && Object.keys(cnn).includes("childNodes")) {
                                if (this.checkAttributes(cnn, "class",
                                        "views-field views-field-field-room-number")) {
                                    template.push(cnn.childNodes[1].childNodes[0].value.trim());
                                } else if (this.checkAttributes(cnn, "class",
                                        "views-field views-field-field-room-capacity")) {
                                    template.push(parseInt(cnn.childNodes[0].value.trim(), 10));
                                } else if (this.checkAttributes(cnn, "class",
                                        "views-field views-field-field-room-furniture")) {
                                    template.push(cnn.childNodes[0].value.trim());
                                } else if (this.checkAttributes(cnn, "class",
                                        "views-field views-field-field-room-type")) {
                                    template.push(cnn.childNodes[0].value.trim());
                                } else if (this.checkAttributes(cnn, "class",
                                        "views-field views-field-nothing")) {
                                    template.push(cnn.childNodes[1].attrs[0].value.trim());
                                }
                            }
                        }
                        this.allRoomsInfos.push(template);
                    }
                }
            }
        } else if (Object.keys(inputNode).includes("childNodes")) {
            for (let node of inputNode.childNodes) {
                this.extractAllRoomsDetails(node, index);
            }
        }
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
