//*********************************************************************************
// Copyright:  
// Author:    dfblackburn
// Created:   December 04, 2015
//********************************************************************************

#include <bur/plctypes.h>
#ifdef __cplusplus
	extern "C"
	{
#endif

#include "OMJSON.h"
#include <string.h>
#include "jsonAux.h"
#include "sha1.h"

#ifdef __cplusplus
	};
#endif

//*******************************************************************
// Decode a WebSocket frame											*
//*******************************************************************

void jsonWSDecode(struct jsonWSDecode* t)
{
	
	if (t == 0) return;
	if (t->pFrame == 0) {
		t->Status = JSON_ERR_INVALIDINPUT;
		return;
	}
	
	// Get local copy of pFrame
	USINT *pFrame = (USINT*)t->pFrame;
			
	// FIN, RSV, opcode
	t->FIN = (*pFrame & 0x80) >> 7;
	t->RSV = (*pFrame & 0x70) >> 4;
	t->OpCode = (*pFrame & 0x0f);

	pFrame++;
			
	// Mask
	t->MASK = (*pFrame & 0x80) >> 7;
			
	// Payload Length
	unsigned long long ulPayloadLength = 0;
	UINT uiPayloadLength = 0;
	USINT usPayloadLength = (*pFrame & 0x7f);
	USINT i;
			
	if( usPayloadLength == 127 ){
		// 8 byte extended payload length
		// byte swap!
		pFrame++;
		for(i=0; i<8; i++){
			memcpy((USINT*)&ulPayloadLength + (7-i), pFrame + i, 1);
		}
		if (ulPayloadLength > VAR_MAX_UDINT) {
			t->Status = JSON_ERR_WS_PAYLOADLENGTH;
			return;
		}
		t->PayloadLength = (UDINT)ulPayloadLength;
		pFrame += 8;
	}
	else if( usPayloadLength == 126 ){
		// 2 byte extended payload length
		// byte swap!
		pFrame++;
		for(i=0; i<2; i++){
			memcpy((USINT*)&uiPayloadLength + (1-i), pFrame + i, 1);
		}
		t->PayloadLength = (UDINT)uiPayloadLength;
		pFrame += 2;
	}
	else{
		// no extended payload length
		pFrame++;
		t->PayloadLength = (UDINT)usPayloadLength;
	}
			
	// Masking key
	memcpy(&(t->MaskingKey[0]), pFrame, 4);
	pFrame += 4;
			
	// pPayload data
	t->pPayloadData = (UDINT)pFrame;
	
	// Header length
	t->HeaderLength = t->pPayloadData - t->pFrame;
	
	// Frame length
	t->FrameLength = t->HeaderLength + t->PayloadLength;
	
	t->Status = 0;
	
} // End Fn
