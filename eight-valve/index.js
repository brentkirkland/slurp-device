var Bleacon = require('bleacon');
var fetch = require('node-fetch');

Bleacon.startScanning();

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
        if (minor[i].length === 4) {
          temp = minor[i][2] + minor[i][3];
        } else {
          temp = minor[i][1] + minor[i][2];
        }
        var fahren = parseInt(temp, 16) * 9 / 5 + 32;
        avgTemp += fahren;
        var moisture = minor[i][0] + minor[i][1];

        var data = {
          minor: minor[i],
          major: major[i],
          celcius: parseInt(temp, 16),
          fahrenheit: fahren,
          moisture: parseInt(moisture, 16)
        }
        readings.push(data)
      }
      var calcAvgTemp = (avgTemp / 8).toFixed(2);

      var payload = {
        readings: readings,
        avgTemp: calcAvgTemp,
        timestamp: new Date()
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
  }

});
