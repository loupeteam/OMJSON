//  To use the configuration you need to do something like this:

//In ES6 moduels, the import can be done like this:
/*
import {configurationLoaded} from './Configuration.js'
configurationLoaded.then(Configuration => {
    //Your code here
})  
*/

//In non ES6 modules, the import can be done like this:
/*
import('./Configuration.js').then(module => {
    module.configurationLoaded.then(Configuration => {
        //Your code here
    })
})
*/

import { saveAs } from '../libraries/FileSaver.js';

const Configuration = new WEBHMI.HMI(() => {

})
const configfilename = 'Config.json';

//Set the default configuration
Configuration.port = 8000;
Configuration.ipAddress = '127.0.0.1';
Configuration.cncFolder = 'WebHMI';
Configuration.robotFolder = 'TODO';
Configuration.ConfigurationChanged = ConfigurationChanged;
Configuration.exportConfiguration = exportConfiguration;
Configuration.forceLoadConfiguration = forceLoadConfiguration;
//create a new promise to return
const configurationLoaded = new Promise((resolve, reject) => {

    //Make an asynchronous xmlhttprequest to read the configuration file
    let request = new XMLHttpRequest();
    request.onreadystatechange = function () {
        if (request.readyState === 4 ){

            //Get the configuration text
            let configurationText = getActiveConfiguration(request.responseText);

            //Read the datas
            Object.assign(Configuration, JSON.parse(configurationText))

            //Save the configuration to the local storage
            ConfigurationChanged();

            //Resolve the promise to tell the user we are done loading
            resolve(Configuration);
        }
    }
    request.open('GET', '../'+configfilename, true);
    request.send(null);
});

//Create a function to read the configuration
Configuration.writeVariable = function (name, value) {    
    Configuration.value(name, value);
    ConfigurationChanged();
};

//Create a function to read the configuration
//  This function compares the file contents to the local storage contents
//  If they are the same, it returns the local storage contents
//  Otherwise it returns the file contents and updates the local storage contents
function getActiveConfiguration( filecontents ) {

    let localStorageContent = window.localStorage.getItem('ConfigurationFileContents');

    //If the file contents match the last save file contents in local storage
    // OR if the file contents are empty, return the local storage configuration
    //Otherwise return the file contents and update the local storage contents
    if ((filecontents && localStorageContent && filecontents === localStorageContent) || !filecontents) {
        return localStorage.getItem('Configuration');
    }
    else{
        window.localStorage.setItem('ConfigurationFileContents', filecontents);    
        return filecontents;
    }
}

//Create a function to write the configuration
//  This function writes the configuration to the local storage
//  It also writes the configuration to the file
//  This function is called whenever the configuration is changed
export function ConfigurationChanged() {
    localStorage.setItem('Configuration', JSON.stringify(Configuration))
}

//Create a function to export the configuration
//  This function exports the configuration to a file
//  It is also added to the window object so it can be called from the console
export function exportConfiguration(){
    let configurationText = JSON.stringify(Configuration);
    let blob = new Blob([configurationText], {type: "text/plain;charset=utf-8"});
    saveAs(blob, configfilename);
}

//Add a function to force loading from the file
//  This function is added to the window object so it can be called from the console
export function forceLoadConfiguration(){
    window.localStorage.removeItem('ConfigurationFileContents');
    window.location.reload();
}

export {configurationLoaded, Configuration}