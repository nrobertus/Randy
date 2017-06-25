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
  low: 0,
  showArea: true,
  // X-Axis specific configuration
  axisX: {
    showGrid: false,
  },
};


/////////////////////////////////
// Base functions
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

/////////////////////////////////
// UI update callback functions
////////////////////////////////

function updateRotations(res) {
  $("#rotations-value").html(res[0].count);
  $("#distance-value").html(rotationsToMiles(res[0].count));
}

function updateWeekday(res) {
  var start_day_index = parseInt(res[0].weekday) - 1;

  data.labels = weekdays.slice(0); //Clear the previous entries
  data.series[0] = []; // so they can be overwritten

  for (var x = 1; x < 8; x++) { // Find the missing entries and put zeroes in
    if (!res.find(entry => entry.weekday === x)) {
      res.push({
        "weekday": x,
        "count": 0
      });
    }
  }

  res.forEach(function(entry) { // Insert the data
    data.series[0][entry.weekday - 1] = entry.count;
  });

  for (var x = 0; x < start_day_index; x++) { // Reorder the data so it starts with the first day recieved
    data.labels.move(0, data.labels.length);
    data.series[0].move(0, data.series[0].length);
  }

  new Chartist.Line('.ct-chart', data, options); // Make the chart
  $("#average-value").html(rotationsToMiles(getArrayAverage(data.series[0]))); //Update average value
}

function updateHeartbeat(res){
  var date = new Date(res[0].datetime);
  $("#last-update").html(date);
}

/////////////////////////////////
// Proto and helper functions
////////////////////////////////

Array.prototype.move = function(from, to) {
  this.splice(to, 0, this.splice(from, 1)[0]);
};

function getArrayAverage(array){
  let sum = array.reduce((previous, current) => current += previous);
  let avg = sum / array.length;
  return avg;
}

function rotationsToMiles(rotations){
  return ((((Math.PI * WHEEL_DIAMETER_INCHES) / 12) * rotations) / 5280).toFixed(2);
}

/////////////////////////////////
// Document ready event
////////////////////////////////

$(document).ready(function() { // TODO swap those out
  getUpdatedData(UPDATE_INTERVAL, BASE_URL + "rotations/today/count", updateRotations);
  getUpdatedData(UPDATE_INTERVAL, BASE_URL + 'rotations/weekday', updateWeekday);
  getUpdatedData(UPDATE_INTERVAL, BASE_URL + 'heartbeat/latest', updateHeartbeat);
});
