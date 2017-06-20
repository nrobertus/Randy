$(document).ready(function() {
  getHeartbeatCount();
  getRotationsCount();
});

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

function updateUIElement(id, value) {
  $("#" + id).html(value);
}
