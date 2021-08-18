const express = require('express')
const bodyParser = require('body-parser')
const {WebhookClient} = require('dialogflow-fulfillment');
const FEED_URL = 'https://www.ndbc.noaa.gov/data/latest_obs/46248.rss';
const DATA_TXT = 'https://www.ndbc.noaa.gov/data/latest_obs/latest_obs.txt'
var fetchUrl = require("fetch").fetchUrl;
const app = express();
app.use(bodyParser.json())
const port = process.env.PORT || 3000

var seaside_data;
var kiwanda_data;
var pipeline_data;
var orford_data;
var nor_cal_data;
var wa_data;

var seaside_weather_report;
var pipeline_weather_report;
var kiwanda_weather_report;
var orford_weather_report;
var wa_weather_report;
var nor_cal_weather_report;

const seaside_weather_url = 'https://api.openweathermap.org/data/2.5/weather?q=Seaside,US-OR&appid=08a3eef5a760269c1005985126793ea0';
const pipeline_weather_url = 'https://api.openweathermap.org/data/2.5/weather?q=Pupukea,US-HI&appid=08a3eef5a760269c1005985126793ea0';
const kiwanda_weather_url = 'https://api.openweathermap.org/data/2.5/weather?q=Pacific City,US-OR&appid=08a3eef5a760269c1005985126793ea0';
const orford_weather_url = 'https://api.openweathermap.org/data/2.5/weather?q=Port Orford,US-OR&appid=08a3eef5a760269c1005985126793ea0';
const wa_weather_url = 'https://api.openweathermap.org/data/2.5/weather?q=Westport,US-WA&appid=08a3eef5a760269c1005985126793ea0';
const nor_cal_weather_url = 'https://api.openweathermap.org/data/2.5/weather?q=Eureka,US-CA&appid=08a3eef5a760269c1005985126793ea0';

app.post('/dialogflow-fulfillment', (request, response) => {
    dialogflowFulfillment(request, response)
})

app.post('/', (request, response) => {
    dialogflowFulfillment(request, response)
})

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})

// request(DATA_TXT, function (error, response, body) {
//     console.log('body:', body); // Print the HTML for the Google homepage.
// });

// this function retrieves the latest global buoy observations 
fetchUrl(DATA_TXT, function(error, meta, body){
    var report = body.toString().split("\n");
    for (var i = 0; i < report.length; i++)
    {
        var line = report[i];
        {
            // seaside buoy
            if (line.indexOf("46248") != -1) 
            {
                seaside_data = line.split(' ');
                seaside_data = seaside_data.filter(e =>  e);
            }
            // pipeline buoy
            else if (line.indexOf("51201") != -1) 
            {
                pipeline_data = line.split(' ');
                pipeline_data = pipeline_data.filter(e =>  e);
            }
            // central oregon buoy
            else if (line.indexOf("46229") != -1) 
            {
                kiwanda_data = line.split(' ');
                kiwanda_data = kiwanda_data.filter(e =>  e);
            }
            // southern washington buoy
            else if (line.indexOf("46211") != -1) 
            {
                orford_data = line.split(' ');
                orford_data = orford_data.filter(e =>  e);
            }
            // northern california
            else if (line.indexOf("46213") != -1) 
            {
                nor_cal_data = line.split(' ');
                nor_cal_data = nor_cal_data.filter(e =>  e);
            }
            // southern washington
            else if (line.indexOf("46243") != -1) 
            {
                wa_data = line.split(' ');
                wa_data = wa_data.filter(e =>  e);
            }
        }
    }
});


// fetch weather reports from beaches (dialogflow timeout limit forces precaching these)
var weather_url = seaside_weather_url;
fetchUrl(weather_url, function(error, meta, body){
    seaside_weather_report = JSON.parse(body);
});
var weather_url = pipeline_weather_url;
fetchUrl(weather_url, function(error, meta, body){
    pipeline_weather_report = JSON.parse(body);
});
var weather_url = orford_weather_url;
fetchUrl(weather_url, function(error, meta, body){
    orford_weather_report = JSON.parse(body);
});
var weather_url = kiwanda_weather_url;
fetchUrl(weather_url, function(error, meta, body){
    kiwanda_weather_report = JSON.parse(body);
});
var weather_url = wa_weather_url;
fetchUrl(weather_url, function(error, meta, body){
    wa_weather_report = JSON.parse(body);
});
var weather_url = nor_cal_weather_url;
fetchUrl(weather_url, function(error, meta, body){
    nor_cal_weather_report = JSON.parse(body);
});

const dialogflowFulfillment = (request, response) => {
    const agent = new WebhookClient({request, response})
    var surf_data;

    function sayHello(agent){
        agent.add("Hey! Welcome to Surf Fiend, your surf report assistant");
    }

    function surf_report(agent) {
        switch(agent.parameters.surf_spot) {
            case 'seaside':
                surf_data = seaside_data;
                break;
            case 'pipeline':
                surf_data = pipeline_data;
                break;
            case 'cape kiwanda':
                surf_data = kiwanda_data;
                break;
            case 'southern oregon':
                surf_data = orford_data;
                break;
            case 'westport':
                surf_data = wa_data;
                break;
            case 'northern california':
                surf_data = nor_cal_data;
                break;
        }

        var hour;
        var raw_hour = surf_data[6];
        if (raw_hour > 6) {
            hour = raw_hour - 7;
        }
        else {
            hour = 24 - 7;
        }
        agent.add('primary swell is ' + surf_data[11] + ' feet at ' + surf_data[12] + ' seconds with a swell angle of ' + surf_data[14] + ' degrees.');
        agent.add('the current water temperature is ' + (surf_data[18] * 1.8 + 32));
        agent.add(' as of ' + hour + ':' + surf_data[7] + ' PST on ' + surf_data[4] + '/' + surf_data[5]);
    }

    function weather_report(agent) {
        var weather_report;
        switch(agent.parameters.surf_spot) {
            case 'seaside':
                weather_report = seaside_weather_report;
                break;
            case 'pipeline':
                weather_report = pipeline_weather_report;
                break;
            case 'cape kiwanda':
                weather_report = kiwanda_weather_report;
                break;
            case 'southern oregon':
                weather_report = orford_weather_report;
                break;
            case 'westport':
                weather_report = wa_weather_report;
                break;
            case 'northern california':
                weather_report = nor_cal_weather_report;
                break;
        }

        agent.add('Weather for ' + agent.parameters.surf_spot + ' area, ' + weather_report.weather[0].description + ' with a temperature of ' + parseInt((weather_report.main.temp - 273) * 1.8 + 32)
                    + ' with a ' + parseInt(weather_report.wind.speed) + ' mph wind at an angle of ' + weather_report.wind.deg + ' degrees.');
    }

    let intentMap = new Map();
    intentMap.set("Default Welcome Intent", sayHello)
    intentMap.set("surf_report", surf_report)
    intentMap.set("weather_report", weather_report)
    agent.handleRequest(intentMap)
}