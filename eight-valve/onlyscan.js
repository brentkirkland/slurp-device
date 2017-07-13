var Bleacon = require('bleacon');

// TODO: Make this one array
var major = [];
var minor = [];
var bleacon_data = [];
var gotEight = false;
// uncomment the following line to text not on the hour
Bleacon.startScanning();

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
        console.log(data)
        readings.push(data)
      }

      var calcAvgTemp = (avgTemp / 8).toFixed(2);

      //TODO: make everything camel case

      console.log(calcAvgTemp);
      gotEight = false;

    }
  } else {
    major.push(bleaconMajorHex);
    minor.push(bleaconMinorHex);
    bleacon_data.push(bleacon)
  }

});
