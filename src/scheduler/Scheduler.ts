import {IScheduler, SchedRoom, SchedSection, TimeSlot} from "./IScheduler";
import Util from "../Util";

export default class Scheduler implements IScheduler {

    private times: TimeSlot[] = [
        "MWF 0800-0900" , "MWF 0900-1000" , "MWF 1000-1100" ,
        "MWF 1100-1200" , "MWF 1200-1300" , "MWF 1300-1400" ,
        "MWF 1400-1500" , "MWF 1500-1600" , "MWF 1600-1700" ,
        "TR  0800-0930" , "TR  0930-1100" , "TR  1100-1230" ,
        "TR  1230-1400" , "TR  1400-1530" , "TR  1530-1700"
    ];

    private roomSceduled: SchedRoom[];
    private roomAvailability: {[key: string]: TimeSlot[]};
    private courseAvailability: {[key: string]: TimeSlot[]};

    public schedule(sections: SchedSection[], rooms: SchedRoom[]): Array<[SchedRoom, SchedSection, TimeSlot]> {
        let secOrdered: SchedSection[] = this.secSort(sections);
        let roomsOrdered: SchedRoom[] = this.roomSort(rooms);
        this.roomAvailability = {};
        this.roomSceduled = [];
        this.courseAvailability = {};
        let toltalEnrolment: number =
            sections.map((s) => this.sectionSize(s)).reduce((acc, curr) => acc + curr);
        let bestSol: Array<[SchedRoom, SchedSection, TimeSlot]> = [];

        for (const room of rooms) {
            this.roomAvailability[room.rooms_shortname + "_" + room.rooms_number] = [...this.times];
        }

        for (const sec of sections) {
            let courseName = sec.courses_dept + sec.courses_id;
            if (this.courseAvailability.hasOwnProperty(courseName)) {
                continue;
            }
            this.courseAvailability[courseName] = [...this.times];
        }

        for (const section of secOrdered) {
            // Rooms are descending order
            let roomsCanFit = this.getFitRooms(section, roomsOrdered);
            if (roomsCanFit.length < 1) {
                continue;
            }
            // if (this.roomSceduled.length < 1) {
            //     let room = roomsCanFit[0];
            //     let time: TimeSlot = this.scheduletime(room);
            //     this.roomSceduled.push(room);
            //     bestSol.push([room, section, time]);
            // } else {
            //     // Choose timeslot under the same room
            //     for (const room of roomsCanFit) {
            //         if (!this.checkAvailablity())
            //         let result = this.findminDist(room);
            //         let time = this.scheduletime(result);
            //         this.roomSceduled.push(room);
            //         bestSol.push([result, section, time])
            //     }
            // }
            // TODO: Should find the minDist room that still has available timeslot
            let room: SchedRoom = this.findminDist(roomsCanFit);
            // IF all the size-fitted room has no timeslot, don't schedule this section
            this.roomSceduled.push(room);
            let roomName = room.rooms_shortname + "_" + room.rooms_number;
            let time: TimeSlot;
            time = this.roomAvailability[roomName].pop();
            if (this.roomAvailability[roomName].length === 0) {
                roomsOrdered.splice(roomsOrdered.indexOf(room), 1);
            }
            this.courseAvailability[section.courses_dept + section.courses_id].splice(
                this.courseAvailability[section.courses_dept + section.courses_id].indexOf(time), 1
            );
            bestSol.push([room, section, time]);
        }
        return bestSol;
    }

    private findminDist(rooms: SchedRoom[]): any {
        if (this.roomSceduled.length < 1) {
            return rooms[0];
        }
        let minDist = Infinity;
        let minDistRoom: SchedRoom;
        for (const room of rooms) {
            let maxDist = -1;
            for (const roomSchedule of this.roomSceduled) {
                let dist: number = this.haversineDist({lat: room.rooms_lat, lon: room.rooms_lon},
                    {lat: roomSchedule.rooms_lat, lon: roomSchedule.rooms_lon});
                if (dist > maxDist) {
                    maxDist = dist;
                }
            }
            if (maxDist < minDist) {
                minDist = maxDist;
                minDistRoom = room;
            }
        }
        return minDistRoom;
    }

    // descending sort sec size
    private secSort(sections: SchedSection[]): SchedSection[] {
        let ret: SchedSection[] = [...sections];
        if (sections.length <= 1) {
            return ret;
        }
        return ret.sort((a, b): number => {
            return (b.courses_pass + b.courses_fail + b.courses_audit)
                - (a.courses_fail + a.courses_pass + a.courses_audit);
        });
    }

    private roomSort(rooms: SchedRoom[]): SchedRoom[] {
        let ret: SchedRoom[] = [...rooms];
        if (rooms.length <= 1) {
            return ret;
        }
        return ret.sort((a, b): number => {
            return b.rooms_seats - a.rooms_seats;
        });
    }

    // reference: https://www.movable-type.co.uk/scripts/latlong.html
    private haversineDist(geo1: any, geo2: any): number {
        let R = 6371e3; // metres
        let phi1 = geo1.lat * Math.PI / 180; // φ, λ in radians
        let phi2 = geo2.lat * Math.PI / 180;
        let deltaphi = (geo2.lat - geo1.lat) * Math.PI / 180;
        let deltalambda = (geo2.lon - geo1.lon) * Math.PI / 180;

        let a = Math.sin(deltaphi / 2) * Math.sin(deltaphi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltalambda / 2) * Math.sin(deltalambda / 2);
        let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return (R * c) / 1372;
    }

    private enrolmentScore(sol: Array<[SchedRoom, SchedSection, TimeSlot]>, total: number): number {
        let enrol = sol.map((s) => this.sectionSize(s[1])).reduce((acc, curr) => acc + curr);
        return enrol / total;
    }

    // private distanceScore(sol: Array<[SchedRoom, SchedSection, TimeSlot]>): number {
    //     let allRooms: any[] = sol.map((s) => {
    //         lat: s[0].rooms_lat; lon: s[0].rooms_lon
    //     });
    //     let minDist = Infinity;
    //     if (allRooms.length === 0) {
    //         return minDist;
    //     } else if (allRooms.length === 1) {
    //         return 0;
    //     } else if (allRooms.length > 1) {
    //         for (let i=0; i<allRooms.length;i++) {
    //             for (let j = i + 1; j< allRooms.length; j++) {
    //                 let dist = this.haversineDist(allRooms[i], allRooms[j]);
    //                 if (dist < minDist) {
    //                     minDist = dist;
    //                 }
    //             }
    //         }
    //         return minDist;
    //     }
    // }

    private sectionSize(section: SchedSection): number {
        let sec = section;
        return sec.courses_audit + sec.courses_fail + sec.courses_pass;
    }

    private getFitRooms(section: SchedSection, roomsOrdered: SchedRoom[]) {
        let ret = [];
        for (const room of roomsOrdered) {
            let roomTimeSlot = this.roomAvailability[room.rooms_shortname + "_" + room.rooms_number];
            let courseTimeSlot = this.courseAvailability[section.courses_dept + section.courses_id];
            let ifConflict: boolean = roomTimeSlot.some((e) => courseTimeSlot.includes(e));
            if (!ifConflict) {
                continue;
            }
            if (room.rooms_seats >= this.sectionSize(section)) {
                ret.push(room);
            }
        }
        return ret;
    }


}
