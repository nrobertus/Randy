$(document).ready(function() {
  getHeartbeatCount();
});

function getHeartbeatCount() {
  $.ajax({
    url: "http://69.145.60.173:3000/heartbeat/today/count",
    type: 'GET',
    dataType: 'json',
    success: function(res) {
      updateRotationsUI(res[0].count);
    }
  });
}

function updateRotationsUI(value){
  $("#rotations-value").html(value);
}
