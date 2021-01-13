import DatasetOperationHTML from "./DatasetOperationHTML";

export default class HTMLHelper2 {
    public static extractAllRoomsDetails(inputNode: any, index: number) {
        if (inputNode.tagName === "tbody") {
            if (Object.keys(inputNode).includes("childNodes")) {
                for (let cn of inputNode.childNodes) {
                    if (cn.tagName === "tr" && Object.keys(cn).includes("childNodes")) {
                        let template: any[] = [...DatasetOperationHTML.allBuildingInfos[index]];
                        for (let cnn of cn.childNodes) {
                            if (cnn.tagName === "td" && Object.keys(cnn).includes("childNodes")) {
                                if (DatasetOperationHTML.checkAttributes(cnn, "class",
                                    "views-field views-field-field-room-number")) {
                                    template.push(cnn.childNodes[1].childNodes[0].value.trim());
                                } else if (DatasetOperationHTML.checkAttributes(cnn, "class",
                                    "views-field views-field-field-room-capacity")) {
                                    template.push(parseInt(cnn.childNodes[0].value.trim(), 10));
                                } else if (DatasetOperationHTML.checkAttributes(cnn, "class",
                                    "views-field views-field-field-room-furniture")) {
                                    template.push(cnn.childNodes[0].value.trim());
                                } else if (DatasetOperationHTML.checkAttributes(cnn, "class",
                                    "views-field views-field-field-room-type")) {
                                    template.push(cnn.childNodes[0].value.trim());
                                } else if (DatasetOperationHTML.checkAttributes(cnn, "class",
                                    "views-field views-field-nothing")) {
                                    template.push(cnn.childNodes[1].attrs[0].value.trim());
                                }
                            }
                        }
                        DatasetOperationHTML.allRoomsInfos.push(template);
                    }
                }
            }
        } else if (Object.keys(inputNode).includes("childNodes")) {
            for (let node of inputNode.childNodes) {
                this.extractAllRoomsDetails(node, index);
            }
        }
    }
}
