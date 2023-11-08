/**
 * @author scottClaiborne
 * @version 0.01.1
 * Dependencies:
 *      CodeMirror
 *      ftp
 *      electron
 *      jquery
 * Optional Dependencies:
 *      jquery Keyboard
 *      electron-store
 */

// TODO:
// Add more support for editor not having to be global (buttons require global)
// Check if SaveData causes loadData

//Check for dependecies
if(typeof CodeMirror === "undefined")
    throw new Error("ftpEditor requires CodeMirror");

if(typeof jQuery === "undefined")
    throw new Error("ftpEditor requires jQuery")

//Define code mirror mode : gCode
CodeMirror.defineMode("gCode", function () {
    // var TOKEN_NAMES = {
    //     'g': 'positive',
    //     ')': 'negative',
    //     ',': 'comma',
    //     ';': 'comment',
    //     '`': 'strings', 
    //   };

    return {

        token: function (stream, state) {

            if (stream.match(/^\[/)) {
                return null;
            } else if (stream.match(/\w*\[/)) {
                stream.backUp(1);
                return "def keyword";
            }
            if (stream.match(/^'/)) {
                stream.match(/.*?'/)
                return "string";
            } else if (stream.match(/^[xyzabcqu]/i)) {
                return "property";
            } else if (stream.match(/^[g]/i)) {
                stream.eatWhile(/\w/); //Continue till end of word
                return "variable";
            } else if (stream.match(/^[m]/i)) {
                stream.eatWhile(/\d/); //Continue till end of word
                return "property";
            } else if (stream.match(/^[tfds]/i)) {
                return "property"
            } else if (stream.match(/^[(]/)) {
                stream.eatWhile(/[^\)]/);
                stream.next();
                return "comment";
            } else if (stream.match(/^;/)) {
                stream.skipToEnd();
                return "comment";
            } else if (stream.match(/^[\[<]/)) {
                stream.eatWhile(/[^\]>]/);
                stream.next();
                return null;
            } else if (stream.match(/N\d*/)) {
                return "atom";
            } else if (stream.match(/[*\/=-]/)) {
                return "operator";
            } else if (stream.match(/[a-z]/i)) {
                stream.eatWhile(/\w/i)
                return "variable-2";
            } else if (stream.match(/\d+\.*\d*/)) {
                return "number"
            } else {
                if (stream.eatWhile(/\w|\./)) {
                    //console.log(stream.peek());
                    //                    if(stream.match(/^[\[<]/,false))
                    //                       return "function";
                } else {
                    stream.next();
                }

                return null;
            }
        }
    };
});


var FTPEditor = function (options) {
    ///////////////////////////////////
    /* Private Functions / Variables */
    ///////////////////////////////////
    const fs = require("fs");
    const ftp = require('ftp');
    const {app, dialog} = require('@electron/remote')

    var scope = this;
    var client = new ftp();
    var testServer = false; //Use test Server (for development)

    const configSim = {
        host: 'ftp.dlptest.com',
        port: 21,
        user: 'dlpuser@dlptest.com',
        password: 'fwRhzAnR1vgig8s'
    }; //Used to connnect to Test Server

    //Default option values for editor
    var DEFAULTS = {
        "URLvariable": "file",
        "nameElement": ".editorfilename",
        "statusElement": "#editorStatus",
        "dropdownElement": ".editorDropdown",
        "mainElement": "#floatingEditor",
        "editorElement": "#editorDOM",
        "keepLocalFiles": false,
        "localFileName": "cncfile.txt",
        "loadURLvariable": false,
        "localDirPath": app.getPath('userData'),
        "remoteDirPath": "/", //add to settings
        "simulationPath": "C:/ARSimUser/", //
        "simulation": false,
        "useGlobalData": false,
        "useKeyboard": false,
        "globalObject": undefined,
        "lineFollowing": false,
        "connection": {
            "host": '127.0.0.1',
            "port": 21,
            "user": 'dev',
            "password": 'dev' 
        },
        "theme": "",
        "mode": "gCode" 
    }

    client.on('ready', function () {
        scope.connected = true;
        //console.log("connected!")
        //scope.download((filePath) => {scope.load(filePath);});

    });

    client.on('end', function () {
        scope.connected = false;
        //console.log("connection closed");
    });

    client.on('error', function (err) {
        scope.connected = false;
        if (err.message == "Timeout while connecting to server")
            setStatus(err.message, 1);
        else if (err.code == 530)
            setStatus("Login authentication failed", 2)
        else {
            setStatus(err.toString().split('\n')[0], 1);
            throw (err);
        }
    })

    //Save settings data locally
    var saveData = function () {

        scope.status.editedFile = scope.options.editedFile;
        scope.status.synced = scope.options.synced;

        scope.trigger('saveData', scope.status);

        if (scope.options.useGlobalData && scope.options.globalObject) {
            // Config will take structure from object variable
            // So internal object must be named editor and have the values
            // of the global editor, accessed via window 
            var object = {
                editor: {
                    options: {
                        editedFile: scope.status.editedFile,
                        synced: scope.status.editedFile,
                        config: scope.connection,
                        simulationPath: scope.options.simulationPath
                    }
                }
            }
            gconfig.set(object);
        }
        
        // Old Method
        // fs.writeFile(editor.dataPath, JSON.stringify(object), (err) => {
        //     if(err)
        //         throw(err);
        // });

    }

    //Load local settings data
    var loadData = function () {

        scope.trigger('loadData', scope.status);

        if(scope.options.useGlobalData && scope.options.globalObject) {
            // Check data valid
            var simulationPath = gconfig.get("editor.config.simulationPath")

            if (simulationPath[simulationPath.length - 1] != "\\") {
                gconfig.set("editor.simulationPath", simulationPath + "\\");
            }

            scope = $.extend({}, scope, gconfig.get("editor")); //Copy stored editor data

            //Use same IP as app
            scope.options.host = gconfig.get("app.ip");
            scope.options.simulation = gconfig.get("app.simulation", 1);

            //If test server connnect to test server
            if (gconfig.store.app.simulation && testServer) {
                scope.options = configSim;
            }
        }


        // fs.readFile(scope.dataPath, (err, data) => {
        //     if (err)
        //         if (err.errno == -4058)
        //             console.log("No backup data found.");
        //         else
        //             throw (err)
        //     else {
        //         console.log("Backup data restored.");
        //         var object = JSON.parse(data);
        //         editor = $.extend({}, editor, object);
        //     }
        // });
    }

    //Initialize Options
    var initOptions = function () {
        // Assign options
        options = $.extend({}, DEFAULTS, options); // Fill empty options with defualts
        options.connection = $.extend({}, DEFAULTS.connection, options.connection ? options.connection : {});

        var configuration = {};

        if (options.loadURLvariable)
            configuration.fileName = getUrlParameter(options.URLvariable);

        // File Paths + Names
        configuration.localDirPath = options.localDirPath;
        configuration.remoteDirPath = options.remoteDirPath;
        if (options.keepLocalFiles)
            configuration.localPath = configuration.localDirPath + configuration.fileName;
        else
            configuration.localPath = configuration.localDirPath + configuration.localFileName;

        configuration.localDirPath = options.localDirPath;
        configuration.remoteDirPath = options.remoteDirPath;
        if (options.keepLocalFiles)
            configuration.localPath = configuration.localDirPath + configuration.fileName;
        else
            configuration.localPath = configuration.localDirPath + configuration.localFileName;

        configuration.localFileName = options.localFileName;
        configuration.keepLocalFiles = options.keepLocalFiles;
        configuration.remotePath = configuration.remoteDirPath + configuration.fileName;
        configuration.simulationPath = options.simulationPath;
        if((configuration.simulationPath[configuration.simulationPath.length-1] != '/')
            || (configuration.simulationPath[configuration.simulationPath.length-1] != '\\'))
            configuration.simulationPath = configuration.simulationPath + '/'; 

        configuration.simulation = options.simulation;

        configuration.useKeyboard = options.useKeyboard;

        scope.isToggled = false;

        scope.statusE = $(options.statusElement);
        scope.dropdownE = $(options.dropdownElement);
        scope.editorE = $(options.editorElement);
        scope.nameE = $(options.nameElement);
        //scope.dataPath = options.dataPath + "editorData.txt"; //Unused
        scope.mainE = $(options.mainElement);
        if (scope.nameE)
            scope.nameE.val(configuration.fileName);

        // Set connection
        scope.connection = {}
        scope.connection.host = options.connection.host;
        scope.connection.port = options.connection.port;
        scope.connection.user = options.connection.user;
        scope.connection.password = options.connection.password;

        // CodeMirror
        configuration.theme = options.theme;
        configuration.mode = options.mode;

        return configuration;
    }

    //Initialize Drop files
    var initFileDrops = function () {
        scope.editorE.on('dragenter dragover', false)
            .on('drop', function (e) {
                var dataTransfer = e.originalEvent.dataTransfer;
                e.stopPropagation();
                e.preventDefault();
                if (dataTransfer && dataTransfer.files && dataTransfer.files.length > 0) {
                    scope.import(dataTransfer.files[0].path);
                    scope.nameE.val(dataTransfer.files[0].name);
                }
            });
    }

    //Initialize listeners
    var initEvents = function () {
        // currently unused
    }

    //Get url variable value
    var getUrlParameter = function (sParam) {
        var sPageURL = decodeURIComponent(window.location.search.substring(1)),
            sURLVariables = sPageURL.split('&'),
            sParameterName,
            i;

        for (i = 0; i < sURLVariables.length; i++) {
            sParameterName = sURLVariables[i].split('=');

            if (sParameterName[0] === sParam) {
                return sParameterName[1] === undefined ? true : sParameterName[1];
            }
        }
    }

    //Sets statuts element
    var setStatus = function (str, level) {
        if (scope.statusE && level > 0)
            scope.statusE.text(str);
    }

    //Fills the dropDown
    var fillFileList = function (element, list) {
        var node, link, div, text, atr, textAtr, func;
        element.empty();

        filteredList = list.filter(word => word.toLowerCase().indexOf(filterText) >= 0)

        filteredList.forEach(function (item) {
            atr = document.createAttribute("class");
            atr.value = "btn";
            textAtr = document.createAttribute("class");
            textAtr.value = "text-left";

            //func = document.createAttribute("onClick");
            //func.value = "$(" + scope.nameId + ").val($(scope).text())";
            node = document.createElement("li");
            link = document.createElement("a");
            link.setAttributeNode(atr);
            div = document.createElement("div");
            div.setAttributeNode(textAtr);
            //link.setAttributeNode(func);
            text = document.createTextNode(item.toString());
            div.appendChild(text);
            link.appendChild(div);
            node.appendChild(link);
            element.append(node);
        });

        //Create on click functions
        $(element).children('li').children('a').click(function (e) {
            scope.nameE.val($(this).children('div').text());
            scope.download();
            //console.log($(this).text());
        });

        /* Element template
        //   <li>
        //     <a class="btn">
        //       <div class="text">item</div>
        //     </a>
        //   </li>
        */
    }

    //Copies file to another location
    //Used with arSim
    var copyFile = function (source, target, cb) {
        var cbCalled = false;

        var rd = fs.createReadStream(source);
        rd.on("error", function (err) {
            done(err);
        });
        var wr = fs.createWriteStream(target);
        wr.on("error", function (err) {
            done(err);
        });
        wr.on("close", function (ex) {
            done();
        });
        rd.pipe(wr);

        function done(err) {
            if (!cbCalled) {
                cb(err);
                cbCalled = true;
            }
        }
    }

    //Delete Dialog
    var deleteDialog = function (path, fileName, callback) {
        dialog.showMessageBox(null, { //Pop up confirmation window
            type: "warning",
            buttons: ["Cancel", "Continue"],
            defaultId: 0,
            title: "Do you want to Delete: " + fileName + " ?",
            message: "Would you like to delete: " + fileName + " at: " + path,
            cancelId: 0,
            noLink: true //Prevent windows from reformatting
        }).then( (response) => {
            //resonse: 0: cancel, 1: confirm
            callback(response);
        });
    }


    ///////////////////////////////////
    /* Public Functions / Variables */
    //////////////////////////////////

    //Toggles the editor visibility 
    this.toggle = function (fileName) {
        //scope.toggle.scrollTop is a varaible local to this function

        //Is editor opened
        if (scope.isToggled) {
            scope.isToggled = false;
            //Close keyboard
            //if (scope.keyboard)
            //    scope.keyboard.close();

            //Unlock scroll
            //var scrollTop = parseInt($('html').css('top'));
            // $('html').removeClass('noscroll');
            // $('html,body').scrollTop(scope.toggle.scrollTop);

        } else {
            scope.isToggled = true;

            //Lock base scroll
            // if ($(document).height() > $(window).height()) {
            // scope.toggle.scrollTop = ($('html').scrollTop()) ? $('html').scrollTop() : $('body').scrollTop(); // Works for Chrome, Firefox, IE...
            // $('html').addClass('noscroll')//.css('top', -scrollTop);
            // }
        }

        //scope.mainE.toggle(); //Toggle Editor
        //togglePage(scope.mainE[0]);

        if (fileName) {
            scope.setFileName(fileName);
            scope.download(scope.options.localPath, scope.options.remotePath);
        } else if (fileName === "") {
            scope.setFileName(fileName);
        }

        // Makes code mirror appear correctly the first time displayed
        if (scope.isToggled)
            scope.editor.refresh(); //Refresh codeMirror

        return scope.isToggled;

    }
    var filterText = '';
    this.filter = function (filter) {
        scope.nameE.val(filter);
        filterText = filter.toLowerCase();
        fillFileList(scope.dropdownE, scope.list);
        scope.trigger('FileOpened', filter);

    }

    //Connect to server
    this.connect = function (config = scope.connection) {
        if (!config)
            setStatus("No connection settings!", 2);
        setStatus("Connecting", 0);
        client.connect(config);
    }

    //Disconnect from server
    this.end = function (callback) {
        if (callback && typeof (callback) === "function")
            client.once('end', callback);
        client.end();
    }

    //Get server directory
    this.getDir = function (path, callback) {
        if (!scope.connected && (!scope.options.simulation || (testServer && scope.options.simulation))) {
            scope.connect();
            client.once('ready', () => {
                setStatus("Fetching File list", 0);
                if (!path)
                    path = scope.options.remoteDirPath;

                //Get dir list
                client.list(path, (err, list) => {
                    var modifiedCallback = function () {
                        if (typeof (callback) === "function")
                            callback(err)
                    };
                    if (err)
                        console.error(err); //Log error but continue
                    else {
                        var names = [];
                        list.forEach(function (item) {
                            if (item.type == '-') //if it is a file 'd' - directory '-' - file
                                names.push(item.name);
                        });

                        scope.list = names;
                        //scope.end(modifiedCallback);
                        fillFileList(scope.dropdownE, scope.list);
                        setStatus("File list Fetched", 0);
                    }
                    scope.end(modifiedCallback);
                });
            });
        } else if (scope.options.simulation) {
            scope.list = fs.readdirSync(scope.options.simulationPath);
            // console.log(scope.list);
            fillFileList(scope.dropdownE, scope.list);
            setStatus("File list Fetched", 0)
        } else {
            console.log("existing connection");
        }
    }

    //Download and load from server
    this.download = function (localPath, remotePath) {
        //fetch and load
        setStatus("Loading...", 1);

        scope.fetch(localPath, remotePath, (err, path) => {
            scope.load(path, (err) => {
                if (!err)
                    setStatus("File loaded", 1);
            });
            //console.log("download-load")
        });

    }

    //Save and upload to server
    this.upload = function (localPath, remotePath) {
        //save and push
        setStatus("Saving...", 1);
        scope.save(localPath, (err, path) => {
            if (!err) {
                scope.push(path, remotePath, (error) => {
                    if (!error)
                        setStatus("File Saved", 1);
                    else {
                        setStatus("Failed! Saved locally", 2);
                        console.error(error);
                    }
                });
            } else {
                setStatus("File not Saved!", 2);
            }
        });
    }

    //Fetches file from server
    this.fetch = function (localPath, remotePath, callback) {
        scope.getFileName();
        //If not connected and (not in simulation or in simulation and using test server)
        if (!scope.connected && (!scope.options.simulation || (testServer && scope.options.simulation))) {
            scope.connect();
            client.once('ready', () => {
                setStatus("Fetching", 0);
                if (!localPath)
                    localPath = scope.options.localPath;
                if (!remotePath)
                    remotePath = scope.options.remotePath;

                //Fetching File
                client.get(remotePath, (err, stream) => {

                    var modifiedCallback = function () {
                        if (typeof (callback) === "function")
                            callback(err, localPath);
                    } //Pass through callback

                    if (err) {
                        scope.connected = false;
                        setStatus("Fetch Failed", 0);
                        scope.end(modifiedCallback);

                    } else {
                        //Data
                        scope.synced = true;
                        scope.editedFile = scope.options.fileName;
                        saveData();

                        stream.once('close', function () {
                            setStatus("Fetch Complete", 0);
                            //console.log("transfer complete"); 

                            scope.end(modifiedCallback);
                        });
                        stream.pipe(fs.createWriteStream(localPath)); // Save File
                    }
                });
            })
        } else if (scope.options.simulation) {
            copyFile(scope.options.simulationPath + scope.options.fileName, scope.options.localPath, (err) => {
                callback(err)
            });
        } else
            console.log("existing connection")
    }

    //Gets file name from hmi
    this.getFileName = function () {
        if (scope.nameE) {
            scope.options.fileName = scope.nameE.val();
            if (scope.options.keepLocalFiles)
                scope.options.localPath = scope.options.localDirPath + scope.options.fileName;
            else
                scope.options.localPath = scope.options.localDirPath + scope.options.localFileName;
            scope.options.remotePath = scope.options.remoteDirPath + scope.options.fileName;
            // console.log(scope.options.fileName);
        }
        return scope.options.fileName;
    }

    //Gets file name from hmi
    this.setFileName = function (fileName) {
        scope.nameE.val(fileName);
    }

    //Loads text from file
    this.load = function (path, callback) {
        filterText = '';
        if (!scope.connected) {
            setStatus("Loading", 0);
            scope.getFileName();
            if (!path)
                path = scope.options.localPath;

            fs.readFile(path, 'utf8', (error, data) => {
                if (error) {
                    setStatus("Load Failed", 0);
                } else {
                    scope.text = data;
                    scope.importText(scope.text);
                    setStatus("Load Complete", 0);
                    // if(document.title != scope.options.fileName)
                    //     document.title = scope.options.fileName;                    
                }
                //Handle callback
                if (callback && typeof (callback) === "function")
                    callback(error);
            });
        } else {
            console.log("existing connection");
        }
        scope.trigger('FileOpened', scope.getFileName());
    }

    //Imports text into editor
    this.importText = function (text) {
        if (!text)
            text = scope.text;
        scope.editor.setValue(text);
        //scope.editorE.multiline(text);
        // console.log("text imported");
        // console.log(text);
    }

    //Save locally
    this.save = function (path, callback) {
        if (!scope.connected) {
            scope.getFileName();
            if (!path)
                path = scope.options.localPath;
            console.log("Saving...");
            scope.text = scope.editor.getValue();

            fs.writeFile(path, scope.text, (err) => {
                if (err) {
                    setStatus("File Not Saved!", 0);

                } else {
                    setStatus("File Saved", 0);
                    //console.log("file saved!")

                    //Changes are local
                    scope.synced = false;
                    scope.editedFile = scope.options.fileName;
                    saveData();
                }
                //Handle callback
                if (callback && typeof (callback) === "function")
                    callback(err, path);
            });
        } else {
            console.log("existing connection");
        }
    }

    //Push to server
    this.push = function (localPath, remotePath, callback) {
        scope.getFileName();
        if (!scope.connected && (!scope.options.simulation || (testServer && scope.options.simulation))) {
            scope.connect();
            client.once('ready', () => {
                setStatus("Pushing", 0);
                if (!remotePath)
                    remotePath = scope.options.remotePath;
                if (!localPath)
                    localPath = scope.options.localPath;
                console.log("starting push", 0);
                client.put(localPath, remotePath, function (err) {
                    var modifiedCallback = function () {
                        if (typeof (callback) === "function")
                            callback(err);
                    }
                    if (err) {
                        setStatus("Push Failed", 0);
                        scope.connected = false;
                    } else {
                        scope.synced = true;
                        scope.editedFile = scope.options.fileName;
                        saveData();

                        setStatus("Push Complete", 0);
                    }
                    scope.end(modifiedCallback);
                });
            })

        } else if (scope.options.simulation) {
            copyFile(scope.options.localPath, scope.options.simulationPath + scope.options.fileName, (err) => {
                callback(err);
            });
        } else
            console.log("existing connection")

    }

    //Import file
    this.import = function (path) {
        if (!path) {
            dialog.showOpenDialog({
                properties: ['openFile']
            }).then((results)=> {
                if (results.canceled) //Check if no file was selected
                    return 1;
                else{
                    path = results.filePaths[0]; //Only use first file
                    let paths = path.split("\\");
                    var fileName = paths[paths.length - 1]; //use last path in directory 
                    scope.load(path, (success) => {
                    if (success) {
                        setStatus("File Imported", 1);
                        scope.nameE.val(fileName);
                    }
                    });
                }
            })
        }
        else{
            let paths = path.split("\\");
            var fileName = paths[paths.length - 1]; //use last path in directory 
            scope.load(path, (success) => {
            if (success) {
                setStatus("File Imported", 1);
                scope.nameE.val(fileName);
            }
            });
        };
    }
       
    

    //Export file
    this.export = function (path) {
        if (!path){
            dialog.showSaveDialog({
                properties: ['saveFile']
            }).then((results)=> {
                if (results.canceled){//Check if no file was selected
                    return 1;
                }else{
                    scope.save(results.filePath, (success) => {
                        if (success)
                            setStatus("File Exported", 1);
                    });
                }
            });
        }
        // if (!path) //Check if no file was selected
        //     return 1;
        else{
            scope.save(path, (success) => {
                if (success)
                    setStatus("File Exported", 1);
            });
        }
    }

    //Delete file from server
    this.delete = function () {
        if (!scope.connected && (!scope.options.simulation || (testServer && scope.options.simulation))) {
            //Get file Name and remote directory
            scope.getFileName();
            scope.getDir(null, (err) => {
                if (err)
                    return;

                scope.connect();
                client.once('ready', () => {

                    if ((scope.list.indexOf(scope.options.fileName)) != -1) {
                        deleteDialog(scope.options.remotePath, scope.options.fileName, (response) => {
                            if (response == 1) {
                                client.delete(scope.options.remotePath, (err) => {
                                    if (err)
                                        setStatus(err, 1);
                                    else
                                        setStatus(scope.options.fileName + " deleted!", 1);
                                    scope.end();
                                });
                            } else {
                                console.log("Delete canceled");
                                scope.end();
                            }
                        });

                    } else {
                        setStatus("File doesn't exist", 1);
                    }
                });
            });
        } else if (scope.options.simulation) {
            //Arsim deletion has not been implemented yet
            //setStatus("ARSim Delete is not currently supported", 1);
            if ((scope.list.indexOf(scope.options.fileName)) != -1) {
                deleteDialog(scope.options.simulationPath, scope.options.fileName, (response) => {
                    if (response.response == 1) {
                        fs.unlinkSync(scope.options.simulationPath + scope.options.fileName);
                        setStatus(scope.options.fileName + " deleted!", 1);
                    } else {
                        console.log("Delete canceled");
                    }
                });
            }
        }
    }

    var callbacks = [];
    this.on = function (callback) {
        callbacks.push(callback);
    }
    this.trigger = function (eventName) {
        var args = Array.prototype.slice.call(arguments);
        args.shift();
        callbacks.forEach(function (userCallbacks) {
            Object.keys(userCallbacks).forEach(function (callBack) {
                if (callBack == eventName) {
                    userCallbacks[callBack].apply(this, args);
                }
            })
        })
    }

    //Toggle line following
    this.toggleLineFollowing = function ($element) {
        scope.options.lineFollowing = !scope.options.lineFollowing;
        if (scope.options.lineFollowing) {
            $element.addClass('led-on');
        } else {
            $element.removeClass('led-on');
        }
    }

    //Set active line for line following
    var activeLine = 0;
    this.setActiveLine = function (lineNumber) {

        lineNumber--; //Index line number to zero
        
        //Update scroll pos
        if ((activeLine != lineNumber) && (lineNumber >= 0) && scope.options.lineFollowing) {
            //     var lineTop = line.getBoundingClientRect().top;
            //     var boxTop = $lineBox[0].getBoundingClientRect().top;
            //     $scroll.scrollTop(lineTop - boxTop - line.clientHeight * 3);
            editor.editor.scrollIntoView({ line: lineNumber, ch: 0 }, 100);
        }
        activeLine = lineNumber;


        //Highlight line
        var {from, to} = editor.editor.getViewport();
        scope.editor.eachLine(from, to, (line) => {
            editor.editor.removeLineClass(line, 'text', 'CodeMirror-Active-Line');
        });
        scope.editor.addLineClass(lineNumber, 'text', 'CodeMirror-Active-Line')

        //     var $lineBox = $('.CodeMirror-lines');
        //     var $lines = $('.CodeMirror-code .CodeMirror-line');
        //     var $scroll = $('.CodeMirror-scroll');
        //     var line = $lines[lineNumber - 1];

        //     $lines.removeClass('CodeMirror-Active-Line');
        //     $(line).addClass('CodeMirror-Active-Line');
    }

    ///////////////////////
    /* Initialize Values */
    ///////////////////////

    // Create Objects
    this.options = initOptions();

    // Init Code Mirror
    this.code = $("#editorDOM")[0];
    this.editor = CodeMirror(scope.code, {
        lineNumbers: true,
        value: "",
        theme: this.options.theme,
        mode: this.options.mode
    });
    this.editor.setSize(null, "100%");
    // this.editor.refresh();

    // Change event funtion for global data
    function didChange(newVal, oldVal) {
        loadData();
    }

    // Setup global config
    if (this.options.useGlobalData) {
        
        if(this.options.globalObject == undefined)
            throw new Error("Global Object is undefined. Supply Global Object or set use Global Data false.");

        //Handle setting changes
        gconfig.onDidChange("editor.config", (newVal, oldVal) => {
            if (!newVal) {
                console.log("gconfig.editor has been deleted");
                return;
            }

            loadData();
        });
        gconfig.onDidChange("editor.remoteDirPath", didChange);
        gconfig.onDidChange("editor.simulationPath", didChange);
        gconfig.onDidChange("app", (newVal, oldVal) => {
            if (!newVal) {
                console.log("gconfig.app has been deleted");
                return;
            }

            loadData();
        });
    }

    // Setup Keyboard
    if (this.options.useKeyboard) {
        //Check dependency 
        if(!$.keyboard)
            throw new Error("ftpEditor keyboard requires jquery.keyboard");

        // TODO: Check if element already has toggle keyboard
        let $toggleKeyboard = $('.ftp-editor-toolbar-3').append(
            `<button class="ftp-editor-togglekeyboard" title="Toggle Keyboard" class="btn">
                <i class="glyphicon glyphicon-edit"></i>
            </button>`);

        //Init Keyboard
        $.extend($.keyboard.keyaction, {
            cmdel: function (base) {
                scope.editor.execCommand("delCharAfter");
            },
            cmb: function (base) {
                scope.editor.execCommand("delCharBefore");
            },
            cmundo: function (base) {
                scopethis.editor.execCommand("undo");
            },
            cmredo: function (base) {
                scope.editor.execCommand("redo");
            },
            cmleft: function (base) {
                scope.editor.execCommand("goCharLeft");
            },
            cmright: function (base) {
                scope.editor.execCommand("goCharRight");
            }
        });

        //this.editor.getInputField()
        $(this.editor.getInputField()).keyboard({
            //keyBinding: "mousedown touchstart",
            usePreview: false,
            // lockInput: true,
            autoAccept: true,
            alwaysOpen: false,
            userClosed: true,
            openOn: '',
            // appendLocally: true,
            position: { of: $("#editorDOM"), // optional - null (attach to input/textarea) or a jQuery object (attach elsewhere)
                my: 'center top',
                at: 'center bottom',
                at2: 'center bottom', // used when "usePreview" is false (centers keyboard at bottom of the input/textarea)
                collision: 'flip'
            },
            reposition: true,
            layout: 'custom',
            customLayout: {
                'normal': [
                    '` 1 2 3 4 5 6 7 8 9 0 - = {cmdel} {cmb}',
                    '{tab} q w e r t y u i o p [ ] \\',
                    'a s d f g h j k l ; \' {enter}',
                    '{shift} z x c v b n m , . / {shift}',
                    '{accept} {space} {cmleft} {cmright} {cmundo:Undo} {cmredo:Redo}'
                ],
                'shift': [
                    '~ ! @ # $ % ^ & * ( ) _ + {cmdel} {b}',
                    '{tab} Q W E R T Y U I O P { } |',
                    'A S D F G H J K L : " {enter}',
                    '{shift} Z X C V B N M < > ? {shift}',
                    '{accept} {space} {cmleft} {cmright} {cmundo:Undo} {cmredo:Redo}'
                ]
            },
            display: {
                cmdel: '\u2326:Delete',
                cmb: '\u232B:Backspace',
                cmredo: '↻',
                cmundo: '↺',
                cmleft: '\u2190:Left',
                cmright: '\u2192:Right'
            }
        });

        this.keyboard = $(this.editor.getInputField()).getkeyboard();

        $toggleKeyboard.click(function () {
            if (!scope.keyboard.isVisible())
                scope.keyboard.reveal();
            else
                scope.keyboard.close();
        });
    }


    initFileDrops();
    initEvents();

    this.status = {editedFile: "", synced: true};

    //Load Initial File
    loadData();
    this.getDir(null, (err) => {
        //Load File
        if (scope.synced == false) {
            scope.load();
            scope.setFileName(scope.editedFile);
            setStatus("Local file restored", 1);
        } else if (err)
            setStatus(err.toString().split('\n')[0], 1);
        else if ((scope.list.indexOf(scope.options.fileName)) != -1)
            scope.download();
        //else
        //setStatus("Initialized - file doesn't exist");
    });

    setTimeout(() => {this.editor.refresh()}, 20);
    this.editor.setSize(null, "100%");
    setStatus("Initialized", 0);
}
try{
// Instance
var editor = new FTPEditor(
    {
        connection: {
            host: typeof Configuration === 'undefined' ? '127.0.0.1' : Configuration.ipAddress,
            port: 21,
            user: 'dev',
            password: 'dev' 
        },
        remoteDirPath: "F:/CNC_Prg/",
        simulation: typeof Configuration === 'undefined' ? true : (Configuration.ipAddress === '127.0.0.1' || Configuration.ipAddress === 'localhost') ? true : false ,
        simulationPath: "C:/ARSimUser/" + Configuration.cncFolder + "/CNC_Prg/",
        theme: "friendship-bracelet",
//        useKeyboard: true//We have a multiple jquery problem..
    });
}
catch(e){
    console.log('editor failed!');
    $("#editorDOM").html("The G-Code Editor requires running in electron")
}