(********************************************************************
 * COPYRIGHT -- Automation Resources Group
 ********************************************************************
 * Program: ErrorProg
 * File: ErrorProgInit.st
 * Author: David Blackburn
 * Created: December 14, 2011
 ********************************************************************
 * Implementation of program ErrorProg
 ********************************************************************)


(********************************************************************)
(*																	*)
(* This program handles error collection with the help of the 		*)
(*	ErrorLib library. This library consolidates all system errors 	*)
(*	into one point for display and acknowledgement.					*)
(*																	*)
(* gErrorCollector should first be initialized by setting the 		*)
(*	CFG values and calling ErrorCollectorFn_Init. Then error 		*)
(*	sources can be added by calling the errcolAddSourceByName or	*)
(*	errcolAddSourceByAddress functions.								*)
(*																	*)
(********************************************************************)


PROGRAM _INIT

(* gErrorCollector is initialized in FirstInitProg - Init only if it hasn't already been *)
	IF NOT gErrorCollector.Internal.Initialized THEN
		ErrorCollectorFn_Init(gErrorCollector);
	END_IF
(* Sources are added to gErrorCollector in the source program. *)

END_PROGRAM
