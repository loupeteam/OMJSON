/**
 * @author davidblackburn
 */

let UIContext = {}
let serviceAxis = {}
var widgets = new Widgets("./widgets.json", (data)=>{
  serviceAxis = new axisController( 0, 12)
  widgets.loadPage( data.startPage.container, data.startPage.name)  
 })
  

function readServerFile(fileName) {
  let request = new XMLHttpRequest();
  request.open('GET', fileName, false); // `false` makes the request synchronous
  request.send(null);
    if (request.status === 200 || request.status === 0) {
    return request.responseText;
  } else {
    return null
  }
}

var machine;
var Configuration = {};
Configuration.port = 8001;
Configuration.ipAddress =
  window.location.host == "" ? "10.33.7.232" : window.location.host;

{

let response = readServerFile("OpenRobot.json")
if (response) {
  Configuration = Object.assign(Configuration, JSON.parse(response))
} else {
  let pathname = `${location.pathname.substring(0, location.pathname.lastIndexOf("/"))}/OpenRobot.json`;
  try {
  if (process.platform === "win32") {
  pathname = pathname.substr(1);
  }
    //Try fs for the case that we have electron
    var fs = require("fs");
    Configuration = Object.assign(Configuration, JSON.parse(fs.readFileSync(pathname)))
  } catch (e) {
    try {
      //Write default file assuming the error was a failed read
      fs.writeFile(pathname, JSON.stringify(Configuration), function (err) { if (err) throw err;});
    } catch (e) {
      console.log(e)
    }
  }
}

// Configuration = Object.assign(Configuration, localStorage.getItem('Configuration'))

let localConfig = JSON.parse( localStorage.getItem('Configuration') );
if(localConfig){
  Configuration = Object.assign(Configuration, localConfig);
}

// GLOBAL project variables
try{
  machine = new WEBHMI.Machine({
    port: Configuration.port,
    ipAddress: Configuration.ipAddress,
    maxReconnectCount: 5000
  });  
  Configuration.value = machine.value;
}
catch{

}
Configuration.writeVariable = function (name, value) {
  Configuration.value(name, value);
  try{
    fs.writeFile(pathname, JSON.stringify(Configuration), function (err) {
      if (err) throw err;
      window.location.reload();
    });  
  }
  catch{ 
    localStorage.setItem('Configuration',JSON.stringify(Configuration))
  }
};
Configuration.readVariable = function (name, value) {
  return Configuration.value(name);
};
Configuration.initCyclicRead = function () {};
WEBHMI.updateHMI();
}

const refreshMainButtons = function () {
  $("span.webhmi-apply-children>button").removeClass("disabled");
  $("span.child-disabled>button").addClass("disabled");
  $("span.child-disabled>button").blur();
};
WEBHMI.hmiRefresh = 5;



//$(document).one({
//	'readsuccess.arg': function () {
//		setInterval(WEBHMI.updateHMI, 100);
//		setInterval(lifesign, 100);
//	}
//});

function lifesign() {
  machine.writeVariable("ServoUser:Timeout.IN", 0);
}

// Start things up when document is ready
$(document).ready(function () {
  // Read variables
  machine.readVariable("buildRevision");

  WEBHMI.updateBindings();

  Snippets.includeFiles(function () {
    WEBHMI.updateBindings();
  });

  // Prevent navigation from dropped files
  document.addEventListener(
    "dragover",
    function (event) {
      event.preventDefault();
      return false;
    },
    false
  );

  document.addEventListener(
    "drop",
    function (event) {
      event.preventDefault();
      return false;
    },
    false
  );

  //disable and enable all the toggles that skip lines on the CNC
  $("#disablelinemodebutton").change(function () {
    var $this = $(this);
    if ($this.prop("checked")) {
      $("#disablelinemode").attr("disabled", false);
    } else {
      $("#disablelinemode").attr("disabled", true);
    }
  });
});

machine.initCyclicRead("MsgBox:MessageBox");
machine.initCyclicRead("Trace:varVariable");
machine.initCyclicRead("MachineHMI:HMIMachineCMD");
machine.initCyclicRead("gMachine.IN.CMD");
machine.initCyclicRead("gMachine.OUT.State");
machine.initCyclicRead("gMotorBasic");
machine.initCyclicRead("AxisBasic:Configuration");

var updateMachineErrors = function () {
  if (
    machine === undefined ||
    machine.gErrorCollector === undefined ||
    machine.gErrorCollector.OUT === undefined ||
    machine.gErrorCollector.OUT.ErrorCount === undefined
  ) {
    machine.initCyclicRead("gErrorCollector.OUT.ErrorCount");
    return;
  }
  if (
    machine.gErrorCollectorHMI === undefined ||
    machine.gErrorCollectorHMI.ErrorList === undefined
  ) {
    machine.initCyclicRead("gErrorCollectorHMI.ErrorList");
    return;
  }

  var errorCount = machine.gErrorCollector.OUT.ErrorCount;
  var errorList = "";
  for (let i = 0; i < errorCount; i++) {
    errorList =
      errorList +
      '<li class = "list-group-item">' +
      machine.gErrorCollectorHMI.ErrorList[i] +
      "</li>";
  }

  var $errorElement = $("#errorList");
  if ($errorElement.attr('data-error-text') != errorList) {
    $errorElement.attr('data-error-text', errorList)
    $errorElement.html(errorList);
  }
};

// TODO: rework/remove all this jog stuff
var updatejogselectLEDs = function () {
  $("button.updatejogselect").each(function (index, element) {
    var $this = $(this);
    var jogmode = "none";
    var thisjogmode = $this.attr("jogmode");
    if (thisjogmode === undefined) {
      thisjogmode = "none";
    }
    var jogon = true;

    //detect the jogmode of the machine
    if (machine.gRobotControl === undefined) {
      return;
    } else if (machine.gJogData.SelectedMode == 2) {
      //TCP enabled
      var jogmode = "TCP";
    } else if (machine.gJogData.SelectedMode == 1) {
      //joint
      var jogmode = "joint";
    } else if (machine.gJogData.SelectedMode == 0) {
      //motor
      var jogmode = "motor";
    }

    if (machine.gRequestedMode === undefined) {
      return;
    } else if (machine.gRequestedMode == 2) {
      jogon = true;
    } else {
      jogon = false;
    }

    //set the button class to btn-success if the system mode matches the buttons mode and the button is true
    var varValue = WEBHMI.getValue($this);
    if (
      varValue == WEBHMI.getSetValue($this) &&
      jogmode == thisjogmode &&
      jogon
    ) {
      //button is true
      $this.addClass("btn-success").removeClass("default");
    } else {
      $this.addClass("default").removeClass("btn-success");
    }
    //		if (jogmode != thisjogmode || !jogon) {
    if (!jogon) {
      $this.prop("disabled", true);
    } else {
      $this.prop("disabled", false);
    }
  });
};

var updatejogselectbuttons = function () {
  var $this = $(".updatejogselectmode");
  var jogon = true;

  if (machine.gRequestedMode === undefined) {
    return;
  } else if (machine.gRequestedMode == 2) {
    $this.prop("disabled", false);
  } else {
    $this.prop("disabled", true);
  }
};

var updateRobot = function () {
  try{

    if (robotData === undefined || robotData.pose === undefined) {
      // wait for model to finish loading
      return;
    }

    // Example for reading axis positions.
    //var xAxis = machine['gMotorBasic']?.[1].OUT.Position;

    //robotData.pose(xAxis);

  }
  catch (e){
    console.log(e)
  }
}

WEBHMI.on({
  "update-hmi": function () {
    updatejogselectLEDs();
    updatejogselectbuttons();
    updateMachineErrors();
    refreshMainButtons();
    updateRobot();
  }
});

$(document).on({
  "buildRevision-readerror.arg": function () {
    machine.readVariable("buildRevision");
  },

  "readsuccess.arg": function () {
    $("#online").html("Online");
    $("#framerate").html(
      machine.connection.statistics.frameRateFiltered.toFixed(0)
    );
    $("#statistics").html(
      "<pre>" +
      JSON.stringify(machine.connection.statistics, null, 2) +
      "</pre>"
    );
  },
  "readerror.arg": function () {
    $("#online").html("ReadError");
  },

  "writesuccess.arg": function () {
    $("#online").html("Online");
  },
  "writeerror.arg": function () {
    $("#online").html("WriteError");
  }
});



