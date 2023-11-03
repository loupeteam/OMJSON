(********************************************************************
 * COPYRIGHT -- Automation Resources Group
 ********************************************************************
 * Package: MachineControl
 * File: MachineControl.typ
 * Author: David Blackburn
 * Created: November 10, 2011
 ********************************************************************
 * Data types of package MachineControl
 ********************************************************************)

TYPE
	SUBSTATES : 
		(
		SUB_STATE_INIT,
		SUB_BOOTING_INIT_FILE_DEVICES,
		SUB_STATE_STARTING_SET_LIMITS,
		SUB_STATE_PSU_POWER,
		SUB_STATE_SERVO_POWER,
		SUB_STATE_SERVO_HOME,
		SUB_STATE_SERVO_HOME_DONE,
		SUB_STATE_ENABLE_DRIVE_COMPS,
		SUB_STATE_ENABLE_AXIS_ENAGAGE,
		SUB_STATE_STARTING_CNC_START,
		SUB_STATE_STARTING_CNC_STARTED,
		SUB_STATE_STARTING_CNC_FAILED,
		SUB_STATE_STARTING_ENABLE_CLAMP,
		SUB_STATE_EXITING_INIT,
		SUB_STATE_EXITING_CLEANUP,
		SUB_STATE_STOPPING_DISABLE_HEAD,
		SUB_STATE_STOPPING_DISABLE_VFD,
		SUB_STATE_EXITING_DISABLE_CLAMP,
		SUB_STATE_STOPPING_STOP_CNC,
		SUB_STATE_CLEARING_PROMPT_USER,
		SUB_STATE_CLEARING_START_PROGRAM,
		SUB_STATE_CLEARING_WAIT_FINISH,
		SUB_STATE_DISABLE_AXIS_ENAGAGE,
		SUB_STATE_SERVO_STOP,
		SUB_STATE_SERVO_POWER_OFF,
		SUB_STATE_BACKUP_HOME_DATA,
		SUB_STATE_STOP_DISABLE_MOTORS
		);
	MODE_MACHINE_ENUM : 
		(
		MODE_MACHINE_AUTO,
		MODE_MACHINE_MANUAL_PROGRAM,
		MODE_MACHINE_MANUAL_JOG
		);
END_TYPE
