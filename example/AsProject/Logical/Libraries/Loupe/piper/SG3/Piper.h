/* Automation Studio generated header file */
/* Do not edit ! */
/* Piper 0.01.8 */

#ifndef _PIPER_
#define _PIPER_
#ifdef __cplusplus
extern "C" 
{
#endif
#ifndef _Piper_VERSION
#define _Piper_VERSION 0.01.8
#endif

#include <bur/plctypes.h>

#ifndef _BUR_PUBLIC
#define _BUR_PUBLIC
#endif
#ifdef _SG3
		#include "AsBrStr.h"
		#include "operator.h"
		#include "sys_lib.h"
		#include "logthat.h"
		#include "stringext.h"
#endif
#ifdef _SG4
		#include "AsBrStr.h"
		#include "operator.h"
		#include "sys_lib.h"
		#include "logthat.h"
		#include "stringext.h"
#endif
#ifdef _SGC
		#include "AsBrStr.h"
		#include "operator.h"
		#include "sys_lib.h"
		#include "logthat.h"
		#include "stringext.h"
#endif


/* Constants */
#ifdef _REPLACE_CONST
 #define PIPER_DEFAULT_BOOTING_CYCLES 50U
 #define MAI_PIPER_MODULES 99U
 #define PIPER_DEFAULT_LOGGERNAME "App"
 #define IDLE_SUBSTATE 65535
#else
 _GLOBAL_CONST unsigned short PIPER_DEFAULT_BOOTING_CYCLES;
 _GLOBAL_CONST unsigned char MAI_PIPER_MODULES;
 _GLOBAL_CONST plcstring PIPER_DEFAULT_LOGGERNAME[9];
 _GLOBAL_CONST signed long IDLE_SUBSTATE;
#endif




/* Datatypes and datatypes of function blocks */
typedef enum PIPER_RESPONSE_ST
{	PIPER_RESPONSE_ST_NONE,
	PIPER_RESPONSE_ST_ERROR,
	PIPER_RESPONSE_ST_STEP_DONE,
	PIPER_RESPONSE_ST_NEXT_STEP,
	PIPER_RESPONSE_ST_STATE_DONE,
	PIPER_RESPONSE_ST_BUSY
} PIPER_RESPONSE_ST;

typedef enum MACH_ST_enum
{	MACH_ST_NOT_READY = 0,
	MACH_ST_BOOTING = 1,
	MACH_ST_BOOTED,
	MACH_ST_ERROR,
	MACH_ST_CLEARING,
	MACH_ST_STOPPED,
	MACH_ST_STARTING,
	MACH_ST_IDLE,
	MACH_ST_SUSPENDED,
	MACH_ST_EXECUTE,
	MACH_ST_STOPPING,
	MACH_ST_ABORTING,
	MACH_ST_ABORTED,
	MACH_ST_HOLDING,
	MACH_ST_HELD,
	MACH_ST_UNHOLDING,
	MACH_ST_SUSPENDING,
	MACH_ST_UNSUSPENDING,
	MACH_ST_RESETTING,
	MACH_ST_COMPLETING,
	MACH_ST_COMPLETE,
	MACH_ST_BYPASSED,
	MACH_ST_
} MACH_ST_enum;

typedef struct Piper_IN_CMD_typ
{	plcbit Reset;
	plcbit Start;
	plcbit Stop;
	plcbit Hold;
	plcbit Unhold;
	plcbit Suspend;
	plcbit Unsuspend;
	plcbit Abort;
	plcbit Clear;
	plcbit BypassAll;
	plcbit AcknowledgeError;
} Piper_IN_CMD_typ;

typedef struct Piper_IN_CFG_typ
{	unsigned short BootCycles;
	plcstring LoggerName[9];
} Piper_IN_CFG_typ;

typedef struct Piper_IN_typ
{	struct Piper_IN_CMD_typ CMD;
	struct Piper_IN_CFG_typ CFG;
} Piper_IN_typ;

typedef struct Piper_OUT_typ
{	unsigned short Error;
	plcstring ErrorString[81];
	enum MACH_ST_enum State;
	signed long SubState;
	unsigned long BusyModule;
	unsigned long ErrorModule;
	unsigned long SubStateRequestModule;
} Piper_OUT_typ;

typedef struct Piper_Internal_typ
{	signed long NextSubState;
	enum PIPER_RESPONSE_ST ResponseStatus;
	unsigned long ModuleList[100];
	plcstring ModuleNames[100][81];
	signed long NumberModules;
	unsigned short BootCycles;
} Piper_Internal_typ;

typedef struct Piper_typ
{	struct Piper_IN_typ IN;
	struct Piper_OUT_typ OUT;
	struct Piper_Internal_typ Internal;
} Piper_typ;

typedef struct Module_Interface_typ
{	plcstring ModuleName[81];
	plcstring ModuleStatus[81];
	enum MACH_ST_enum PiperState;
	signed long PiperSubState;
	enum MACH_ST_enum ModuleResponse;
	signed long ModuleSubStateRequest;
	plcbit ModuleBypass;
	plcbit ModuleIsBypassed;
} Module_Interface_typ;

typedef struct Piper_Module_Internal_typ
{	plcbit Added;
	unsigned long ModuleIndex;
} Piper_Module_Internal_typ;

typedef struct Piper_Module_Fub
{
	/* VAR_INPUT (analog) */
	struct Piper_typ* Piper;
	struct Module_Interface_typ* ModuleInterface;
	/* VAR (analog) */
	struct Piper_Module_Internal_typ internal;
} Piper_Module_Fub_typ;



/* Prototyping of functions and function blocks */
_BUR_PUBLIC void Piper_Module_Fub(struct Piper_Module_Fub* inst);
_BUR_PUBLIC plcbit Piper_fn_Cyclic(struct Piper_typ* Piper);
_BUR_PUBLIC plcbit Piper_setCommand(struct Piper_typ* Piper);
_BUR_PUBLIC plcbit Piper_checkResponses(struct Piper_typ* Piper);
_BUR_PUBLIC plcbit Piper_handleResponseState(struct Piper_typ* Piper);
_BUR_PUBLIC plcbit Piper_PackML(struct Piper_typ* Piper);
_BUR_PUBLIC plcbit PackMLStateString(enum MACH_ST_enum State, plcstring* String);
_BUR_PUBLIC plcbit PiperStateChange(struct Piper_typ* Piper, enum MACH_ST_enum State);


__asm__(".section \".plc\"");

/* Additional IEC dependencies */
__asm__(".ascii \"iecdep \\\"Logical/Libraries/Loupe/logthat/Constants.var\\\" scope \\\"global\\\"\\n\"");

__asm__(".previous");

#ifdef __cplusplus
};
#endif
#endif /* _PIPER_ */

