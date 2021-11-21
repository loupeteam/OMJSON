/********************************************************************
 * COPYRIGHT --  
 ********************************************************************
 * Library: OMJSON
 * File: jsonReadVariableFromCache.c
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
#include <math.h>
#include "jsonAux.h"
#include "jsonInternal.h"

#ifdef __cplusplus
	};
#endif

//*******************************************************************
// Convert a variable into a JSON object			 				*
//*******************************************************************

void jsonReadTaskList(struct jsonReadTaskList* t)
{
	
	// Check for invalid inputs
	if( t == 0 ) return;
	
	// Initialize
	if( !t->internal.initialized ){
		
		// Clear internals
		memset( &(t->internal), 0, sizeof(t->internal) );
		
		// Set defaults
		if( t->BufferSize == 0 ) t->BufferSize = JSON_DEFAULT_BUFFERSIZE;
		if( t->MaxIterations == 0 ) t->MaxIterations = JSON_DEFAULT_MAXITERATIONS;
		
		// Initialize buffer
		if(	datbufInitBuffer( (UDINT)&(t->internal.outputBuffer), t->BufferSize ) != 0 ){
			jsonInternalSetReadError(JSON_ERR_MEMALLOC, t);
			return;
		}
		
		t->internal.initialized = 1;
		
	} // if(!initialized)


	unsigned short appendStatus = datbufAppendToBuffer( (UDINT)&(t->internal.outputBuffer), (UDINT)&("["), 1 );
	if( appendStatus != 0 ){ jsonInternalSetReadError(appendStatus, t); return; }

	//structure to look through data objects
	MO_List_typ item;

	//Keep track of the objects that we've gone through
	UINT objectIndex = 0;
				
	BOOL added = 0;

	//Look through all the objects
	while( MO_list(objectIndex, &objectIndex, &item) == 0){
		//If it is a cyclic object check if it has the variable
		if( item.type == 0x11){

			//Add comma if we already have an item
			if( added ){
			appendStatus = datbufAppendToBuffer( (UDINT)&(t->internal.outputBuffer), (UDINT)& ",", 1);
			}
			added = 1;

			//Add the task
			size_t len = strnlen( item.name, sizeof( item.name ));
			appendStatus = datbufAppendToBuffer( (UDINT)&(t->internal.outputBuffer), (UDINT)& "'", 1);
			if( appendStatus != 0 ){ jsonInternalSetReadError(appendStatus, t); return; }
			appendStatus = datbufAppendToBuffer( (UDINT)&(t->internal.outputBuffer), (UDINT)& item.name, len );
			if( appendStatus != 0 ){ jsonInternalSetReadError(appendStatus, t); return; }
			appendStatus = datbufAppendToBuffer( (UDINT)&(t->internal.outputBuffer), (UDINT)& "'", 1);
			if( appendStatus != 0 ){ jsonInternalSetReadError(appendStatus, t); return; }
			
		}
	}

	appendStatus = datbufAppendToBuffer( (UDINT)&(t->internal.outputBuffer), (UDINT)&("]"), 1 );
	if( appendStatus != 0 ){ jsonInternalSetReadError(appendStatus, t); return; }
	
	// All done. Set outputs.
	t->Status = 0;
	t->pJSONObject = t->internal.outputBuffer.pData;
	t->JSONObjectLength = t->internal.outputBuffer.currentLength; // TODO: This probably does not include the null (like strlen(JSONObject)). Should it?
	
} // End Fn
