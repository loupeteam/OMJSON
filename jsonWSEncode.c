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
// Encode data into a WebSocket frame 								*
//*******************************************************************

void jsonWSEncode(struct jsonWSEncode* t)
{

	if (t == 0) return;
	if (t->pFrame == 0) {
		t->Status = JSON_ERR_INVALIDINPUT;
		return;
	}
		
	// Get local copy of pFrame
	USINT *pFrame = (USINT*)t->pFrame;
	
	// FIN, RSV, opcode
	if ( (t->RSV > 7) || (t->OpCode > 15) ) {
		t->Status = JSON_ERR_INVALIDINPUT;
		return;
	}

	*pFrame = ((USINT)t->FIN)*128 + t->RSV*64 + t->OpCode;
	pFrame++;
			
	// MASK NOT SUPPORTED
	if ( t->MASK ) {
		t->Status = JSON_ERR_INVALIDINPUT;
		return;
	}

	// Payload Length
	USINT i;
	
	if (t->PayloadLength < 126) {
		*pFrame = (USINT)t->PayloadLength; // MASK = 0, payload len  = payloadLength
		pFrame++;
	} else if (t->PayloadLength < 65536) {
		*pFrame = 126; // MASK = 0, payload len  = 126, use 2 byte extended payload length
		pFrame++;
		// byte swap
		for(i=0; i<2; i++){
			memcpy(pFrame + i, (USINT*)&t->PayloadLength + (1-i), 1);
		}
		pFrame += 2;
	} else {
		*pFrame = 127; // MASK = 0, payload len  = 127, use 8 byte extended payload length
		pFrame++;
				
		// Clear top 4 bytes then byte swap
		memset(pFrame, 0, 4);
		pFrame += 4;
				
		for(i=0; i<4; i++){
			memcpy(pFrame + i, (USINT*)&t->PayloadLength + (3-i), 1);
		}
		pFrame += 4;		
	}
	
	// MaskingKey NOT SUPPORTED
	
	// Payload
	t->FrameLength = ((UDINT)pFrame - t->pFrame) + t->PayloadLength;
	
	if (t->FrameLength <= t->MaxFrameLength) {
		memcpy(pFrame, (char*)t->pPayloadData, t->PayloadLength);
		t->Status = 0;
	} else {
		t->Status = JSON_ERR_WS_PAYLOADLENGTH;
		return;
	}
	
} // End Fn
