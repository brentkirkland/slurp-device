var Bleacon = require('bleacon');
var PubSub = require('@google-cloud/pubsub');
var projectId = 'slurp-165217';
var pubsub = PubSub({
  projectId: projectId
});
console.log('done')
// Bleacon.startScanning();
//
// function publishMessage (topicName, data) {
//
//   // References an existing topic, e.g. "my-topic"
//   const topic = pubsub.topic(topicName);
//
//   return topic.publish(data)
//     .then((results) => {
//       const messageIds = results[0];
//       console.log(`Message ${messageIds[0]} published.`);
//       return messageIds;
//     });
// }
//
// var major = [];
// var minor = [];
//
// Bleacon.on('discover', function(bleacon) {
//
//   var bleaconMajorHex = bleacon.major.toString(16);
//   var bleaconMinorHex = bleacon.minor.toString(16);
//
//   if (major.includes(bleaconMajorHex)) {
//     if (major.length === 8) {
//       Bleacon.stopScanning();
//       var avgTemp = 0;
//       var readings = [];
//       for (var i = 0; i < major.length; i++) {
//         var temp;
//         if (minor[i].length === 4) {
//           temp = minor[i][2] + minor[i][3];
//         } else {
//           temp = minor[i][1] + minor[i][2];
//         }
//         var fahren = parseInt(temp, 16) * 9 / 5 + 32;
//         avgTemp += fahren;
//         var moisture = minor[i][0] + minor[i][1];
//
//         var data = {
//           minor: minor[i],
//           major: major[i],
//           celcius: temp,
//           fahrenheit: fahren,
//           moisture: moisture
//         }
//         readings.push(data)
//       }
//       var calcAvgTemp = (avgTemp / 8).toFixed(2);
//
//       var payload = {
//         readings: readings,
//         avgTemp: calcAvgTemp,
//         timestamp: new Date()
//       }
//
//       // publishMessage('slurpBoxMeasures', payload)
//
//     }
//   } else {
//     major.push(bleaconMajorHex);
//     minor.push(bleaconMinorHex);
//   }
//
// });
