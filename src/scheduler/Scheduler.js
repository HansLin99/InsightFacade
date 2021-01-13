"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Scheduler {
    constructor() {
        this.times = [
            "MWF 0800-0900", "MWF 0900-1000", "MWF 1000-1100",
            "MWF 1100-1200", "MWF 1200-1300", "MWF 1300-1400",
            "MWF 1400-1500", "MWF 1500-1600", "MWF 1600-1700",
            "TR  0800-0930", "TR  0930-1100", "TR  1100-1230",
            "TR  1230-1400", "TR  1400-1530", "TR  1530-1700"
        ];
    }
    schedule(sections, rooms) {
        let secOrdered = this.secSort(sections);
        let roomsOrdered = this.roomSort(rooms);
        this.roomAvailability = {};
        this.roomSceduled = [];
        this.courseAvailability = {};
        let toltalEnrolment = sections.map((s) => this.sectionSize(s)).reduce((acc, curr) => acc + curr);
        let bestSol = [];
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
            let roomsCanFit = this.getFitRooms(section, roomsOrdered);
            if (roomsCanFit.length < 1) {
                continue;
            }
            let room = this.findminDist(roomsCanFit);
            this.roomSceduled.push(room);
            let roomName = room.rooms_shortname + "_" + room.rooms_number;
            let time;
            time = this.roomAvailability[roomName].pop();
            if (this.roomAvailability[roomName].length === 0) {
                roomsOrdered.splice(roomsOrdered.indexOf(room), 1);
            }
            this.courseAvailability[section.courses_dept + section.courses_id].splice(this.courseAvailability[section.courses_dept + section.courses_id].indexOf(time), 1);
            bestSol.push([room, section, time]);
        }
        return bestSol;
    }
    findminDist(rooms) {
        if (this.roomSceduled.length < 1) {
            return rooms[0];
        }
        let minDist = Infinity;
        let minDistRoom;
        for (const room of rooms) {
            let maxDist = -1;
            for (const roomSchedule of this.roomSceduled) {
                let dist = this.haversineDist({ lat: room.rooms_lat, lon: room.rooms_lon }, { lat: roomSchedule.rooms_lat, lon: roomSchedule.rooms_lon });
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
    secSort(sections) {
        let ret = [...sections];
        if (sections.length <= 1) {
            return ret;
        }
        return ret.sort((a, b) => {
            return (b.courses_pass + b.courses_fail + b.courses_audit)
                - (a.courses_fail + a.courses_pass + a.courses_audit);
        });
    }
    roomSort(rooms) {
        let ret = [...rooms];
        if (rooms.length <= 1) {
            return ret;
        }
        return ret.sort((a, b) => {
            return b.rooms_seats - a.rooms_seats;
        });
    }
    haversineDist(geo1, geo2) {
        let R = 6371e3;
        let phi1 = geo1.lat * Math.PI / 180;
        let phi2 = geo2.lat * Math.PI / 180;
        let deltaphi = (geo2.lat - geo1.lat) * Math.PI / 180;
        let deltalambda = (geo2.lon - geo1.lon) * Math.PI / 180;
        let a = Math.sin(deltaphi / 2) * Math.sin(deltaphi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
                Math.sin(deltalambda / 2) * Math.sin(deltalambda / 2);
        let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return (R * c) / 1372;
    }
    enrolmentScore(sol, total) {
        let enrol = sol.map((s) => this.sectionSize(s[1])).reduce((acc, curr) => acc + curr);
        return enrol / total;
    }
    sectionSize(section) {
        let sec = section;
        return sec.courses_audit + sec.courses_fail + sec.courses_pass;
    }
    getFitRooms(section, roomsOrdered) {
        let ret = [];
        for (const room of roomsOrdered) {
            let roomTimeSlot = this.roomAvailability[room.rooms_shortname + "_" + room.rooms_number];
            let courseTimeSlot = this.courseAvailability[section.courses_dept + section.courses_id];
            let ifConflict = roomTimeSlot.some((e) => courseTimeSlot.includes(e));
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
exports.default = Scheduler;
//# sourceMappingURL=Scheduler.js.map