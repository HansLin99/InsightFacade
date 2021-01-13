import * as http from "http";
import DatasetOperationHTML from "./DatasetOperationHTML";

export interface Geolocation extends Object {
    lat: number;
    lon: number;
}

export default class HTTPHelper {
    private static serverGeolocation: string =
        "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team029/";

    public static getGeoLocation(info: string[][]): Promise<string[][]> {
        let promises = [];
        for (const building of info) {
            promises.push(this.getGeoLocationPromise(building[2]));
        }
        return Promise.all(promises);
    }

    private static getGeoLocationPromise(
        address: string,
    ): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            address = address.replace(/\s+/g, "%20");
            address = this.serverGeolocation + address;
            http.get(address, (res: any) => {
                let data: string[] = [];
                res.on("data", (chunk: any) => {
                    data.push(chunk.toString());
                }).on("error", (error: any) => {
                    data.push(error.message);
                    return resolve(data);
                });
                return resolve(data);
            });
        });
    }

    public static parseGeolocations(result: string[][]) {
        for (const index in DatasetOperationHTML.allBuildingInfos) {
            let resultEle: Geolocation;
            try {
                resultEle = JSON.parse(result[index].pop());
            } catch (e) {
                DatasetOperationHTML.allBuildingInfos.splice(parseInt(index, 10), 1);
                DatasetOperationHTML.allBuildingNames.splice(parseInt(index, 10), 1);
                continue;
            }
            if (Object.keys(resultEle).includes("lat")
                && Object.keys(resultEle).includes("lon")) {
                DatasetOperationHTML.allBuildingInfos[index].push(resultEle.lat);
                DatasetOperationHTML.allBuildingInfos[index].push(resultEle.lon);
            } else {
                DatasetOperationHTML.allBuildingInfos.splice(parseInt(index, 10), 1);
                DatasetOperationHTML.allBuildingNames.splice(parseInt(index, 10), 1);
            }
        }

    }
}
