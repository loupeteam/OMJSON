//------------------------------------------------------------------------------
// Copyright 2018 Automation Resources Group
// All rights reserved
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE 
// SOFTWARE.
//------------------------------------------------------------------------------

#include <bur/plctypes.h>
#ifdef __cplusplus
	extern "C"
	{
#endif

#include "OMJSON.h"
#include "jsonInternal.h"
#include <string.h>

#ifdef __cplusplus
	};
#endif

static struct tgProtect protect;

plcbit jsonInternalLicenseIsOk() {

	// HW - tested, TG required
	// HW in simulation - tested, no TG required
	// ARsim - tested, TG REQUIRED!

	protect.productCode = 227;
	strcpy(protect.orderNumber, "1TGC.439456.whmi01");
	strcpy(protect.description, "webHMI communications library to enable HTML/CSS/JS-based interfaces to B&R controllers");
	protect.reaction = guardLIC_REACT_LOGBOOK;
	protect.allowSimulation = 1;
	
	tgProtect(&protect);
	
	return protect.licenseOk;
	
}
