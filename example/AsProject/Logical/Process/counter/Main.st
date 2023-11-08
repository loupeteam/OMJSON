
PROGRAM _INIT
	(* Insert code here *)
	 
END_PROGRAM

PROGRAM _CYCLIC
	
	IF (NOT pause) THEN
		counter := counter + 1;
	END_IF 
	
	IF (reset) THEN
		counter := 0;
	END_IF
	 
END_PROGRAM

PROGRAM _EXIT
	(* Insert code here *)
	 
END_PROGRAM

