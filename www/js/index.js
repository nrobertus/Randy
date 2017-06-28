/////////////////////////////////
// Variables and options
////////////////////////////////

const WHEEL_DIAMETER_INCHES = 6.5;
const BASE_URL = "http://randythehamster.com:3000/";

var weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

var rotations_data = {
  labels: [],
  series: [
    []
  ]
};

var miles_data = {
  labels: [],
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


function sseSubscribe(url, callback) {

  if (!!window.EventSource) {

    var source = new EventSource(url);
    source.addEventListener('message', function(e) {
      callback(JSON.parse(e.data));
    }, false)

    source.addEventListener('open', function(e) {
      console.log('connected')
    }, false)

    source.addEventListener('error', function(e) {
      if (e.target.readyState == EventSource.CLOSED) {
        console.log('disconnected')
      } else if (e.target.readyState == EventSource.CONNECTING) {
        console.log('connecting')
      }
    }, false)
  } else {
    console.log("Your browser doesn't support SSE");
    $.ajax({
      url: url + "/static",
      type: "GET",
      success: function(res) {
        callback(res);
      }
    });
  }
}

/////////////////////////////////
// UI update callback functions
////////////////////////////////

function updateRotations(res) {
  var start_day_index = parseInt(res[0].weekday) - 1;
  var today = new Date();
  var weekday = today.getDay() + 1; // Javascript zero-bases weekday numbers. MySQL does not. Woo hoo.
  var today_rotations = 0;

  rotations_data.labels = weekdays.slice(0); //Clear the previous entries
  rotations_data.series[0] = []; // so they can be overwritten

  miles_data.labels = weekdays.slice(0); //Clear the previous entries
  miles_data.series[0] = []; // so they can be overwritten

  for (var x = 1; x < 8; x++) { // Find the missing entries and put zeroes in
    if (!res.find(entry => entry.weekday === x)) {
      res.push({
        "weekday": x,
        "count": 0
      });
    }
  }

  res.forEach(function(entry) { // Insert the data
    if (entry.weekday == weekday) {
      today_rotations = entry.count;
    }
    rotations_data.series[0][entry.weekday - 1] = entry.count;
    miles_data.series[0][entry.weekday - 1] = rotationsToMiles(entry.count);
  });

  for (var x = 0; x < start_day_index; x++) { // Reorder the data so it starts with the first day recieved
    rotations_data.labels.move(0, rotations_data.labels.length);
    rotations_data.series[0].move(0, rotations_data.series[0].length);
    miles_data.labels.move(0, miles_data.labels.length);
    miles_data.series[0].move(0, miles_data.series[0].length);
  }

  console.log(rotations_data);
  console.log(miles_data);
  new Chartist.Line('#rotations-chart', rotations_data, options); // Make the chart
  new Chartist.Line('#miles-chart', miles_data, options); // Make the chart

  $("#average-miles").html(rotationsToMiles(getArrayAverage(rotations_data.series[0]))); //Update average value
  $("#average-rotations").html(getArrayAverage(rotations_data.series[0])); //Update average value

  $("#rotations-value").html(today_rotations);
  $("#distance-value").html(rotationsToMiles(today_rotations));
}

function updateHeartbeat(res) {
  var date = new Date(res[0].datetime)
  var update_time = months[date.getMonth()] + " " + date.getDate() + " - " + date.getHours() + ":" + date.getMinutes();
  $("#last-update").html(update_time);
}

/////////////////////////////////
// Proto and helper functions
////////////////////////////////

Array.prototype.move = function(from, to) {
  this.splice(to, 0, this.splice(from, 1)[0]);
};

function getArrayAverage(array) {
  let sum = array.reduce((previous, current) => current += previous);
  let avg = sum / array.length;
  return avg;
}

function rotationsToMiles(rotations) {
  return ((((Math.PI * WHEEL_DIAMETER_INCHES) / 12) * rotations) / 5280).toFixed(2);
}

/////////////////////////////////
// Document ready event
////////////////////////////////

$(document).ready(function() { // TODO swap those out
  sseSubscribe(BASE_URL + 'rotations/weekday', updateRotations);
  sseSubscribe(BASE_URL + 'heartbeat/latest', updateHeartbeat);
  window.odometerOptions = {
    duration: 6000 // Change how long the javascript expects the CSS animation to take
  };
});
