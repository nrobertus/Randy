/////////////////////////////////
// Variables and options
////////////////////////////////

const WHEEL_DIAMETER_INCHES = 6.5;
const BASE_URL = "http://randythehamster.com:3000/";

var allowedKeys = {
  67: 'c',
  79: 'o',
  77: 'm',
  65: 'a',
  78: 'n',
  68: 'd',
  27: 'esc',
  13: 'enter',
  8: 'backspace',
  38: 'up',
  40: 'down',
  37: 'left'
};

var konamiCode = ['c', 'o', 'm', 'm', 'a', 'n', 'd'];

var weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
var commands = [];
var commandIndex = 0;

var rotations_data = {
  labels: [],
  series: [
    []
  ]
};

var miles_data = {
  labels: [],
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
    showLoading(true);
    var source = new EventSource(url);
    source.addEventListener('message', function(e) {
      callback(JSON.parse(e.data));
    }, false)

    source.addEventListener('open', function(e) {
      showLoading(false);
    }, false)

    source.addEventListener('error', function(e) {
      if (e.target.readyState == EventSource.CLOSED) {
        console.log('disconnected')
        showLoading(false);
      } else if (e.target.readyState == EventSource.CONNECTING) {
        console.log('connecting')
      }
    }, false)
  } else {
    console.log("Your browser doesn't support SSE");
    $.ajax({
      url: url + "/static",
      type: "GET",
      success: function(res) {
        showLoading(false);
        callback(res);
      }
    });
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

  rotations_data.labels = weekdays.slice(0); //Clear the previous entries
  rotations_data.series[0] = []; // so they can be overwritten

  miles_data.labels = weekdays.slice(0); //Clear the previous entries
  miles_data.series[0] = []; // so they can be overwritten

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
    rotations_data.series[0][entry.weekday - 1] = entry.count;
    miles_data.series[0][entry.weekday - 1] = rotationsToMiles(entry.count);
  });

  for (var x = 0; x < start_day_index; x++) { // Reorder the data so it starts with the first day recieved
    rotations_data.labels.move(0, rotations_data.labels.length);
    rotations_data.series[0].move(0, rotations_data.series[0].length);
    miles_data.labels.move(0, miles_data.labels.length);
    miles_data.series[0].move(0, miles_data.series[0].length);
  }

  new Chartist.Line('#rotations-chart', rotations_data, options); // Make the chart
  new Chartist.Line('#miles-chart', miles_data, options); // Make the chart
  $("#average-miles").html(rotationsToMiles(getArrayAverage(rotations_data.series[0]))); //Update average value
  $("#average-rotations").html(getArrayAverage(rotations_data.series[0]).toFixed(0)); //Update average value

  rotations_data.series[0].forEach(function(entry, i) {
    var index = i + 1;
    $("#date-" + index).html(rotations_data.labels[i]);
    $("#rotations-" + index).html(entry);
    $("#distance-" + index).html(rotationsToMiles(entry));
  });
}

function updateHeartbeat(res) {
  var date = new Date(res[0].datetime)
  var hours = date.getHours();
  var ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  var minutes = date.getMinutes();
  minutes = minutes < 10 ? '0' + minutes : minutes;
  var month = months[date.getMonth()];
  var day = date.getDate();
  var update_time = month + " " + day + " - " + hours + ":" + minutes + " " + ampm;
  $("#last-update").html(update_time);
}

/////////////////////////////////
// Event handlers
////////////////////////////////

function addEventHandlers() {
  $("#rotations-chart").hide();
  // Chart radio buttons
  $('#chart-selector input').on('change', function() {
    if ($('#miles-radio').is(':checked')) {
      $('#rotations-chart').fadeOut(function() {
        $('#miles-chart').fadeIn();
        new Chartist.Line('#miles-chart', miles_data, options); // Make the chart
      });
    }
    if ($('#rotations-radio').is(':checked')) {
      $('#miles-chart').fadeOut(function() {
        $('#rotations-chart').fadeIn();
        new Chartist.Line('#rotations-chart', rotations_data, options); // Make the chart
      });
    }
  });
  // Odometer options
  window.odometerOptions = {
    duration: 6000 // Change how long the javascript expects the CSS animation to take
  };

  var konamiCodePosition = 0;
  // add keydown event listener
  document.addEventListener('keydown', function(e) {
    // get the value of the key code from the key map
    var key = allowedKeys[e.keyCode];
    // get the value of the required key from the konami code
    var requiredKey = konamiCode[konamiCodePosition];

    // compare the key with the required key
    if (key == requiredKey) {

      // move to the next key in the konami code sequence
      konamiCodePosition++;

      // if the last key is reached, activate cheats
      if (konamiCodePosition == konamiCode.length) {
        activateTerminal();
        konamiCodePosition = 0;
      }
    } else {
      konamiCodePosition = 0;
    }
  });

  $("#terminal-input").on("keydown", function(e) {
    var key = allowedKeys[e.keyCode];
    var content = $(this).val();
    var lastLine = content.substr(content.lastIndexOf("\n") + 1);

    if (key == "esc") {
      deactivateTerminal();
    }
    if (key == "enter") {
      e.preventDefault;
      command = lastLine.slice(3);
      if (command == "exit") {
        deactivateTerminal();
      } else {
        commands.push(command);
        commandIndex = commands.length - 1;
        sendCommand(command, done);
      }


      function done(data) {
        writeTerminalLine(data);
        scrollToBottom();
      }
    }
    if (key == 'backspace' || key == 'left') {
      if (lastLine.length == 3) {
        e.preventDefault();
      }
    }
    if (key == 'up') {
      e.preventDefault();
      editTerminalLastLine("~$ " + commands[commandIndex]);
      commandIndex = commandIndex - 1;
      if (commandIndex < 0) {
        commandIndex = commands.length - 1
      }
    }
    if (key == 'down') {
      e.preventDefault();
      editTerminalLastLine("~$ " + commands[commandIndex]);
      commandIndex = commandIndex + 1;
      if (commandIndex => commands.length) {
        commandIndex = 0;
      }
    }
  });

  function activateTerminal() {
    $("#terminal").fadeIn("fast", function() {
      $("#terminal-input").focus();
      $("#terminal-input").val('~$ ');
      $("#terminal-input").get(0).allowDefault = true;
    });
  }

  function deactivateTerminal() {
    $("#terminal").fadeOut('slow', function() {
      commands = [];
      $("#terminal-input").val('~$ ');
    });
  }

  function writeTerminalLine(text) {
    $("#terminal-input").val($("#terminal-input").val() + text + "\n~$ ");
  }

  function scrollToBottom() {
    $('#terminal-input').scrollTop($('#terminal-input')[0].scrollHeight);
  }

  function editTerminalLastLine(string_to_replace) {
    var txt = $('#terminal-input');
    var text = txt.val().trim("\n");
    var valuelist = text.split("\n");
    valuelist[valuelist.length - 1] = string_to_replace;
    txt.val(valuelist.join("\n"));
  }
}

function showLoading(show) {
  if (show) {
    $("#overlay").fadeIn("fast");
  } else {
    $("#overlay").fadeOut("slow");
  }

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

function sendCommand(command, callback) {
  $.ajax({
    url: BASE_URL + "command",
    type: "POST",
    data: {
      command: command
    },
    success: function(res) {
      console.log(res);
      callback(res.res);
    },
    error: function() {
      callback("Error - POST failure");
    }
  });
}

/////////////////////////////////
// Document ready event
////////////////////////////////

$(document).ready(function() { // TODO swap those out
  addEventHandlers();
  showLoading(true);
  sseSubscribe(BASE_URL + 'rotations/weekday', updateRotations);
  sseSubscribe(BASE_URL + 'heartbeat/latest', updateHeartbeat);
});
