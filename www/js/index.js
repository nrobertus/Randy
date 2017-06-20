/////////////////////////////////
// Variables and options
////////////////////////////////

var update_interval = 1000;

var data = {
  // A labels array that can contain any sort of values
  labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  // Our series array that contains series objects or in this case series data arrays
  series: [
    [0, 0, 0, 0, 0, 0, 0]
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


function getHeartbeatCount() {
  $.ajax({
    url: "http://69.145.60.173:3000/heartbeat/today/count",
    type: 'GET',
    dataType: 'json',
    success: function(res) {
      updateUIElement("rotations-value", res[0].count);
    }
  });
}

function getUpdatedHeartbeatCount(interval) {
  getHeartbeatCount();
  setInterval(function() {
    getHeartbeatCount();
  }, interval);
}

function getRotationsCount() {
  $.ajax({
    url: "http://69.145.60.173:3000/rotations/today/count",
    type: 'GET',
    dataType: 'json',
    success: function(res) {
      updateUIElement("distance-value", res[0].count);
    }
  });
}

function getUpdatedRotationsCount(interval) {
  getRotationsCount();
  setInterval(function() {
    getRotationsCount();
  }, interval)
}

function getWeekdayHeartbeatData() {
  $.ajax({
    url: "http://69.145.60.173:3000/heartbeat/weekday",
    type: 'GET',
    dataType: 'json',
    success: function(res) {
      res.forEach(function(entry) {
        data.series[0][entry.weekday - 1] = entry.count;
      });
      new Chartist.Line('.ct-chart', data, options);
    }
  });
}

function getUpdatedWeekdayHeartbeatData(interval) {
  getWeekdayHeartbeatData();
  setInterval(function() {
    getWeekdayHeartbeatData();
  }, interval);
}

function updateUIElement(id, value) {
  $("#" + id).html(value);
}

/////////////////////////////////
// Document ready event
////////////////////////////////
$(document).ready(function() {
  getUpdatedHeartbeatCount(update_interval);
  getUpdatedRotationsCount(update_interval);
  getUpdatedWeekdayHeartbeatData(update_interval);
});
