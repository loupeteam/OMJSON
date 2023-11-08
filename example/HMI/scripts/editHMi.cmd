start /B code Electron\public
%~dp0\Electron\node_modules\.bin\electron --js-flags="--max_old_space_size=4096" --remote-debugging-port=9223 %~dp0\Electron\ElectronApp.js
