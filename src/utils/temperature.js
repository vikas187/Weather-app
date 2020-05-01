
const request = require('request');
const access_key = "fd6b5bbc27516194e0876888fb33d6c2";

const temperature = (address, callback) => {
    const url = `http://api.weatherstack.com/current?access_key=${access_key}&query=${address}&units=m`;
    request({url, json: true}, (error, {body})=>{
        if(error) {
            callback('Unable to contact temperature service');
        } else if(body.error) {
            callback('Unable to find location, Please try different one');
        } else {
            callback(undefined, `Temperature is ${body.current.temperature} degrees and it feels like ${body.current.feelslike} degrees out there`);
        }
    });
}

module.exports = temperature;