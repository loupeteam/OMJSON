# Info
Package is provided by Loupe  
https://loupe.team  
info@loupe.team  
1-800-240-7042  

# Description

This repo provides packages for communicating with a B&R PLC using WebSockets and a JSON interface. This allows the PLC to act as a server for Loupe's webHMI client. 

### Library Package
The OMJSON library package bundles up the function blocks needed in order to run the WebSocket server and read/write to PLC variables.  

### Program Package
This repo also contains a program package that can be deployed to run the OMJSON-based webserver.

# Installation

To install the program package using the Loupe Package Manager (LPM), in an initialized Automation Studio project directory run `lpm install webhmiprog`. Note that this will also pull in the library package as a dependency. 
If you only want to install the library package, run `lpm install omjson`. 

For more information about LPM, see https://loupeteam.github.io/LoupeDocs/tools/lpm.html.

# Documentation
For more documentation and examples, see https://loupeteam.github.io/LoupeDocs/libraries/omjson.html (or you can run `lpm docs omjson`).

# Licensing

This project is licensed under the [MIT License](LICENSE).