export interface Geolocation extends Object {
    lat: number;
    lon: number;
}

export default class HTTPHelper {
    private static serverGeolocation: string =
        "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team029/";

    public static getGeoLocation(info: string[][]): Promise<string[][]> {
        let promises = [];
        let http = require("http");
        for (const building of info) {
            promises.push(this.getGeoLocationPromise(building[2], http));
        }
        return Promise.all(promises);
    }

    private static getGeoLocationPromise(
        address: string,
        http: any,
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
}
