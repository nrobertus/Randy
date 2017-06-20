$(document).ready(function() {
  startSSE();
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

function updateRotationsUI(value) {
  $("#rotations-value").html(value);
}

function startSSE() {
  if (!!window.EventSource) {
    var source = new EventSource('http://69.145.60.173:3000/stream')

    source.addEventListener('message', function(e) {
      console.log(e.data)
    }, false)

    source.addEventListener('open', function(e) {
      console.log("Connection was opened")
    }, false)

    source.addEventListener('error', function(e) {
      if (e.readyState == EventSource.CLOSED) {
        console.log("Connection was closed")
      }
    }, false)
  } else {
    console.log("No SSE supported")
  }
}
