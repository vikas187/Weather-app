const request = require('request');
const geo_access_key = "pk.eyJ1IjoidmlrYXNiaGFuZGFyaTE2MiIsImEiOiJjazk4dnk2N3AwNXp2M2ZxanNsNnNxY284In0.L0VagWdPDA79DMrpFSaRuQ";

const geocode = (address, callback) => {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${address}.json?access_token=${geo_access_key}`;
    request({url, json: true}, (er, {body}) => {
        if(er) {
            callback(er);
        } else if(body.features.length === 0) {
            callback('Unable to find geo codes');
        } else {
            callback(undefined, {
                longitude: body.features[0].center[0], 
                latitude: body.features[0].center[1],
                place_name: body.features[0].text
            });
        }
    })
}

module.exports = geocode;