machine.writeVariable("AtnHmi:refreshState", 1);
machine.readVariable("AtnHmi:systemState", function () {

    var systemState = JSON.parse(machine["AtnHmi:systemState"])
    systemState.commands = systemState.commands.sort();
    systemState.States = systemState.States.sort();

    let commands = systemState.commands.map(function (t) {
        return `<li class="list-group-item" onclick="selectCommand('${t}')"> ${t} </li>`
    })
    let states = systemState.States.map(function (t) {
        return `<li class="list-group-item" onclick="selectState('${t}')"> ${t} </li>`
    })
    $('#atnCommand').html(commands)
    $('#atnState').html(states)
});

function selectCommand(which) {
    machine.writeVariable("AtnHmi:AtnPLCOpenCall[0].Command", which);
}

function selectState(which) {
    machine.writeVariable("AtnHmi:readState[0].State", which);
}