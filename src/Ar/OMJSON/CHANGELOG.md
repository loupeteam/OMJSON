# Change log

1.4.3 - Update Websocket dependency to fix connection issue 
		Fix clients being disconnect due to timeout immediately after connecting

1.4.2 - Expand StringExt dependency

1.4.1 - Fix request timer not resetting properly after timeout

1.4.0 - Remove technology guarding license requirement

1.3.8 - Fix iClient not being populated cyclically

1.3.7 - Allow case-insensitivity for 'Sec-WebSocket-Key' header

1.3.6 - Extend vartools dependency to <=0.11.9

1.3.5 - Handle client disconnect frames and timeouts

1.3.4 - Update dependencies

1.3.3 - Fix handling of reading unsupported variables

1.3.2 - Update dependencies

1.3.1 - Update dependencies

1.3.0 - Add support for up to 5 clients per a server at a time
        Add support for reading / writing ASCII to WSTRING

1.2.3 - Fix error-handling for wide string inputs

1.2.2 - Update dependencies 

1.2.1 - Update dependencies 

1.2.0 - Synchronize version number with webhmi

1.1.1 - Add jsonEscape and jsonUnescape
		Fix stackoverflow when jsonReadVariable of string with more than 50 escape characters

1.1.0 - Fix bug with very quick requests
		Fix infinity bug with 'big' but not infinite LREALs
		Increase json variable and item cache size 
		Send "Invalid string" for strings with invalid characters
		Make connection more reliable

1.0.0 - First release

0.13.0 - Release version without TG protection

0.12.0 - Fix page fault caused by parse_string
		Change handling of empty variable names to be more robust
		Escape special characters in variable names

0.11.0 - Add documentation

0.10.0 - Handle escaped characters properly
		Add LICENSE.txt
		Handle Nan, Infinity, and -Infinity better

0.9.0 - Set TCP send buffer size to OMJSON buffer size

0.8.0 - Allow continuous receiving to fix bug with missed requests.
		Add separate errors for cache full of items and vars.
		Increase JSON_MAI_CACHEVAR to 200.
		Fix bug that causes bad packets to page fault.

0.7.0 - Add some debug internals
		Close my side of the client socket if the client closes his (or her) side
		Add HeaderLength and FrameLength to wsDecode FUB
		Handle ReceivedDataLength and FrameLength better
		Reorder files in library
		Make internal functions really internal
		Use new TCP stream interface

0.6.0 - Fix bugs with undefined variables

0.5.0 - Move from AsString functions to AsBrStr functions.
		Check that websocket frame length matches received TCP frame length.
		Check for empty varName in jsonReadVariable().
		Return 'undefined' for variables that are not on the PLC.
		Optimize code that checks for new connections.

0.4.0 - Add check for MaxFrameLength in WSEncode().

0.3.0 - Add WS function blocks and use them inside jsonWebSocketServer.

0.2.0 - Default port to 8000.
		Add TimeSinceLastRequest functionality.
		Fix a horrible, horrible USINT loop counter bug.
		Add some more errors to SetWSServerError().
		Implement WebSocket server.
		Refactor service name implementation.

0.1.1 - Add service name to allow for multiple services.
		Handle empty arrays in jsonReadVariableList.
		Find good defaults.
		Add read list of variables.
		Add caching to read variable service.
		Improve error recovery from VarTools errors.
		Change read interface to accept properly formatted JSON.
		(OMJSON) Rename Webby to OMJSON.
		Refine interface to read and write objects in full JSON.

0.0.1 - (Webby) First attempt at reading and writing PLC variables via JSON.
