Installation
------------

Install it using npm:

`$ npm install git://github.com/XKEYGmbH/node-fcpro.git`
  
Or get it directly from: https://github.com/XKEYGmbH/node-fcpro


Example
------------

The default port of AutoOCR is `8001` and FileConverter `8007`  

```javascript
var FCProREST = require('fcpro');


var api = new FCProREST('fcproserver-ip-or-domain',8007,'FileConverterProREST','admin','password', "./tmp-dir/");
// FOR AUTOOCR: var api = new FCProREST('autoocr-ip-or-domain',8001,'AutoOCRService','admin','password', "./tmp-dir/");


var profileName = "default",
    fileExtension = "DOCX",
    filePath = "data/test.docx",
    label = "LABEL-FOR-INTERNAL-USE";
    
    
api.Auth(function(success) {
	if (success) {
		api.GetSettingsCollection(function(settings) {
			var collection = settings.GetSettingsCollectionResult;
		});
		
		api.UploadWaitFor(fileExtension, profileName, filePath, label, function(jobGuid,path,data) {
			// DO SOMETHING WITH THE CONVERTED DOCUMENT 
		});
	}
});
```
