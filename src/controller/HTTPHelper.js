"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http = require("http");
const DatasetOperationHTML_1 = require("./DatasetOperationHTML");
class HTTPHelper {
    static getGeoLocation(info) {
        let promises = [];
        for (const building of info) {
            promises.push(this.getGeoLocationPromise(building[2]));
        }
        return Promise.all(promises);
    }
    static getGeoLocationPromise(address) {
        return new Promise((resolve, reject) => {
            address = address.replace(/\s+/g, "%20");
            address = this.serverGeolocation + address;
            http.get(address, (res) => {
                let data = [];
                res.on("data", (chunk) => {
                    data.push(chunk.toString());
                }).on("error", (error) => {
                    data.push(error.message);
                    return resolve(data);
                });
                return resolve(data);
            });
        });
    }
    static parseGeolocations(result) {
        for (const index in DatasetOperationHTML_1.default.allBuildingInfos) {
            let resultEle;
            try {
                resultEle = JSON.parse(result[index].pop());
            }
            catch (e) {
                DatasetOperationHTML_1.default.allBuildingInfos.splice(parseInt(index, 10), 1);
                DatasetOperationHTML_1.default.allBuildingNames.splice(parseInt(index, 10), 1);
                continue;
            }
            if (Object.keys(resultEle).includes("lat")
                && Object.keys(resultEle).includes("lon")) {
                DatasetOperationHTML_1.default.allBuildingInfos[index].push(resultEle.lat);
                DatasetOperationHTML_1.default.allBuildingInfos[index].push(resultEle.lon);
            }
            else {
                DatasetOperationHTML_1.default.allBuildingInfos.splice(parseInt(index, 10), 1);
                DatasetOperationHTML_1.default.allBuildingNames.splice(parseInt(index, 10), 1);
            }
        }
    }
}
exports.default = HTTPHelper;
HTTPHelper.serverGeolocation = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team029/";
//# sourceMappingURL=HTTPHelper.js.map