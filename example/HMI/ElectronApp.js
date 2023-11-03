'use strict';

const electron = require('electron');
const defaultHtmlName = 'Index.html';
const htmlRoot = '/app/';
const fs = require('fs');
const path = require('path');
const { dialog, BrowserWindow } = require('electron');


//Start the PLC simuator
//TODO: Make this optional
//require("plc-sim/index.js")

// In the main process:
require('@electron/remote/main').initialize()

// Set the file descriptor limit to allow a lot of files to be open at once
if (process.platform == 'darwin') {
	process.setFdLimit(8192);
}

const app = electron.app;
//app.commandLine.appendSwitch('--disable-gpu')

// Keep a global reference of the window object; if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow,
	mainWindowOptions,
	mainContentBounds,
	topNavHeight = 105,
	sideNavWidth = 255,
	devTools = false,
	devWindow = true

const createWindow = function () {

	// console.log(app.getPath('userData'));

	mainWindowOptions = {
		resizable: true,
		movable: true,
		minimizable: true,
		fullscreen: false,
		title: 'Help',
		frame: true,
		webPreferences: { 
			enableRemoteModule: true,
			nodeIntegration: true,
			contextIsolation: false,
		}

	}
	mainWindowOptions.width = 960;
	mainWindowOptions.height = 540;

	if (devWindow) {
		mainWindowOptions.width = 1920
		mainWindowOptions.height = 1080
		mainWindowOptions.x = 0
		mainWindowOptions.y = 0
		mainWindowOptions.useContentSize = true
		mainWindowOptions.resizable = true
		mainWindowOptions.movable = true
		mainWindowOptions.minimizable = true
		mainWindowOptions.fullscreen = false
		mainWindowOptions.frame = true
	}

	mainWindow = new BrowserWindow(mainWindowOptions)
	mainContentBounds = mainWindow.getContentBounds()

	if (devTools) {
		mainWindow.webContents.openDevTools()
	}
	mainWindow.loadURL('file://' + __dirname + htmlRoot + defaultHtmlName);

	require("@electron/remote/main").enable(mainWindow.webContents)

	function closeAllWindows() {
		let openWindows = BrowserWindow.getAllWindows(),
			length = openWindows.length,
			i
		for (i = 0; i < length; i++) {
			openWindows[i].close()
		}
	}

	mainWindow.on('closed', () => {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		closeAllWindows()
		mainWindow = null
	})
}

app.on('activate', function () {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (mainWindow === null) {
		createWindow();
		mainWindow.maximize();
	} else if (devWindow) {
		// Open the DevTools.
		mainWindow.webContents.openDevTools();
		mainWindow.reload()
	}
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function () {
	createWindow();
	if (!devWindow)
		mainWindow.maximize();
});

// Quit when all windows are closed.
app.on('window-all-closed', function () {
	// On OS X it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit();
	}
});


var {
	Menu
} = require("electron");

var template = [{
		label: "Application",
		submenu: [{
			label: "Quit",
			accelerator: "Command+Q",
			click: function () {
				app.quit();
			}
		}]
	},
	{
		label: 'View',
		submenu: [{
				label: 'Reload',
				accelerator: 'CmdOrCtrl+R',
				click(item, focusedWindow) {
					if (focusedWindow) focusedWindow.reload();
				}
			},
			{
				label: 'Open Cockpit',
				click(item, focusedWindow) {
					const shell = require('electron').shell;
					// GlobalStorage
					var UserStorage = require("electron-store");
					let config = new UserStorage({});
					if (gconfig.store.app.simulation) {
						shell.openExternal("http://localhost:81/index.html?visuId=mappCockpit")
					} else {
						shell.openExternal("http://" + config.store.app.ip + ":81/index.html?visuId=mappCockpit")
					}
				}
			},
			{
				label: 'Toggle Developer Tools',
				accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
				click(item, focusedWindow) {
					if (focusedWindow)
						focusedWindow.webContents.toggleDevTools();
				}
			},
		]
	},
];

Menu.setApplicationMenu(Menu.buildFromTemplate(template));