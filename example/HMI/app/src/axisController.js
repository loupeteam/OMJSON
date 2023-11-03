import {viewDelegate} from "../../@loupeteam/tmplits/tmplits.js"

export class axisData {
    constructor(){
        this.units = '[mm]'   
        this.selectedWaypoint = 0 
    }
}

export class axisController extends viewDelegate{
    constructor(selectedAxis, axisCount=1) {
        super()
        this.index = selectedAxis
        this.selectedAxis = selectedAxis
        this.selectedWaypoint = 0        
        this.axis = []
        for( let i=0; i<axisCount;i++)
            this.axis.push( new axisData() )

        this.selectedAxisObject = this.axis[0]
    }
    willLoad(){
        this.selectedWaypoint = machine.gMotorBasic?.[this.selectedAxis]?.IN?.PAR?.WaypointIndex || this.selectedAxisObject.selectedWaypoint        
    }
    selectAxis(selectedAxis) {        
        this.index = selectedAxis
        this.selectedAxis = selectedAxis
        this.selectedAxisObject = this.axis[selectedAxis]        
        this.selectedWaypoint = machine.gMotorBasic?.[this.selectedAxis]?.IN?.PAR?.WaypointIndex || this.selectedAxisObject.selectedWaypoint        
        this.updateDom()
    }
    selectWaypoint(index) {
        this.selectedWaypoint = +index
        this.selectedAxisObject.selectedWaypoint = this.selectedWaypoint
        machine.writeVariable(`gMotorBasic[${this.selectedAxis}].IN.PAR.WaypointIndex`, this.selectedWaypoint)
        this.updateDom()
    }
    teachWaypoint() {
        let position = machine.gMotorBasic[this.selectedAxis].OUT.Position
        machine.writeVariable(`gMotorBasic[${this.selectedAxis}].IN.Waypoint[${this.selectedWaypoint}].Position`, position)
    }

}
