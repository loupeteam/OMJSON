//Load the configuration file and start the connection
//  This uses the import function to load the configuration file
//  in ES6 moduels, the import can be done like this:
//  import {configurationLoaded} from './Configuration.js'
//  configurationLoaded.then(Configuration => {
//  })  
import('./Configuration.js').then(module => {
  module.configurationLoaded.then(Configuration => {

    //Make the configuration available to the window
    window['Configuration'] = Configuration;

    //Start the connection to the machine
    createNewConnection(Configuration.ipAddress, Configuration.port)

    console.log('Configuration loaded in app.js')
  })
})



const num_axes = 3
import('./axisController.js').then(ns => {
  Object.assign(window, ns);
  //Setup the axis controller for the correct number of axes
  window['serviceAxis'] =  new axisController(0, num_axes);
});

import('./Keyboard.js').then(ns => {

});


//Create a new connection to the machine
function createNewConnection(ip, port){
  window['machine'] = new WEBHMI.Machine({
    port: port,
    ipAddress: ip,
    maxReconnectCount: 5000
  });
  import('./InitCyclicReads.js')
}


//Setup the HMI refresh
setInterval(WEBHMI.updateHMI, 30)



