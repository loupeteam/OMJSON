/********************************************************************
 * COPYRIGHT --  
 ********************************************************************
 * Library: OMJSON
 * File: jsonInternalSetReadError.c
 * Author: dfblackburn
 * Created: March 26, 2015
 ********************************************************************
 * Implementation of library OMJSON
 ********************************************************************/

#include <bur/plctypes.h>
#ifdef __cplusplus
	extern "C"
	{
#endif

#include "omjsonInternal.h"
#include "OMJSON.h"
#include <string.h>

#ifdef __cplusplus
	};
#endif

//***********************************************************************
// Internal: Set error status on a jsonReadVariable FUB instance 		*
//***********************************************************************

unsigned short jsonInternalSetReadError(unsigned short ErrorID, struct jsonReadVariable* t)
{

	if( t == 0 ) return JSON_ERR_INVALIDINPUT;
	
	// Set FUB outputs
	t->Status = ErrorID;
	t->pJSONObject = 0;
	t->JSONObjectLength = 0;
	
	return 0;

} // End Fn
