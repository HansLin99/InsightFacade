"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const JSZip = require("jszip");
const IInsightFacade_1 = require("./IInsightFacade");
const DiskOperationsHelper_1 = require("./DiskOperationsHelper");
class DatasetOperationJSON {
    static parseJSON(obj, id, allJson) {
        let allRows = 0;
        let atLeastOne = false;
        obj.contentParsed[id] = [];
        for (let json of allJson) {
            let jsonFile;
            try {
                jsonFile = JSON.parse(json);
            }
            catch (e) {
                continue;
            }
            obj.contentParsed[id].push(jsonFile);
            allRows += jsonFile.result.length;
            atLeastOne = true;
        }
        if (!atLeastOne) {
            throw new IInsightFacade_1.InsightError("There's no valid JSON file in the dataset.");
        }
        obj.ids[id] = {
            id: id,
            kind: IInsightFacade_1.InsightDatasetKind.Courses,
            numRows: allRows,
        };
    }
    static load(obj, id, content, resolve, reject) {
        let zip = new JSZip();
        zip.loadAsync(content, { base64: true })
            .then((zipFile) => {
            return this.loadCourses(zipFile);
        })
            .then((files) => {
            DatasetOperationJSON.parseJSON(obj, id, files);
            DiskOperationsHelper_1.default.saveDatasetToDisk(obj).then((results) => {
                return resolve(Object.keys(obj.ids));
            });
        })
            .catch((error) => {
            return reject(new IInsightFacade_1.InsightError(error));
        });
    }
    static loadCourses(zipFile) {
        let allContents = [];
        zipFile.folder("courses").forEach((relativePath, file) => {
            allContents.push(file.async("string"));
        });
        return Promise.all(allContents);
    }
}
exports.default = DatasetOperationJSON;
//# sourceMappingURL=DatasetOperationJSON.js.map