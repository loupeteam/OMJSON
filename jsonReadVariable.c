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

void jsonReadVariable(struct jsonReadVariable* t)
{
	
	// Check for invalid inputs
	if( t == 0 ) return;
	
	if( (t->pVariableName == 0) || (t->pCache == 0) ){
		jsonInternalSetReadError(JSON_ERR_INVALIDINPUT, t);
		return;
	}
	
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

	// Check pVariableName for quotes, special characters, and empty string
	char*	pChar;
	STRING	varName[VAR_STRLEN_NAME + 1],
			tempVarName[VAR_STRLEN_NAME + 1];
	memset(&varName, 0, sizeof(varName));
	memset(&tempVarName, 0, sizeof(tempVarName));

	pChar = (char*)t->pVariableName;
	pChar = skip(pChar);
	if( *pChar == '\"' ){
		parse_string(tempVarName, pChar, sizeof(tempVarName) - 1);
	}
	else{
		strncpy(tempVarName, pChar, sizeof(tempVarName) - 1);
	}
	
	stringify_string(varName, tempVarName, sizeof(varName) - 1, 0);

	if (strcmp(varName, "") == 0) {
		t->Status = 0;
		t->pJSONObject = (UDINT)&("{}");
		t->JSONObjectLength = 2;
		return;
	}

	// Find varName in cache
	jsonCache_typ* pCache = (jsonCache_typ*)(t->pCache);
	UDINT i = 0;
	DINT iVariable = -1;
		
	for( i = 0; i < pCache->iVariable; i++ ){
		if( strcmp( varName, pCache->variable[i].name ) == 0 ) iVariable = i;
	} // search cache
	
	// If variable is not in cache, add it
	if( iVariable == -1 ){
	
		t->internal.addVariableToCache.pVariableName = (UDINT)&varName;
		t->internal.addVariableToCache.pCache = t->pCache;
		t->internal.addVariableToCache.MaxIterations = t->MaxIterations;
		
		jsonAddVariableToCache(&t->internal.addVariableToCache);
		
		if( t->internal.addVariableToCache.Status == 0 ){ 
			iVariable = t->internal.addVariableToCache.iVariable;
		}
		else{
			// for now, be stupid and just clear the cache 
			memset( (jsonCache_typ*)t->pCache, 0, sizeof(jsonCache_typ) );
			jsonInternalSetReadError(t->internal.addVariableToCache.Status, t); 
			return; 
		}
		
	} // variable not found in cache
	
	// Clear buffer
	UINT clearStatus = datbufClearBuffer( (UDINT)&(t->internal.outputBuffer) );
	if( clearStatus != 0 ){ jsonInternalSetReadError(clearStatus, t); return; }
		
	// Open up object with a '{'
	UINT appendStatus = datbufAppendToBuffer( (UDINT)&(t->internal.outputBuffer), (UDINT)&("{"), 1 );
	if( appendStatus != 0 ){ jsonInternalSetReadError(appendStatus, t); return; }
	
	// Read the variable from the cache
	for( i = pCache->variable[iVariable].iStart; i <= pCache->variable[iVariable].iEnd; i++ ){
		
		// Check i
		if( i > JSON_MAI_CACHEITEM ){ jsonInternalSetReadError(JSON_ERR_CACHEFULLITEMS, t); return; }
		
		// Append prefix
		appendStatus = datbufAppendToBuffer( (UDINT)&(t->internal.outputBuffer), 
			(UDINT)&(pCache->item[i].prefix), 
			strlen(pCache->item[i].prefix) );
		
		// Get value
//		UINT valueStatus = varGetValue( (UDINT)&(pCache->item[i].variable) );
//		if( valueStatus != 0 ){ jsonInternalSetReadError(valueStatus, t); return; }
		varGetValue((UDINT)&(pCache->item[i].variable));
		
		// Append value
		switch (pCache->item[i].variable.dataType) {
		
			case VAR_TYPE_STRING:
				{
					// Stringify - Do not use variable.value. It is limited to 120 characters, which is not enough
					// for strings.
					// TODO: This can cause a stack overflow if variable.length is very large.
					//		Maybe add a max size
					STRING tempString[pCache->item[i].variable.length + 50];
					char* reentry;
					stringify_string(tempString, (char*)pCache->item[i].variable.address, sizeof(tempString) - 1, &reentry);
			
					// Append ""tempString""
					appendStatus = datbufAppendToBuffer((UDINT)&(t->internal.outputBuffer), (UDINT)&("\""), 1);
					appendStatus = datbufAppendToBuffer((UDINT)&(t->internal.outputBuffer), (UDINT)&tempString, strlen(tempString));
					if(reentry != 0) {
						stringify_string(tempString, reentry, sizeof(tempString) - 1, &reentry);
						appendStatus = datbufAppendToBuffer((UDINT)&(t->internal.outputBuffer), (UDINT)&tempString, strlen(tempString));
					}
					appendStatus = datbufAppendToBuffer((UDINT)&(t->internal.outputBuffer), (UDINT)&("\""), 1);
					
				}
				break;
			
			case VAR_TYPE_WSTRING:
				{
					// Stringify - Do not use variable.value. It is limited to 120 characters, which is not enough
					// for strings.
					// TODO: This can cause a stack overflow if variable.length is very large.
					//		Maybe add a max size
					char tempString[pCache->item[i].variable.length + 50]; 
					// NOTE: Because length is in bytes, tempString will contain 2x the number of characters
					// We can change this to length/2 but if we do support UTF-8 in the future this will need to be just length
					// This is because WSTRING to UTF-8 may result in the same number of characters
					WSTRING* reentry;
					stringify_wstring(tempString, (UINT*)pCache->item[i].variable.address, sizeof(tempString) - 1, &reentry);
			
					// Append ""tempString""
					appendStatus = datbufAppendToBuffer((UDINT)&(t->internal.outputBuffer), (UDINT)&("\""), 1);
					appendStatus = datbufAppendToBuffer((UDINT)&(t->internal.outputBuffer), (UDINT)&tempString, strlen(tempString));
					if(reentry != 0) {
						stringify_wstring(tempString, reentry, sizeof(tempString) - 1, &reentry);
						appendStatus = datbufAppendToBuffer((UDINT)&(t->internal.outputBuffer), (UDINT)&tempString, strlen(tempString));
					}
					appendStatus = datbufAppendToBuffer((UDINT)&(t->internal.outputBuffer), (UDINT)&("\""), 1);
					
				}
				break;
				
			case VAR_TYPE_REAL:
			case VAR_TYPE_LREAL:
				{
					// TODO: Test this for performance
					REAL value;
					
					if (pCache->item[i].variable.dataType == VAR_TYPE_LREAL) {
						value = (REAL)*(LREAL*)(pCache->item[i].variable.address);
					}
					else {
						value = *(REAL*)(pCache->item[i].variable.address);
					}
					
					if (isnan(value)) {
				
						// Append ""NaN""
						appendStatus = datbufAppendToBuffer((UDINT)&(t->internal.outputBuffer), (UDINT)&("\"NaN\""), 5); // 5 = strlen("\"NaN\"")
				
					} else if (isinf(value)) {
				
						if (value > 0) {
							// Append ""Infinity""
							appendStatus = datbufAppendToBuffer((UDINT)&(t->internal.outputBuffer), (UDINT)&("\"Infinity\""), 10); // 10 = strlen("\"Infinity\"")
						} else {
							// Append ""-Infinity""
							appendStatus = datbufAppendToBuffer((UDINT)&(t->internal.outputBuffer), (UDINT)&("\"-Infinity\""), 11); // 11 = strlen("\"-Infinity\"")
						}
				
					} else {
				
						// Append value
						appendStatus = datbufAppendToBuffer((UDINT)&(t->internal.outputBuffer), (UDINT)&(pCache->item[i].variable.value), strlen(pCache->item[i].variable.value));
				
					}
				}
				break;
			
			
			case VAR_TYPE_UNDEFINED:
				
				// Append ""undefined""
				appendStatus = datbufAppendToBuffer((UDINT)&(t->internal.outputBuffer), (UDINT)&("\"undefined\""), 11); // 11 = strlen("\"undefined\"")
			
				break;
			
			default:
			
				if(pCache->item[i].variable.value[0] != '\0') {
					// Append value
					appendStatus = datbufAppendToBuffer((UDINT)&(t->internal.outputBuffer), (UDINT)&(pCache->item[i].variable.value), strlen(pCache->item[i].variable.value));
				}
				else {
					// Type or value is not supported
					// We need to provide something to be valid json
					// Append dummy value: ""undefined""
					appendStatus = datbufAppendToBuffer((UDINT)&(t->internal.outputBuffer), (UDINT)&("\"undefined\""), 11); // 11 = strlen("\"undefined\"")
				}
				break;
				
		} // switch(dataType)
				
		
//		if (pCache->item[i].variable.dataType == VAR_TYPE_STRING) {
//	
//			// Stringify - Do not use variable.value. It is limited to 120 characters, which is not enough
//			// for strings.
//			STRING tempString[pCache->item[i].variable.length];
//			stringify_string(tempString, (char*)pCache->item[i].variable.address);
//			
//			// Append ""tempString""
//			appendStatus = datbufAppendToBuffer( (UDINT)&(t->internal.outputBuffer), (UDINT)&("\""), 1 );
//			appendStatus = datbufAppendToBuffer( (UDINT)&(t->internal.outputBuffer), (UDINT)&tempString, strlen(tempString) );
//			appendStatus = datbufAppendToBuffer( (UDINT)&(t->internal.outputBuffer), (UDINT)&("\""), 1 );
//	
//		} else if (pCache->item[i].variable.dataType == VAR_TYPE_REAL) {
//
//		} else if (pCache->item[i].variable.dataType == VAR_TYPE_LREAL) {
//
//		} else if (pCache->item[i].variable.dataType == VAR_TYPE_UNDEFINED) {
//			
//			// Option: Append ""undefined""
//			appendStatus = datbufAppendToBuffer( (UDINT)&(t->internal.outputBuffer), 
//				(UDINT)&("\"undefined\""), 
//				11 ); // 11 = strlen("\"undefined\"")
//			
//			// Option: Append "null"
////			appendStatus = datbufAppendToBuffer( (UDINT)&(t->internal.outputBuffer), 
////				(UDINT)&("null"), 
////				4 ); // 4 = strlen("null")
//			
//		} else {
//			
//			// Append "value"
//			appendStatus = datbufAppendToBuffer( (UDINT)&(t->internal.outputBuffer), 
//				(UDINT)&(pCache->item[i].variable.value), 
//				strlen(pCache->item[i].variable.value) );
//		
//		}
		
		// Append suffix
		appendStatus = datbufAppendToBuffer( (UDINT)&(t->internal.outputBuffer), 
			(UDINT)&(pCache->item[i].suffix), 
			strlen(pCache->item[i].suffix) );
		
		if( appendStatus != 0 ){ jsonInternalSetReadError(appendStatus, t); return; }

	} // loop through cache

	// Close up object with a '}'
	appendStatus = datbufAppendToBuffer( (UDINT)&(t->internal.outputBuffer), (UDINT)&("}"), 1 );
	if( appendStatus != 0 ){ jsonInternalSetReadError(appendStatus, t); return; }
	
	// All done. Set outputs.
	t->Status = 0;
	t->pJSONObject = t->internal.outputBuffer.pData;
	t->JSONObjectLength = t->internal.outputBuffer.currentLength; // TODO: This probably does not include the null (like strlen(JSONObject)). Should it?
	
} // End Fn
