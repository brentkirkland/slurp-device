var Bleacon = require('bleacon');
var fetch = require('node-fetch');

//gotEight helps prevent race condition of sending multiple messages
var gotEight = false;

//should text tells twilio to send message. False is helpful for debug
var shouldText = false;

// uncomment the following line to text not on the hour
Bleacon.startScanning();
setInterval(function() {
  var d = new Date()
  if (d.getMinutes() === 0) {
    console.log("full hour");
    if (d.getHours() === 9 || d.getHours() === 13 || d.getHours() === 17 || d.getHours() === 21) {
      gotEight = false;
      Bleacon.startScanning();
    } else {
      //check something out
    }
  }
}, 60000)


// this will be pulled from server eventually
var waterSettings = {
  overall: {
    watering: false,
    count: 0,
  }
  d50a: {
    watering: false,
    minMoisture: 45,
    maxMoisture: 80,
    off: false,
    time: 30000,
    hexValve:
  },
  d50b: {
    watering: false,
    minMoisture: 45,
    maxMoisture: 80,
    off: false,
    time: 30000
  },
  d50c: {
    watering: false,
    minMoisture: 45,
    maxMoisture: 80,
    off: false,
    time: 30000
  },
  d50e: {
    watering: false,
    minMoisture: 45,
    maxMoisture: 80,
    off: false,
    time: 30000
  },
  d510: {
    watering: false,
    minMoisture: 45,
    maxMoisture: 80,
    off: false,
    time: 30000
  },
  d511: {
    watering: false,
    minMoisture: 45,
    maxMoisture: 80,
    off: false,
    time: 30000
  },
  d512: {
    watering: false,
    minMoisture: 45,
    maxMoisture: 80,
    off: false,
    time: 30000
  },
  d513: {
    watering: false,
    minMoisture: 45,
    maxMoisture: 80,
    off: true,
    time: 30000
  },
}

function checkForWatering (readings) {
  readings.map(function(plant, index) {
    if (waterSettings[plant.major].off || plant.moisture > waterSettings[plant.major].maxMoisture) {
      waterSettings[plant.major].watering = false;
      waterSettings.overall.count -= 1;
      if (waterSettings.overall.count !== 0) {
        waterSettings.overall.count -= 1;
      }
      if (waterSettings.overall.count === 0) {
        waterSettings.overall.watering = false;
      }
      console.log('Not watering: ', plant.major)
    } else if (plant.moisture < waterSettings[plant.major].minMoisture) {
      waterSettings[plant.major].watering = true;
      waterSettings.overall.watering = true;
      waterSettings.overall.count += 1;
      console.log(waterSettings[plant.major].time / 1000, ' seconds of watering for: ', plant.major,)

    }
  })
}


// TODO: Make this one array
var major = [];
var minor = [];
var bleacon_data = [];

Bleacon.on('discover', function(bleacon) {

  var bleaconMajorHex = bleacon.major.toString(16);
  var bleaconMinorHex = bleacon.minor.toString(16);

  if (major.includes(bleaconMajorHex)) {
    if (major.length === 8 && !gotEight) {
      gotEight = true;

      // stop the scanning!
      Bleacon.stopScanning();

      // run through the collected data of all eight devices
      var avgTemp = 0;
      var readings = [];
      for (var i = 0; i < major.length; i++) {
        var temp;
        var moisture;

        // get the correct temperature and moisture
        if (minor[i].length === 4) {
          temp = minor[i][2] + minor[i][3];
          moisture = minor[i][0] + minor[i][1];
        } else {
          temp = minor[i][1] + minor[i][2];
          moisture = minor[i][0];
        }

        // make the US happy
        var fahren = parseInt(temp, 16) * 9 / 5 + 32;
        avgTemp += fahren;

        // Major is reveresed from device, switch it around so it doesn't confuse others
        var switched_major;
        if (major[i].length === 4) {
          switched_major = major[i][2] + major[i][3] + major[i][0] + major[i][1]
        } else if (major[i].length === 3) {
          switched_major = major[i][1] + major[i][2] + '0' + major[i][0]
        }
        var data = {
          minor: minor[i],
          major: switched_major,
          celcius: parseInt(temp, 16),
          fahrenheit: fahren,
          moisture: parseInt(moisture, 16),
          lastWatered: '--',
          watered: false,
          device_nickname: switched_major,
          uuid: bleacon_data[i].uuid,
          measuredPower: bleacon_data[i].measuredPower,
          rssi: bleacon_data[i].rssi,
          accuracy: bleacon_data[i].accuracy,
          proximity: bleacon_data[i].proximity
        }
        readings.push(data)
      }
      var calcAvgTemp = (avgTemp / 8).toFixed(2);

      //TODO: make everything camel case

      var payload = {
        readings: readings,
        avgTemp: calcAvgTemp,
        timestamp: (new Date).getTime(),
        room_id: 'test_garage',
        room_nickname: 'Test Garage',
        user_id: 'test_user',
        shouldText: shouldText
      }
      // push to endpoint
      // publishMessage('slurpBoxMeasures', payload)
      var data = {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }

      console.log(data)

      major = [];
      minor = [];
      bleacon_data = [];

      // TODO: Better error handling
      fetch('https://us-central1-slurp-165217.cloudfunctions.net/pubEndpoint?topic=processMeasures', data)
        .then(res => console.log(res))
      checkForWatering(readings)
    }
  } else {
    major.push(bleaconMajorHex);
    minor.push(bleaconMinorHex);
    bleacon_data.push(bleacon)
  }

});
