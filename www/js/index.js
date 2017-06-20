$(document).ready(function() {
  getHeartbeatCount();
  getRotationsCount();
  getWeekdayHeartbeatData();

});

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
  axisY: {
    showGrid: false,
    showLabel: false,
  }
};

function getHeartbeatCount() {
  setInterval(function() {
    $.ajax({
      url: "http://69.145.60.173:3000/heartbeat/today/count",
      type: 'GET',
      dataType: 'json',
      success: function(res) {
        updateUIElement("rotations-value", res[0].count);
      }
    });
  }, 1000);
}

function getRotationsCount() {
  setInterval(function() {
    $.ajax({
      url: "http://69.145.60.173:3000/rotations/today/count",
      type: 'GET',
      dataType: 'json',
      success: function(res) {
        updateUIElement("distance-value", res[0].count);
      }
    });
  }, 1000);
}

function getWeekdayHeartbeatData() {
  $.ajax({
    url: "http://69.145.60.173:3000/heartbeat/weekday",
    type: 'GET',
    dataType: 'json',
    success: function(res) {
      res.forEach(function(entry) {
        console.log(entry);
        data.series[0][entry.weekday] = entry.count;
      });
      new Chartist.Line('.ct-chart', data, options);
    }
  });
}

function updateUIElement(id, value) {
  $("#" + id).html(value);
}
