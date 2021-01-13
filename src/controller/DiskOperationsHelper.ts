import InsightFacade from "./InsightFacade";
import Util from "../Util";
import { InsightDatasetKind } from "./IInsightFacade";
import * as fs from "fs-extra";

export default class DiskOperationsHelper {
    // This helper methods loads the dataset from disks
    public static loadDatasetFromDisk(obj: InsightFacade) {
        let dirPath = "./data/";
        let ids: Buffer;
        let datasets: string[];
        try {
            datasets = fs.readdirSync(dirPath);
        } catch (e) {
            return;
        }
        datasets.splice(datasets.indexOf("ids.json"), 1);
        ids = fs.readFileSync(dirPath + "ids.json");
        obj.ids = JSON.parse(ids.toString());
        this.loadHelper(obj, datasets, dirPath);
    }

    private static loadHelper(
        obj: InsightFacade,
        datasets: string[],
        dirPath: string,
    ) {
        for (const key in datasets) {
            if (obj.ids[datasets[key]].kind === InsightDatasetKind.Courses) {
                let filePath = dirPath + datasets[key];
                let courses;
                try {
                    courses = fs.readdirSync(filePath);
                } catch (e) {
                    return;
                }
                // let promisesContent: Array<Promise<any>> = [];
                // for (const id in courses) {
                //     if (promisesContent.length < 5) {
                //         promisesContent.push(fs.promises.readFile(filePath + "/" + courses[id]));
                //     } else {
                //         this.executePromise(Promise.all(promisesContent), obj, datasets[key]);
                //         promisesContent = [];
                //     }
                // }
                // if (promisesContent.length !== 0) {
                //     this.executePromise(Promise.all(promisesContent), obj, datasets[key]);
                // }
                // TODO: ----------------------sync version---------------------------
                obj.contentParsed[datasets[key]] = [];
                for (const id in courses) {
                    let jsonString;
                    try {
                        jsonString = fs
                            .readFileSync(filePath + "/" + courses[id])
                            .toString();
                    } catch (e) {
                        return;
                    }
                    let json;
                    try {
                        json = JSON.parse(jsonString);
                    } catch (e) {
                        Util.trace(jsonString);
                        return;
                    }
                    obj.contentParsed[datasets[key]].push(json);
                }
            } else {
                let filePath = dirPath + datasets[key] + "/" + datasets[key];
                let rooms;
                try {
                    rooms = fs.readFileSync(filePath).toString();
                } catch (e) {
                    return;
                }
                let json;
                try {
                    json = JSON.parse(rooms);
                } catch (e) {
                    Util.trace(rooms);
                    return;
                }
                obj.contentParsed[datasets[key]] = json;
            }
        }
    }

    // This helper methods write current ids and contents to local disk
    public static saveDatasetToDisk(obj: InsightFacade): Promise<any> {
        let promises: Array<Promise<any>> = [];
        let cacheDir = "./data/";
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir);
        }
        if (Object.keys(obj.ids).length > 0) {
            promises.push(this.writeIDS(obj));
            let contentPromises: Array<Promise<any>> = this.writeContents(obj);
            for (let value of contentPromises) {
                promises.push(value);
            }
            return Promise.all(promises);
        } else {
            return Promise.resolve(1);
        }


    }

    private static writeIDS(obj: InsightFacade): Promise<any> {
        return fs.promises.writeFile(
            "./data/ids.json",
            JSON.stringify(obj.ids, null, "\t"),
            "utf8",
        );
    }

    private static writeContents(
        obj: InsightFacade,
    ): Array<Promise<any>> {
        let keys = Object.keys(obj.ids);
        let tempPromisesDir: Array<Promise<any>> = [];
        for (const key of keys) {
            tempPromisesDir.push(
                fs.promises.mkdir("./data/" + key, { recursive: true }),
            );
        }
        let tempPromisesContent: Array<Promise<any>> = [];
        Promise.all(tempPromisesDir)
            .then(() => {
                for (const key of keys) {
                    if (obj.ids[key].kind === InsightDatasetKind.Courses) {
                        for (const index in obj.contentParsed[key]) {
                            tempPromisesContent.push(
                                fs.promises.writeFile(
                                    "./data/" + key + "/" + index + ".json",
                                    JSON.stringify(
                                        obj.contentParsed[key][index],
                                        null,
                                        "\t",
                                    ),
                                    "utf8",
                                ),
                            );
                        }
                    } else {
                        tempPromisesContent.push(
                            fs.promises.writeFile(
                                "./data/" + key + "/" + key + ".json",
                                JSON.stringify(
                                    obj.contentParsed[key],
                                    null,
                                    "\t",
                                ),
                                "utf8",
                            ),
                        );
                    }
                }
            })
            .catch((e) => {
                throw e;
            });
        return tempPromisesContent;
    }

    public static checkIfDataInDisk(obj: InsightFacade, id: string): boolean {
        let dir = "./data/ids.json";
        let fileRaw;
        try {
            fileRaw = fs.readFileSync(dir);
        } catch (e) {
            return false;
        }
        let file = JSON.parse(fileRaw.toString());
        if (typeof file === "undefined") {
            return false;
        } else {
            return file.hasOwnProperty(id);
        }
    }

    public static cleanCache() {
        let cacheDir = "./data/";
        if (fs.existsSync(cacheDir)) {
            fs.removeSync(cacheDir);
        }
        fs.mkdirSync(cacheDir);
    }
}
