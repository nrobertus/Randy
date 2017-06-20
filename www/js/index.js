$(document).ready(function() {
  getHeartbeatCount();
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
  }, 10000);
}

function updateUIElement(id, value) {
  $("#" + id).html(value);
}
