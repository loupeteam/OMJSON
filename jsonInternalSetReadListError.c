/********************************************************************
 * COPYRIGHT --  
 ********************************************************************
 * Library: OMJSON
 * File: jsonInternalSetReadListError.c
 * Author: dfblackburn
 * Created: March 25, 2015
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
// Internal: Set error status on a jsonReadVariableList FUB instance 	*
//***********************************************************************

unsigned short jsonInternalSetReadListError(unsigned short ErrorID, struct jsonReadVariableList* t)
{

	if( t == 0 ) return JSON_ERR_INVALIDINPUT;
	
	// Set FUB outputs
	t->Status = ErrorID;
	t->pJSONObject = 0;
	t->JSONObjectLength = 0;
	
	return 0;

} // End Fn
