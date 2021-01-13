/**
 * Receives a query object as parameter and sends it as Ajax request to the POST /query REST endpoint.
 *
 * @param query The query object
 * @returns {Promise} Promise that must be fulfilled if the Ajax request is successful and be rejected otherwise.
 */
CampusExplorer.sendQuery = (query) => {
    return new Promise((resolve, reject) => {
        try {
            let xml = new XMLHttpRequest();
            xml.open("POST", "/query", true);
            xml.setRequestHeader("Content-Type", "application/json");
            xml.onload = function() {
                if (this.status === 200) {
                    let response = JSON.parse(xml.responseText);
                    console.log(response);
                    return resolve(response);
                } else if (this.status === 400) {
                    let response = JSON.parse(xml.responseText);
                    return reject(response);
                }
            };
            xml.send(JSON.stringify(query));
        } catch (e) {
            console.log(e);
        }

    });
};
