import InsightFacade from "./InsightFacade";
import * as JSZip from "jszip";
import {
    InsightDataset,
    InsightDatasetKind,
    InsightError,
} from "./IInsightFacade";
import DiskOperationsHelper from "./DiskOperationsHelper";
import * as parse5 from "parse5";
import DatasetOperationHTML, { RoomData } from "./DatasetOperationHTML";

export default class DatasetOperationJSON {
    // public static checkCoursesFolder(zipFile: JSZip): boolean {
    //     return zipFile.folder(/courses/).length === 1;
    // }
    //
    // public static checkRoomsFolder(zipFile: JSZip): boolean {
    //     // Might be something wrong here, may be length === 1
    //     return zipFile.folder(/rooms/).length === 1;
    // }

    public static parseJSON(obj: InsightFacade, id: string, allJson: string[]) {
        let allRows: number = 0;
        let atLeastOne: boolean = false;
        obj.contentParsed[id] = [];
        for (let json of allJson) {
            let jsonFile;
            try {
                jsonFile = JSON.parse(json);
            } catch (e) {
                continue;
            }
            obj.contentParsed[id].push(jsonFile);
            allRows += jsonFile.result.length;
            atLeastOne = true;
        }
        if (!atLeastOne) {
            throw new InsightError(
                "There's no valid JSON file in the dataset.",
            );
        }
        obj.ids[id] = {
            id: id,
            kind: InsightDatasetKind.Courses,
            numRows: allRows,
        } as InsightDataset;
    }

    public static load(
        obj: InsightFacade,
        id: string,
        content: string,
        resolve: (value: any) => any,
        reject: (value: any) => any,
    ): any {
        let zip: JSZip = new JSZip();
        zip.loadAsync(content, { base64: true })
            .then((zipFile: JSZip) => {
                return this.loadCourses(zipFile);
            })
            .then((files: string[]) => {
                DatasetOperationJSON.parseJSON(obj, id, files);
                DiskOperationsHelper.saveDatasetToDisk(obj).then((results) => {
                    return resolve(Object.keys(obj.ids));
                });
            })
            .catch((error) => {
                return reject(new InsightError(error));
            });
    }

    private static loadCourses(zipFile: JSZip): Promise<string[]> {
        let allContents: Array<Promise<string>> = [];

        // if (!DatasetOperationJSON.checkCoursesFolder(zipFile)) {
        //     throw new InsightError(
        //         "No courses folder or more than 1 courses folder",
        //     );
        // }
        // let allCourses = zipFile.folder(/courses/);
        zipFile.folder("courses").forEach((relativePath: any, file: any) => {
            allContents.push(file.async("string"));
        });
        return Promise.all(allContents);
    }
}
