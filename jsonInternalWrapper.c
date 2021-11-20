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

	#include "omjsonInternal.h"
	#include "OMJSON.h"
	#include <string.h>
	#include "jsonAux.h"

#ifdef __cplusplus
	};
#endif

//*******************************************************************
// Wrapper for internal json functions								*
//*******************************************************************

unsigned long jsonUnescape(unsigned long pDest, unsigned long pSrc, unsigned long maxLength, unsigned long reentry)
{
	return unescape_string((char*)pDest, (char*)pSrc, maxLength, (char**)reentry);
}

unsigned long jsonEscape(unsigned long pDest, unsigned long pSrc, unsigned long maxLength, unsigned long reentry)
{
	return stringify_string((char*)pDest, (char*)pSrc, maxLength, (char**)reentry);
}
