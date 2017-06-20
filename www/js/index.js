$(document).ready(function() {
  var heartbeat_count = getHeartbeatCount();
  $("#rotations-value").html(heartbeat_count);
});

function getHeartbeatCount() {
  $.ajax({
    url: "http://69.145.60.173:3000/heartbeat/today/count",
    type: 'GET',
    dataType: 'json',
    success: function(res) {
      return res[0].count;
    }
  });
}
