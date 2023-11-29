chdir %~dp0\Electron
npx electron-packager ./ --platform=win32 --arch=x64 --out=../ElectronBuild/ --overwrite