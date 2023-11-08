(********************************************************************
 * COPYRIGHT -- Automation Resources Group
 ********************************************************************
 * Program: ErrorProg
 * File: ErrorProgCyclic.st
 * Author: David Blackburn
 * Created: December 14, 2011
 ********************************************************************
 * Implementation of program ErrorProg
 ********************************************************************)


PROGRAM _CYCLIC

PiperModuleInterface;	

ErrorCollectorFn_HMI_Cyclic( gErrorCollectorHMI, gErrorCollector );

ErrorCollectorFn_Cyclic( gErrorCollector );

END_PROGRAM
