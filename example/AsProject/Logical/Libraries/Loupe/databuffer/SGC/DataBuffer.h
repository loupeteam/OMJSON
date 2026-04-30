/* Automation Studio generated header file */
/* Do not edit ! */
/* DataBuffer 1.0.0 */

#ifndef _DATABUFFER_
#define _DATABUFFER_
#ifdef __cplusplus
extern "C" 
{
#endif
#ifndef _DataBuffer_VERSION
#define _DataBuffer_VERSION 1.0.0
#endif

#include <bur/plctypes.h>

#ifndef _BUR_PUBLIC
#define _BUR_PUBLIC
#endif
#ifdef _SG3
		#include "sys_lib.h"
#endif
#ifdef _SG4
		#include "sys_lib.h"
#endif
#ifdef _SGC
		#include "sys_lib.h"
#endif


/* Datatypes and datatypes of function blocks */
typedef enum DATBUF_ERR_enum
{	DATBUF_ERR_INVALIDINPUT = 50000,
	DATBUF_ERR_MEMALLOC,
	DATBUF_ERR_NOTINITIALIZED,
	DATBUF_ERR_BUFFERFULL
} DATBUF_ERR_enum;

typedef struct datbufBuffer_typ
{	unsigned long pData;
	unsigned long currentLength;
	unsigned long maxLength;
} datbufBuffer_typ;



/* Prototyping of functions and function blocks */
_BUR_PUBLIC unsigned short datbufClearBuffer(unsigned long pBuffer);
_BUR_PUBLIC unsigned short datbufInitBuffer(unsigned long pBuffer, unsigned long maxLength);
_BUR_PUBLIC unsigned short datbufAppendToBuffer(unsigned long pBuffer, unsigned long pData, unsigned long dataLength);


#ifdef __cplusplus
};
#endif
#endif /* _DATABUFFER_ */

