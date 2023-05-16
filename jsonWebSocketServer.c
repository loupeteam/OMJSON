/********************************************************************
 * COPYRIGHT --  
 ********************************************************************
 * Library: OMJSON
 * File: jsonWebSocketServer.c
 * Author: dfblackburn
 * Created: June 04, 2015
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
#include "jsonAux.h"
#include "sha1.h"
#include "jsonInternal.h"

#ifdef __cplusplus
	};
#endif

//*******************************************************************
// Serve variables via JSON and WebSockets 							*
//*******************************************************************

void jsonWebSocketServer(struct jsonWebSocketServer* t)
{

	if (t == 0) return;

	// Acknowledge errors
	//--------------------

	if (t->AcknowledgeError) {
		t->AcknowledgeError = 0;
		t->Error = 0;
		t->ErrorID = 0;
		memset( &(t->ErrorString), 0, sizeof(t->ErrorString) );
	}
	
	// Initialize
	//------------

	if (!t->internal.initialized) {
	
		if (t->Error) {
	
			return;
	
		} else {
		
			// Clear internals
			memset( &(t->internal), 0, sizeof(t->internal) );
		
			// Check max clients input
			if(t->maxClients > JSON_MAX_CLIENTS) {
				t->maxClients = JSON_MAX_CLIENTS;
				jsonInternalSetWSServerError(JSON_ERR_WS_INVALID_MAX_CLIENTS, t);
			}
			else if(t->maxClients == 0) {
				t->maxClients = 1;
			}
			
			t->internal.maxClients = t->maxClients; // This should be written in the initialization becuse we alloc based on this
			
			// Check defaults
			if (t->ServerPort == 0) t->ServerPort = JSON_DEFAULT_SERVERPORT;
			if (t->BufferSize == 0) t->BufferSize = JSON_DEFAULT_BUFFERSIZE;
			if (t->MaxIterations == 0) t->MaxIterations = JSON_DEFAULT_MAXITERATIONS;
			
			unsigned int index;
			for (index = 0; index < t->internal.maxClients; index++) {
				// Allocate send and receive memory and initialize message buffer
				if (	(TMP_alloc( t->BufferSize, (void**)&(t->internal.client[index].pReceiveData) ) != 0)				
					||	(TMP_alloc( t->BufferSize, (void**)&(t->internal.client[index].pSendData) ) != 0)				
					||	(datbufInitBuffer( (UDINT)&(t->internal.client[index].messageBuffer), t->BufferSize ) != 0)
				) {
					jsonInternalSetWSServerError( JSON_ERR_MEMALLOC, t );
					return;
				}
			}
			
			// TODO: Clear buffers on init
			
			// Set up tcpServer
			t->internal.tcpServer.IN.CFG.Mode = TCPCOMM_MODE_SERVER;
			strcpy(t->internal.tcpServer.IN.CFG.LocalIPAddress, t->ServerIP);
			t->internal.tcpServer.IN.CFG.LocalPort = t->ServerPort;
			t->internal.tcpServer.IN.CFG.SendBufferSize = t->BufferSize;

			t->internal.tcpServer.IN.CMD.Enable = 1;
			
			t->internal.initialized = 1;
		
			// Presumably this is run in the init, so register the license
			jsonInternalLicenseIsOk();
			
			// NOTE: I don't think you have to return here...
			return;
		
		} // !error

	} // if(!initialized)


	// Check license
	//---------------

	// Do not allow anything for now
	if (!jsonInternalLicenseIsOk()) {
		jsonInternalSetWSServerError(JSON_ERR_NO_LICENSE, t);
		return;
	}


	// Manage TCP server
	//-------------------

	TCPManageConnection(&t->internal.tcpServer);

	if (t->internal.tcpServer.OUT.NewConnectionAvailable) {
		
		t->internal.tcpServer.IN.CMD.AcknowledgeConnection = 1;
		
		unsigned int index;
		// Find the first inactive client
		for (index = 0; index < t->internal.maxClients; index++) {
			if(t->internal.client[index].tcpStream.OUT.Active != 1) {
				t->internal.iClient = index;
				break;
			}
		}
		// index will == maxClients if for loop does not hit the break statment
		// Indicating that no inactive client was found
		if(index == t->internal.maxClients) {
			jsonInternalSetWSServerError(JSON_ERR_WS_MAX_CLIENTS, t);
		}
		else {
			memcpy(&t->internal.client[t->internal.iClient].tcpStream.IN.PAR.Connection, &t->internal.tcpServer.OUT.Connection, sizeof(t->internal.tcpServer.OUT.Connection));
		
			t->internal.client[t->internal.iClient].tcpStream.IN.PAR.AllowContinuousSend = 1; // TODO: Think about this. If you set it to 0, then you cannot handle back to back client requests.
			t->internal.client[t->internal.iClient].tcpStream.IN.PAR.SendFlags = 0;
			t->internal.client[t->internal.iClient].tcpStream.IN.PAR.pSendData = t->internal.client[t->internal.iClient].pSendData;
		
			t->internal.client[t->internal.iClient].tcpStream.IN.PAR.AllowContinuousReceive = 1;	// NOTE: This probably warrants thought, but 1 seems to work better than 0.
			t->internal.client[t->internal.iClient].tcpStream.IN.PAR.ReceiveFlags = 0;
			t->internal.client[t->internal.iClient].tcpStream.IN.PAR.pReceiveData = t->internal.client[t->internal.iClient].pReceiveData;
			t->internal.client[t->internal.iClient].tcpStream.IN.PAR.MaxReceiveLength = t->BufferSize;
		
			t->internal.client[t->internal.iClient].tcpStream.IN.CMD.Receive = 1;
		
			t->internal.client[t->internal.iClient].wsConnected = 0;
			
			// Clear cache
			t->internal.client[t->internal.iClient].pCache = &(((jsonCache_typ*)t->pCacheArray)[t->internal.iClient]);
			t->internal.client[t->internal.iClient].pCache->iItem = 0; // Lazy clear cache
			t->internal.client[t->internal.iClient].pCache->iVariable = 0; // NOTE: we may also want to memeset items and vars to 0
		
			t->internal.client[t->internal.iClient].debug.socketConnectCount++;
		
			strcpy(t->ClientInfo[t->internal.iClient].ClientIP, t->internal.tcpServer.OUT.Connection.IPAddress);
			t->ClientInfo[t->internal.iClient].ClientPort = t->internal.tcpServer.OUT.Connection.Port;
		}
	}


	// Manage WebSocket
	//------------------
	t->internal.connectedClients = 0;
	
	unsigned int index;
	for (index = 0; index < t->internal.maxClients; index++) {
		// Set iClient to index here to keep it up to date
		// We want to be able to access this deeper in reading / replying to messages
		// So make sure this stays near the top
		t->internal.iClient = index;

		// Start timer by default. It is reset when a request is properly processed.
		t->internal.client[index].requestTimer.IN = 1;
		
		if(t->internal.client[index].tcpStream.OUT.Active) t->internal.connectedClients++;
		
		t->internal.client[index].debug.oldDataReceived = t->internal.client[index].tcpStream.OUT.DataReceived;
	
		TCPStreamReceive(&t->internal.client[index].tcpStream);
	
		if (t->internal.client[index].debug.oldDataReceived && t->internal.client[index].tcpStream.OUT.DataReceived) {
			// Break here to figure out what happens
			t->internal.client[index].debug.doubleDataCount++;
		}
		
		// Check for client disconnected
		if (t->internal.client[index].tcpStream.OUT.Error && t->internal.client[index].tcpStream.OUT.ErrorID == tcpERR_NOT_CONNECTED) {
	
			t->internal.client[index].tcpStream.IN.CMD.Receive = 0;
			t->internal.client[index].tcpStream.IN.CMD.Close = 1;
			t->internal.client[index].tcpStream.IN.CMD.AcknowledgeError = 1;
	
			t->internal.client[index].wsConnected = 0;
			t->internal.client[index].debug.socketDisconnectCountError++;
	
		}
		else if (t->internal.client[index].tcpStream.OUT.Error && t->internal.client[index].tcpStream.OUT.ErrorID == tcpERR_INVALID_IDENT) {
			
			t->internal.client[index].tcpStream.IN.CMD.Receive = 0;
			t->internal.client[index].tcpStream.IN.CMD.Close = 1;
			t->internal.client[index].tcpStream.IN.CMD.AcknowledgeError = 1;
	
			t->internal.client[index].wsConnected = 0;
			t->internal.client[index].debug.socketInvalidCountError++;
			
		}
		else if (t->internal.client[index].tcpStream.OUT.Error && t->internal.client[index].tcpStream.OUT.ErrorID == tcpERR_PARAMETER) {
			// This is an internal problem
			// Probably will require a reboot or code changes 
			t->internal.client[index].tcpStream.IN.CMD.Receive = 0;
			t->internal.client[index].tcpStream.IN.CMD.Close = 1;
			t->internal.client[index].tcpStream.IN.CMD.AcknowledgeError = 1;
	
			t->internal.client[index].wsConnected = 0;
			
			jsonInternalSetWSServerError(JSON_ERR_HUH, t);
		}
	
		// Note: I dont know the original intent of this but seems wrong
//		if (t->internal.client[index].tcpStream.Internal.debug.receive.status[0] == tcpERR_NO_DATA) {
//			t->internal.client[index].debug.noDataCount++;
//		}
	
		// NOTE: Might not need to check for sending. 
		// Think about what happens if you are sending one thing and it gets interrupted by a new request
		// TODO: This is probably causing problems. When did this get changed?
		// The !sending check looks like it has always been there.
		// The only checking for received does not appear to be committed anywhere without being commented out.
		//	if (t->internal.client[index].tcpStream.OUT.DataReceived && !t->internal.client[index].tcpStream.OUT.Sending) {
		if (t->internal.client[index].tcpStream.OUT.DataReceived) {
		
			t->internal.client[index].debug.dataCount++;
		
			if (t->internal.client[index].tcpStream.OUT.ReceivedDataLength == 0) {
		
				t->internal.client[index].tcpStream.IN.CMD.Receive = 0;
				t->internal.client[index].tcpStream.IN.CMD.Close = 1;
		
				t->internal.client[index].wsConnected = 0;
				t->internal.client[index].debug.socketDisconnectCountRecvLength0++;
		
				continue;
		
			}
		
			t->internal.client[index].tcpStream.IN.CMD.AcknowledgeData = 1;
		
			// Check for connection attempt
			BOOL shouldConnect = 0;
		
			// Option 1: Check entire receive data with a strstr() for "Sec-WebSocket-Key:"
			// This could be slow for very large receive data lengths
			// Receive length for HTTP request to open websocket from Chrome is 486 bytes
			// Small websocket request receive length is < 100 bytes
			//shouldConnect = (strstr((char*)t->internal.client[index].tcpStream.IN.PAR.pReceiveData, "Sec-WebSocket-Key:") != 0);

			// Option 2: Copy first 500 bytes and check with a strstr() for "Sec-WebSocket-Key:"
			// This could be faster for very large receive data lengths
			//STRING messageBeginning[500+1];
			//memset(&messageBeginning, 0, sizeof(messageBeginning));
			//memcpy(&messageBeginning, (char*)t->internal.client[index].tcpStream.IN.PAR.pReceiveData, sizeof(messageBeginning)-1);
			//shouldConnect = (strstr(messageBeginning, "Sec-WebSocket-Key:") != 0);
		
			// Option 3: Check first 3 bytes for GET
			// This should be the fastest for small and large receive lengths
			// Could break down with weirdly formatted request (shouldn't happen)
			shouldConnect = (memcmp((char*)t->internal.client[index].pReceiveData, "GET", 3) == 0);
			
			if (shouldConnect) {
			
				// Establish WebSocket connection
				t->internal.client[index].wsConnect.pInputMessage = t->internal.client[index].pReceiveData;
				t->internal.client[index].wsConnect.pOutputMessage = t->internal.client[index].pSendData;
				t->internal.client[index].wsConnect.MaxOutputMessageLength = t->BufferSize;
				jsonWSConnect(&t->internal.client[index].wsConnect);
			
				if (t->internal.client[index].wsConnect.Status == 0) {
					t->internal.client[index].tcpStream.IN.PAR.SendLength = t->internal.client[index].wsConnect.OutputMessageLength;
					t->internal.client[index].tcpStream.IN.CMD.Send = 1;
					t->internal.client[index].wsConnected = 1;
					t->internal.client[index].debug.websocketConnectCount++;
				} else {
					jsonInternalSetWSServerError(t->internal.client[index].wsConnect.Status, t);
				}
				
				t->internal.client[index].requestTimer.IN = 0;
			
			}
			else /*if (t->internal.client[index].wsConnected)*/ {
			
				// NOTE: Sometimes wsConnected doesn't work properly.
				// This is particularly noticeable with large read requests that 
				// might be received in more than one TCP frame (packet? datagram?).
				// Removing the check here will assume that the received data is
				// a websocket frame. This should be OK.
			
				// Parse request - 
				// see https://tools.ietf.org/html/rfc6455 
				// for the WebSocket specification
				//--------------------------------------------
		
				// NOTE: A lot of things cause the parsing to bonk with no response to the client[index].
				// We might want to generate an error response to the client instead.
			
				// Decode frame
				t->internal.client[index].wsDecode.pFrame = t->internal.client[index].tcpStream.IN.PAR.pReceiveData;
				jsonWSDecode(&t->internal.client[index].wsDecode);
			
				// Check frame
				// NOTE: For now, set some errors if we get an unexpected frame
				// Might need to replace these with an error response to the client
				if (t->internal.client[index].wsDecode.Status != 0) { jsonInternalSetWSServerError(t->internal.client[index].wsDecode.Status, t); continue; }
				if (t->internal.client[index].wsDecode.FIN == 0) { jsonInternalSetWSServerError(JSON_ERR_WS_FRAGMENT, t); continue; }
				if (t->internal.client[index].wsDecode.RSV != 0) { jsonInternalSetWSServerError(JSON_ERR_WS_RSV, t); continue; }
				if (t->internal.client[index].wsDecode.OpCode != JSON_WS_OPCODE_TEXT && t->internal.client[index].wsDecode.OpCode != JSON_WS_OPCODE_CLOSE) { jsonInternalSetWSServerError(JSON_ERR_WS_OPCODE, t); continue; } // TODO: Handle other opcode 
				if (t->internal.client[index].wsDecode.MASK == 0) { jsonInternalSetWSServerError(JSON_ERR_WS_MASK, t); t->internal.client[index].tcpStream.IN.CMD.Close = 1; continue; }

				// Check for close frame
				if (t->internal.client[index].wsDecode.OpCode == JSON_WS_OPCODE_CLOSE) {
					t->internal.client[index].tcpStream.IN.CMD.Receive = 0;
					t->internal.client[index].tcpStream.IN.CMD.Close = 1;
					t->internal.client[index].wsConnected = 0;
					t->internal.client[index].debug.socketDisconnectCountOpcode++;
					continue;
				}
				
				// Check WS frame length against received TCP message length
				t->internal.client[index].excessDataLength = t->internal.client[index].tcpStream.OUT.ReceivedDataLength - t->internal.client[index].wsDecode.FrameLength;
			
				if (t->internal.client[index].excessDataLength == 0) {
		
					t->internal.client[index].debug.justRightCount++;
		
				} else if (t->internal.client[index].excessDataLength > 0) {
		
					t->internal.client[index].debug.tooBigCount++;
		
				} else {
		
					t->internal.client[index].debug.tooSmallCount++;
					jsonInternalSetWSServerError(JSON_ERR_TCP_FRAGMENT, t);
					continue;			
		
				}
			
			
				//			if (t->internal.client[index].wsDecode.PayloadLength != 
				//				t->internal.client[index].tcpStream.OUT.ReceivedDataLength - 
				//				(t->internal.client[index].wsDecode.pPayloadData - t->internal.client[index].wsDecode.pFrame)) {
				//			
				//				jsonInternalSetWSServerError(JSON_ERR_TCP_FRAGMENT, t);
				//				continue;
				//			
				//			}

				// Unmask data - NOTE: Make this a public FUB
				UDINT i;
				char *pPayloadData = (char*)t->internal.client[index].wsDecode.pPayloadData;
				for (i = 0; i < t->internal.client[index].wsDecode.PayloadLength; i++) {
					pPayloadData[i] = pPayloadData[i] ^ t->internal.client[index].wsDecode.MaskingKey[i % 4];
				}

				// Parse data - NOTE: Make this a private function
				// Expect {"type":"read"|"write","data":["varName","varName"]|{}}
				// Need type in one string and pointer to data string
				char *pMessageData = (char*)t->internal.client[index].wsDecode.pPayloadData;
				STRING requestType[7+1], data[4+1];
			
				// {
				pMessageData = skip(pMessageData);
				if (*pMessageData != '{') { jsonInternalSetWSServerError(JSON_ERR_PARSE, t); continue; }
				pMessageData++;
			
				// "type"
				pMessageData = skip(pMessageData);
				pMessageData = parse_string(requestType, pMessageData, sizeof(requestType) - 1);
				if (pMessageData == 0) {
					jsonInternalSetWSServerError(JSON_ERR_PARSE, t);
					continue;	
				}
			
				// :
				pMessageData = skip(pMessageData);
				if (*pMessageData != ':') { jsonInternalSetWSServerError(JSON_ERR_PARSE, t); continue; }
				pMessageData++;
			
				// "read" | "write"
				pMessageData = skip(pMessageData);
				pMessageData = parse_string(requestType, pMessageData, sizeof(requestType) - 1);
				if (pMessageData == 0) {
					jsonInternalSetWSServerError(JSON_ERR_PARSE, t);
					continue;
				}
			
				// NOTE: Instead of looking for a comma and then data, just search for 'data' with a strstr or something like that
				// Then we can ignore 'improper' messages that have extra data in them
				// ,
				pMessageData = skip(pMessageData);
				if (*pMessageData != ',') { jsonInternalSetWSServerError(JSON_ERR_PARSE, t); continue; }
				pMessageData++;
			
				// "data"
				pMessageData = skip(pMessageData);
				pMessageData = parse_string(data, pMessageData, sizeof(data) - 1);
				if (pMessageData == 0) {
					jsonInternalSetWSServerError(JSON_ERR_PARSE, t);
					continue;
				}
			
				// :
				pMessageData = skip(pMessageData);
				if (*pMessageData != ':') { jsonInternalSetWSServerError(JSON_ERR_PARSE, t); continue; }
				pMessageData++;
			
				// pMessageData now points to the message data, but there is one extra } on the end to account for
			
				// Determine data length
				// Data length = total payload length - message beginning length '{type...' - message ending length '}'
				UDINT dataLength = t->internal.client[index].wsDecode.PayloadLength - ((UDINT)pMessageData - (UDINT)pPayloadData) - 1;
			
				// Replace ending '}' with a null.
				pMessageData[dataLength] = 0;
			
				// Now pMessageData has the message data without the terminating '}'
				// This can be put into the jsonRead or jsonWrite functions
			
				//UDINT debugDataLength = strlen(pMessageData);
			
			
				// Process request - NOTE: Make this a private function
				//--------------------------------------------
			
				STRING responseType[13+1];
				char *pResponseData;
				UDINT responseDataLength;
			
				// Only check first character of requestType for speed
				// NOTE: This might be silly...
				if (requestType[0] == 'r') {
				
					// Read
					t->internal.client[index].readVariableList.pVariableList = (UDINT)pMessageData;
					t->internal.client[index].readVariableList.pCache = (UDINT)t->internal.client[index].pCache;
					t->internal.client[index].readVariableList.BufferSize = t->BufferSize;
					t->internal.client[index].readVariableList.MaxIterations = t->MaxIterations;
				
					jsonReadVariableList(&t->internal.client[index].readVariableList);
				
					if (t->internal.client[index].readVariableList.Status != 0) { jsonInternalSetWSServerError(t->internal.client[index].readVariableList.Status, t); continue; }
				
					strcpy(responseType, "readresponse");
					pResponseData = (char*)t->internal.client[index].readVariableList.pJSONObject;
					responseDataLength = t->internal.client[index].readVariableList.JSONObjectLength;
				
				} else if (requestType[0] == 'w') {
				
					// Write
					t->internal.client[index].writeVariable.pJSONObject = (UDINT)pMessageData;
					t->internal.client[index].writeVariable.MaxJSONObjectLength = t->BufferSize;
					t->internal.client[index].writeVariable.MaxIterations = t->MaxIterations;
				
					jsonWriteVariable(&t->internal.client[index].writeVariable);
				
					if (t->internal.client[index].writeVariable.Status != 0) { jsonInternalSetWSServerError(t->internal.client[index].writeVariable.Status, t); continue; }
				
					strcpy(responseType, "writeresponse");
					pResponseData = pMessageData; // NOTE: This echoes the received data. Might want to do something different later.
					responseDataLength = dataLength;
				
				} else {
				
					// BONK! NOTE: Do something better here.
					jsonInternalSetWSServerError(JSON_ERR_PARSE, t);
					continue;
				
				}
			
			
				// Generate response - NOTE: Maybe make this a private function
				//--------------------------------------------
			
				memset((void*)t->internal.client[index].pSendData, 0, t->BufferSize);
			
				// Generate message
				UINT clearStatus, appendStatus;

				clearStatus = datbufClearBuffer( (UDINT)&(t->internal.client[index].messageBuffer) );
				if( clearStatus != 0 ){ jsonInternalSetWSServerError(clearStatus, t); continue; }
			
				appendStatus = datbufAppendToBuffer( (UDINT)&t->internal.client[index].messageBuffer, (UDINT)&"{\"type\":\"", 9);
				appendStatus = datbufAppendToBuffer( (UDINT)&t->internal.client[index].messageBuffer, (UDINT)&responseType, strlen(responseType)); // NOTE: Here are the things that are put in the message
				appendStatus = datbufAppendToBuffer( (UDINT)&t->internal.client[index].messageBuffer, (UDINT)&"\",\"data\":", 9);
				appendStatus = datbufAppendToBuffer( (UDINT)&t->internal.client[index].messageBuffer, (UDINT)pResponseData, responseDataLength);
				appendStatus = datbufAppendToBuffer( (UDINT)&t->internal.client[index].messageBuffer, (UDINT)&"}", 1);
				if( appendStatus != 0 ){ jsonInternalSetWSServerError(appendStatus, t); continue; }
			
				// Encode frame
				t->internal.client[index].wsEncode.pFrame = t->internal.client[index].pSendData;
				t->internal.client[index].wsEncode.MaxFrameLength = t->BufferSize;
				t->internal.client[index].wsEncode.FIN = 1;
				t->internal.client[index].wsEncode.RSV = 0;
				t->internal.client[index].wsEncode.OpCode = JSON_WS_OPCODE_TEXT;
				t->internal.client[index].wsEncode.MASK = 0;
				t->internal.client[index].wsEncode.PayloadLength = t->internal.client[index].messageBuffer.currentLength;
				memset(&(t->internal.client[index].wsEncode.MaskingKey), 0, sizeof(t->internal.client[index].wsEncode.MaskingKey));
				t->internal.client[index].wsEncode.pPayloadData = t->internal.client[index].messageBuffer.pData;
				jsonWSEncode(&t->internal.client[index].wsEncode);

				if (t->internal.client[index].wsEncode.Status != 0) { jsonInternalSetWSServerError(t->internal.client[index].wsEncode.Status, t); continue; }

				t->internal.client[index].tcpStream.IN.PAR.SendLength = t->internal.client[index].wsEncode.FrameLength;
				t->internal.client[index].tcpStream.IN.CMD.Send = 1;
			
				// Reset request timer
				t->internal.client[index].requestTimer.IN = 0;
			
				//i = 0;//temp for debug
				//char *pResponseData = (char*)t->internal.client[index].messageBuffer.pData;//temp for debug
			
			}// Connected
		
			memset((void*)t->internal.client[index].pReceiveData, 0, t->BufferSize);
		
		
		} // NewDataAvailable && !Sending
	
		TCPStreamSend(&t->internal.client[index].tcpStream);
	
		t->internal.client[index].tcpStream.IN.CMD.Send = 0;
				
		// Handle request timer
		t->internal.client[index].requestTimer.PT = 4000000000u; // Set timer to a long time
		TON_10ms(&t->internal.client[index].requestTimer);
		
		// Handle timeout
		// NOTE: We will likely want to consider doing a ping here instead of just disconnecting
		if(t->internal.client[index].wsConnected && t->internal.client[index].requestTimer.ET * 10 > (t->Timeout ? t->Timeout : JSON_DEFAULT_TIMEOUT)) {
			t->internal.client[index].tcpStream.IN.CMD.Receive = 0;
			t->internal.client[index].tcpStream.IN.CMD.Close = 1;
			t->internal.client[index].wsConnected = 0;
			t->internal.client[index].debug.socketDisconnectCountTimeout++;
			continue;
		}
		
		
		t->ClientInfo[index].TimeSinceLastRequest_ms = t->internal.client[index].requestTimer.ET * 10;
		t->ClientInfo[index].Connected = t->internal.client[index].tcpStream.OUT.Active;
		
	} // End For Clients
		
} // End Fn
