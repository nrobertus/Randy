/////////////////////////////////
// Variables and options
////////////////////////////////

const WHEEL_DIAMETER_INCHES = 6.5;
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
    console.log("Your browser doesn't support SSE")
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
    if (entry.weekday == weekday) {
      today_rotations = entry.count;
    }
    data.series[0][entry.weekday - 1] = entry.count;
  });

  for (var x = 0; x < start_day_index; x++) { // Reorder the data so it starts with the first day recieved
    data.labels.move(0, data.labels.length);
    data.series[0].move(0, data.series[0].length);
  }

  new Chartist.Line('.ct-chart', data, options); // Make the chart
  $("#average-value").html(rotationsToMiles(getArrayAverage(data.series[0]))); //Update average value
  //$("#rotations-value").html(today_rotations);
  $("#distance-value").html(rotationsToMiles(today_rotations));
  updateRotationsSmooth(today_rotations);
}

function updateRotationsSmooth(rotations){
  var old_value = parseInt($("#rotations-value").html());
  if(old_value == 0){
    $("#rotations-value").html(today_rotations);
  }
  else{
    for(var x = old_value; x< rotations; x++){
      setTimeout(function(){
        $("#rotations-value").html(parseInt($("#rotations-value").html()) + 1)
      },500);
    }
  }
}

function updateHeartbeat(res) {
  var date = new Date(res[0].datetime)
  $("#last-update").html(date);
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
});
