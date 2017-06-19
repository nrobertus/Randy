$(document).ready(function() {
  getHeartbeatCount();
});

function getHeartbeatCount() {
  $.ajax({
    url: "http://69.145.60.173:3000/heartbeat/today/count",
    type: 'GET',
    dataType: 'json',
    success: function(res) {
      alert(res[0].count);
    }
  });
}
