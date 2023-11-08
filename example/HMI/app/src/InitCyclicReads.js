machine.initCyclicReadGroup('Axis', "gMotorBasic")
machine.initCyclicReadGroup('Axis', "AxisBasic:Configuration")
machine.initCyclicReadGroup('Axis', "gAxisApi")

machine.initCyclicReadGroup('Charts', "Trace:Configuration")
machine.initCyclicReadGroup('Charts', "Trace:TraceData1")
machine.initCyclicReadGroup('Charts', "Trace:TraceData2")
machine.initCyclicReadGroup('Charts', "Trace:TraceData3")
machine.initCyclicReadGroup('Charts', "Trace:TraceData4")
machine.initCyclicReadGroup('Charts', "Trace:varVariable")

machine.initCyclicReadGroup('Piper', "MachineHMI:HMIMachineCMD")
machine.initCyclicReadGroup('Piper', "gMachine.IN")
machine.initCyclicReadGroup('Piper', "MachineProg:StatusModule")

machine.initCyclicReadGroup('Alarms', "AlarmWrap:wrapper.out")
machine.initCyclicReadGroup('Alarms', "AlarmWrap:wrapper.internal.uiCoreConnect")
