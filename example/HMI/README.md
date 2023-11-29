# Info
Library is provided by Loupe  
https://loupe.team  
info@loupe.team  
1-800-240-7042  

# Description
The StarterHmiProject repo provides a Loupe UX-based starter HMI that includes all of the common utilities that most Loupe HMIs need. It is intended to be a good starting point for new applications. Note that this is a template that is intended to be modified after it has been installed. 

# Getting Started

### Installation
To install using the Loupe Package Manager (LPM), run `lpm init` in an empty directory, and when prompted to install an Automation Studio project, select `No`. Then run `lpm install starterhmiproject`. For more information about LPM, see https://loupeteam.github.io/LoupeDocs/tools/lpm.html

### Running the HMI
Perform the following steps:
- In the root directory of the repo, run `npm install` from the command line. This creates the `node_modules` folder and installs packages the HMI depends on. 
- Navigate into the `/app` folder, and run `npm install` again.
- You can then execute `runHMI.cmd` from the `/scripts` folder, and this will launch the HMI. 

# Licensing

This project is licensed under the [MIT License](LICENSE).