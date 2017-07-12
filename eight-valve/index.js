var Bleacon = require('bleacon');
var fetch = require('node-fetch');
var i2c = require('i2c');

var address = 0x20;
var wire = new i2c(address, {
  device: '/dev/i2c-1'
});
wire.writeBytes(0x00, [0x00], function(err) {});
//gotEight helps prevent race condition of sending multiple messages
var gotEight = false;

//should text tells twilio to send message. False is helpful for debug
var shouldText = true;

// this will be pulled from server eventually
var waterSettings = {
  overall: {
    watering: true,
    inProgress: ["d50b", "d50e","d510", "d511"]
  },
  d50a: {
    watering: false,
    minMoisture: 50,
    maxMoisture: 70,
    off: true,
    time: 3000,
    valve: "0x08",
    lastWatered: '--'
  },
  d50b: {
    watering: false,
    minMoisture: 50,
    maxMoisture: 70,
    off: false,
    time: 3000,
    valve: "0x40",
    lastWatered: '--'
  },
  d50c: {
    watering: false,
    minMoisture: 50,
    maxMoisture: 70,
    off: false,
    time: 3000,
    valve: "0x01",
    lastWatered: '--'
  },
  d50e: {
    watering: false,
    minMoisture: 50,
    maxMoisture: 70,
    off: false,
    time: 3000,
    valve: "0x10",
    lastWatered: '--'
  },
  d510: {
    watering: false,
    minMoisture: 50,
    maxMoisture: 70,
    off: false,
    time: 3000,
    valve: "0x02",
    lastWatered: '--'
  },
  d511: {
    watering: false,
    minMoisture: 50,
    maxMoisture: 70,
    off: false,
    time: 3000,
    valve: "0x20",
    lastWatered: '--'
  },
  d512: {
    watering: false,
    minMoisture: 50,
    maxMoisture: 70,
    off: false,
    time: 3000,
    valve: "0x04",
    lastWatered: '--'
  },
  d513: {
    watering: false,
    minMoisture: 50,
    maxMoisture: 70,
    off: true,
    time: 3000,
    valve: "0x80",
    lastWatered: '--'
  },
}

// TODO: Make this one array
var major = [];
var minor = [];
var bleacon_data = [];

// uncomment the following line to text not on the hour
Bleacon.startScanning();

setInterval(function() {
  var d = new Date()
  if (d.getMinutes() === 0) {
    console.log("full hour");
    gotEight = false;
    major = [];
    minor = [];
    bleacon_data = [];
    if (waterSettings.overall.watering && d.getHours() > 7 && d.getHours() < 22 && d.getHours() % 2 === 0) {
      Bleacon.startScanning();
    } else {
      //check api eventually
    }
  }
}, 60000)

setInterval(function() {
  var d = new Date()
  if (d.getMinutes() % 10 === 1 && d.getHours() > 8 && d.getHours() < 22 && (d.getHours() % 2 === 0 || waterSettings.overall.watering)) {
    console.log('minute:', d.getMinutes())
    var waittime = 0;
    waterSettings.overall.inProgress.map(function (device, i) {
      setTimeout(function() {
        cycle(waterSettings[device].valve)
      }, waittime);
      console.log('waittime', waittime, i)
      // end watering cycle
      if (i === waterSettings.overall.inProgress.length - 1) {
        console.log('will execute turn off')
        setTimeout(function() {
          console.log(waittime)
          console.log('turning of')
          cycle("0x00")
        }, waittime + waterSettings[device].time);
      }
      waittime += waterSettings[device].time
    })
  }
}, 60000)

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function cycle(valve) {
  console.log('im watering', valve);
  wire.writeBytes(0x09, [parseInt(valve, 16)], function(err) {});
}

function checkForWatering(readings) {
  readings.map(function(plant, index) {
    var inProgressIndex = waterSettings.overall.inProgress.indexOf(plant.major)
    if (waterSettings[plant.major].off || plant.moisture > waterSettings[plant.major].maxMoisture) {
      waterSettings[plant.major].watering = false;
      if (inProgressIndex > -1) {
        waterSettings.overall.inProgress.splice(inProgressIndex, 1)
      }
      if (waterSettings.overall.inProgress.length === 0) {
        waterSettings.overall.watering = false;
      }
      console.log('Not watering: ', plant.major)
    } else if (inProgressIndex > -1 || plant.moisture < waterSettings[plant.major].minMoisture) {
      waterSettings[plant.major].watering = true;
      waterSettings.overall.watering = true;
      console.log(waterSettings[plant.major].time / 1000, ' seconds of watering for: ', plant.major)
      console.log('should water', waterSettings[plant.major].valve)
      if (inProgressIndex === -1) {
        waterSettings.overall.inProgress.push(plant.major)
      }
      readings[index].watered = true;
      var currentWaterTime = (new Date).getTime();
      readings[index].lastWatered = currentWaterTime;
      waterSettings[plant.major].lastWatered = currentWaterTime;
    } else {
      console.log('In cycle down: ', plant.major)
    }
  })

  console.log(waterSettings)

}

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
          lastWatered: waterSettings[switched_major].lastWatered,
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

      checkForWatering(readings)

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

      // TODO: Better error handling
      fetch('https://us-central1-slurp-165217.cloudfunctions.net/pubEndpoint?topic=processMeasures', data)
        .then(res => console.log(res))

    }
  } else {
    major.push(bleaconMajorHex);
    minor.push(bleaconMinorHex);
    bleacon_data.push(bleacon)
  }

});
