"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class HTTPHelper {
    static getGeoLocation(info) {
        let promises = [];
        let http = require("http");
        for (const building of info) {
            promises.push(this.getGeoLocationPromise(building[2], http));
        }
        return Promise.all(promises);
    }
    static getGeoLocationPromise(address, http) {
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
}
exports.default = HTTPHelper;
HTTPHelper.serverGeolocation = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team029/";
//# sourceMappingURL=HTTPHelper.js.map