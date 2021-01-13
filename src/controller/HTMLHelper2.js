"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DatasetOperationHTML_1 = require("./DatasetOperationHTML");
class HTMLHelper2 {
    static extractAllRoomsDetails(inputNode, index) {
        if (inputNode.tagName === "tbody") {
            if (Object.keys(inputNode).includes("childNodes")) {
                for (let cn of inputNode.childNodes) {
                    if (cn.tagName === "tr" && Object.keys(cn).includes("childNodes")) {
                        let template = [...DatasetOperationHTML_1.default.allBuildingInfos[index]];
                        for (let cnn of cn.childNodes) {
                            if (cnn.tagName === "td" && Object.keys(cnn).includes("childNodes")) {
                                if (DatasetOperationHTML_1.default.checkAttributes(cnn, "class", "views-field views-field-field-room-number")) {
                                    template.push(cnn.childNodes[1].childNodes[0].value.trim());
                                }
                                else if (DatasetOperationHTML_1.default.checkAttributes(cnn, "class", "views-field views-field-field-room-capacity")) {
                                    template.push(parseInt(cnn.childNodes[0].value.trim(), 10));
                                }
                                else if (DatasetOperationHTML_1.default.checkAttributes(cnn, "class", "views-field views-field-field-room-furniture")) {
                                    template.push(cnn.childNodes[0].value.trim());
                                }
                                else if (DatasetOperationHTML_1.default.checkAttributes(cnn, "class", "views-field views-field-field-room-type")) {
                                    template.push(cnn.childNodes[0].value.trim());
                                }
                                else if (DatasetOperationHTML_1.default.checkAttributes(cnn, "class", "views-field views-field-nothing")) {
                                    template.push(cnn.childNodes[1].attrs[0].value.trim());
                                }
                            }
                        }
                        DatasetOperationHTML_1.default.allRoomsInfos.push(template);
                    }
                }
            }
        }
        else if (Object.keys(inputNode).includes("childNodes")) {
            for (let node of inputNode.childNodes) {
                this.extractAllRoomsDetails(node, index);
            }
        }
    }
}
exports.default = HTMLHelper2;
//# sourceMappingURL=HTMLHelper2.js.map