var Bleacon = require('bleacon');
var fetch = require('node-fetch');

var shouldText = true;
// Bleacon.startScanning();
setInterval(function() {
  var d = new Date()
  if (d.getMinutes() === 10 || d.getMinutes() === 14 || d.getMinutes() === 18) {
    // console.log("full hour");
    // if (d.getHours() > 22 || d.getHours() < 10) {
    //   shouldText = false;
    // } else {
    //   if (d.getHours() % 2 === 0) {
    //     shouldText = true;
    //   } else {
    //     shouldText = false;
    //   }
    //
    //   console.log('shouldtext', shouldText)
    // }
    // shouldText = true;
    console.log('hour', d.getHours())
    Bleacon.startScanning();
  }
}, 60000)

var major = [];
var minor = [];

Bleacon.on('discover', function(bleacon) {

  var bleaconMajorHex = bleacon.major.toString(16);
  var bleaconMinorHex = bleacon.minor.toString(16);

  if (major.includes(bleaconMajorHex)) {
    if (major.length === 8) {
      Bleacon.stopScanning();
      var avgTemp = 0;
      var readings = [];
      for (var i = 0; i < major.length; i++) {
        var temp;
        var moisture;
        if (minor[i].length === 4) {
          temp = minor[i][2] + minor[i][3];
          moisture = minor[i][0] + minor[i][1];
        } else {
          temp = minor[i][1] + minor[i][2];
          moisture = minor[i][0];
        }
        var fahren = parseInt(temp, 16) * 9 / 5 + 32;
        avgTemp += fahren;


        var data = {
          minor: minor[i],
          major: major[i],
          celcius: parseInt(temp, 16),
          fahrenheit: fahren,
          moisture: parseInt(moisture, 16),
          lastWatered: '--',
          watered: false,
          device_nickname: major[i]
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

      // TODO: Better error handling
      fetch('https://us-central1-slurp-165217.cloudfunctions.net/pubEndpoint?topic=processMeasures', data)
        .then(res => console.log(res))
    }
  } else {
    major.push(bleaconMajorHex);
    minor.push(bleaconMinorHex);
  }

});
