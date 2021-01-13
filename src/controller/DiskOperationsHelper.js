"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Util_1 = require("../Util");
const IInsightFacade_1 = require("./IInsightFacade");
const fs = require("fs-extra");
class DiskOperationsHelper {
    static loadDatasetFromDisk(obj) {
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
        this.loadHelper(obj, datasets, dirPath);
    }
    static loadHelper(obj, datasets, dirPath) {
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
        let promises = [];
        let cacheDir = "./data/";
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir);
        }
        if (Object.keys(obj.ids).length > 0) {
            promises.push(this.writeIDS(obj));
            let contentPromises = this.writeContents(obj);
            for (let value of contentPromises) {
                promises.push(value);
            }
            return Promise.all(promises);
        }
        else {
            return Promise.resolve(1);
        }
    }
    static writeIDS(obj) {
        return fs.promises.writeFile("./data/ids.json", JSON.stringify(obj.ids, null, "\t"), "utf8");
    }
    static writeContents(obj) {
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
                        tempPromisesContent.push(fs.promises.writeFile("./data/" + key + "/" + index + ".json", JSON.stringify(obj.contentParsed[key][index], null, "\t"), "utf8"));
                    }
                }
                else {
                    tempPromisesContent.push(fs.promises.writeFile("./data/" + key + "/" + key + ".json", JSON.stringify(obj.contentParsed[key], null, "\t"), "utf8"));
                }
            }
        })
            .catch((e) => {
            throw e;
        });
        return tempPromisesContent;
    }
    static checkIfDataInDisk(obj, id) {
        let dir = "./data/ids.json";
        let fileRaw;
        try {
            fileRaw = fs.readFileSync(dir);
        }
        catch (e) {
            return false;
        }
        let file = JSON.parse(fileRaw.toString());
        if (typeof file === "undefined") {
            return false;
        }
        else {
            return file.hasOwnProperty(id);
        }
    }
    static cleanCache() {
        let cacheDir = "./data/";
        if (fs.existsSync(cacheDir)) {
            fs.removeSync(cacheDir);
        }
        fs.mkdirSync(cacheDir);
    }
}
exports.default = DiskOperationsHelper;
//# sourceMappingURL=DiskOperationsHelper.js.map