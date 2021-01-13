"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Util_1 = require("../Util");
const IInsightFacade_1 = require("./IInsightFacade");
class DiskOperationsHelper {
    static loadDatasetFromDisk(obj) {
        let fs = require("fs");
        let dirPath = "./data/";
        let ids;
        let datasets;
        try {
            datasets = fs.readdirSync(dirPath);
        }
        catch (e) {
            return;
        }
        datasets.splice(datasets.indexOf("ids.json"), 1);
        ids = fs.readFileSync(dirPath + "ids.json");
        obj.ids = JSON.parse(ids.toString());
        this.loadHelper(obj, datasets, dirPath, fs);
    }
    static loadHelper(obj, datasets, dirPath, fs) {
        for (const key in datasets) {
            if (obj.ids[datasets[key]].kind === IInsightFacade_1.InsightDatasetKind.Courses) {
                let filePath = dirPath + datasets[key];
                let courses;
                try {
                    courses = fs.readdirSync(filePath);
                }
                catch (e) {
                    return;
                }
                obj.contentParsed[datasets[key]] = [];
                for (const id in courses) {
                    let jsonString;
                    try {
                        jsonString = fs
                            .readFileSync(filePath + "/" + courses[id])
                            .toString();
                    }
                    catch (e) {
                        return;
                    }
                    let json;
                    try {
                        json = JSON.parse(jsonString);
                    }
                    catch (e) {
                        Util_1.default.trace(jsonString);
                        return;
                    }
                    obj.contentParsed[datasets[key]].push(json);
                }
            }
            else {
                let filePath = dirPath + datasets[key] + "/" + datasets[key];
                let rooms;
                try {
                    rooms = fs.readFileSync(filePath).toString();
                }
                catch (e) {
                    return;
                }
                let json;
                try {
                    json = JSON.parse(rooms);
                }
                catch (e) {
                    Util_1.default.trace(rooms);
                    return;
                }
                obj.contentParsed[datasets[key]] = json;
            }
        }
    }
    static saveDatasetToDisk(obj) {
        let fs = require("fs");
        let promises = [];
        promises.push(this.writeIDS(fs, obj));
        let contentPromises = this.writeContents(fs, obj);
        for (let value of contentPromises) {
            promises.push(value);
        }
        return Promise.all(promises);
    }
    static writeIDS(fs, obj) {
        return fs.promises.writeFile("./data/ids.json", JSON.stringify(obj.ids, null, "\t"));
    }
    static writeContents(fs, obj) {
        let keys = Object.keys(obj.ids);
        let tempPromisesDir = [];
        for (const key of keys) {
            tempPromisesDir.push(fs.promises.mkdir("./data/" + key, { recursive: true }));
        }
        let tempPromisesContent = [];
        Promise.all(tempPromisesDir)
            .then(() => {
            for (const key of keys) {
                if (obj.ids[key].kind === IInsightFacade_1.InsightDatasetKind.Courses) {
                    for (const index in obj.contentParsed[key]) {
                        tempPromisesContent.push(fs.promises.writeFile("./data/" + key + "/" + index + ".json", JSON.stringify(obj.contentParsed[key][index], null, "\t"), { recursive: true }));
                    }
                }
                else {
                    tempPromisesContent.push(fs.promises.writeFile("./data/" + key + "/" + key + ".json", JSON.stringify(obj.contentParsed[key], null, "\t"), { recursive: true }));
                }
            }
        })
            .catch((e) => {
            throw e;
        });
        return tempPromisesContent;
    }
    static executePromise(promise, obj, id) {
        promise
            .then((result) => {
            for (const value of result) {
                if (typeof value === "string") {
                    obj.contentParsed[id].push(JSON.parse(value));
                }
                else {
                    obj.contentParsed[id].push(JSON.parse(value.toString()));
                }
            }
        })
            .catch((e) => {
            throw e;
        });
    }
    static checkIfDataInDisk(obj, id) {
        let fs = require("fs");
        let dir = "./data/ids.json";
        let fileRaw;
        try {
            fileRaw = fs.readFileSync(dir);
        }
        catch (e) {
            return false;
        }
        let file = JSON.parse(fileRaw.toString());
        return file.hasOwnProperty(id);
    }
}
exports.default = DiskOperationsHelper;
//# sourceMappingURL=DiskOperationsHelper.js.map