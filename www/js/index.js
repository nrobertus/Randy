$(document).ready(function() {
  getHeartbeatCount();
});

function getHeartbeatCount() {
  $.ajax({
    url: "http://69.145.60.173:3000/heartbeat/count",
    type: 'GET',
    success: function(res) {
      alert(res.count);
    }
  });
}
