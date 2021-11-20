//*********************************************************************************
// Copyright:  
// Author:    dfblackburn
// Created:   December 03, 2015
//********************************************************************************

#include <bur/plctypes.h>
#ifdef __cplusplus
	extern "C"
	{
#endif

#include "omjsonInternal.h"
#include "OMJSON.h"
#include <string.h>
#include "jsonAux.h"
#include "sha1.h"

#ifdef __cplusplus
	};
#endif

//*******************************************************************
// Negotiate a new WebSocket connection								*
//*******************************************************************

void jsonWSConnect(struct jsonWSConnect* t)
{

	if (t == 0) return;
	if (t->pInputMessage == 0 || t->pOutputMessage == 0 || t->MaxOutputMessageLength < JSON_STRLEN_WSCONNECTMESSAGE+1) {
		t->Status = JSON_ERR_INVALIDINPUT;
		return;
	}
	
	// Internal variables
	char *pKey;
	STRING accept[320];
	SHA_CTX sha;
	USINT digest[20];
	
	// Get key out of receive data
	pKey = strstr((char*)t->pInputMessage, "Sec-WebSocket-Key:");
	if (pKey == 0) {
		t->Status = JSON_ERR_WS_KEYNOTFOUND;
		return;
	}
	pKey = pKey + JSON_STRLEN_WSKEYHEADER;
	pKey = skip(pKey);
	pKey = strtok(pKey, "\r\n");
	if (pKey == 0) {
		t->Status = JSON_ERR_WS_KEYNOTFOUND;
		return;
	}
	
	// Generate accept from key
	strcpy(accept, pKey); // start with key
	strcat(accept, JSON_WS_MAGICSTRING); // cat magic string
				
	// Compute SHA-1 digest
	SHAInit(&sha);
	SHAUpdate(&sha, (unsigned char*)accept, strlen(accept) );
	SHAFinal(digest, &sha);
				
	// Take base64-encoding of digest 
	memset(accept, 0, sizeof(accept)); // bug in httpEncodeBase64() requires that you clear accept first

	t->internal.encodeBase64.enable = 1;
	t->internal.encodeBase64.pSrc = (UDINT)&digest;
	t->internal.encodeBase64.srcLen = sizeof(digest);
	t->internal.encodeBase64.pDest = (UDINT)&accept;
	t->internal.encodeBase64.destSize = sizeof(accept);
				
	httpEncodeBase64(&t->internal.encodeBase64);
	
	if (t->internal.encodeBase64.status != 0) {
		t->Status = t->internal.encodeBase64.status;
		return;
	}
		
	// Have accept. Generate response.
	strcpy((char*)t->pOutputMessage, "HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ");
	strcat((char*)t->pOutputMessage, accept);
	strcat((char*)t->pOutputMessage, "\r\n\r\n");
				
	t->OutputMessageLength= strlen((char*)t->pOutputMessage);
	t->Status = 0;
	
} // End Fn
