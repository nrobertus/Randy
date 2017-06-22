/////////////////////////////////
// Variables and options
////////////////////////////////

const WHEEL_DIAMETER_INCHES = 6.5;
const UPDATE_INTERVAL = 1000;
const BASE_URL = "http://randythehamster.com:3000/";

var weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

var data = {
  // A labels array that can contain any sort of values
  labels: [],
  // Our series array that contains series objects or in this case series data arrays
  series: [
    []
  ]
};

var options = {
  // Don't draw the line chart points
  showPoint: false,
  // X-Axis specific configuration
  axisX: {
    showGrid: false,
    offset: 60
  },
  // Y-Axis specific configuration
  axisY: {}
};


/////////////////////////////////
// Helper functions
////////////////////////////////

function getData(url, callback) {
  $.ajax({
    url: url,
    type: 'GET',
    dataType: 'json',
    success: function(res) {
      callback(res);
    }
  });
}

function getUpdatedData(interval, url, callback) {
  getData(url, callback);
  setInterval(function() {
    getData(url, callback);
  }, interval);
}


// UI update callback functions

function updateRotations(res) {
  var value = res[0].count;
  var miles = ((((Math.PI * WHEEL_DIAMETER_INCHES) / 12) * value) / 5280) //.toFixed(2); // Convert diameter to circumference, change from inches to feet, multiply by rotations to get total feet, divide by feet in mile.
  $("#rotations-value").html(value);
  $("#distance-value").html(miles);
}

function updateChart(res) {
  data.labels = []; //Clear the previous entries
  data.series[0] = []; // so they can be overwritten
  res.forEach(function(entry) {
    data.labels.push(weekdays[entry.weekday - 1]);
    data.series[0].push(entry.count);
  });
  new Chartist.Line('.ct-chart', data, options);
}
/////////////////////////////////
// Document ready event
////////////////////////////////

$(document).ready(function() { // TODO swap those out
  getUpdatedData(UPDATE_INTERVAL, BASE_URL + "heartbeat/today/count", updateRotations);
  //getUpdatedData(UPDATE_INTERVAL, BASE_URL + "rotations/today/count", updateRotations);
  getUpdatedData(UPDATE_INTERVAL, BASE_URL + 'heartbeat/weekday', updateChart);
  //getUpdatedData(UPDATE_INTERVAL, BASE_URL + 'rotations/weekday', updateChart);
});
