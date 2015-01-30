var querystring = require('querystring'); 
var https = require('https');
var url = require('url');
var fs = require('fs');
var temp = require('temp');
var mime = require('mime');
module.exports = FCProREST;

function FCProREST(host, port, endpoint, username, password, tempfolder){
  this.host = host;
  this.port = port;
  this.endpoint = endpoint;
  this.username = username;
  this.password = password;
  this.tempfolder = tempfolder;

  this._performRequest = function(endpoint, method, data, file, success) {
	  if (typeof file == 'function') success = file, file = null;

	  var dataString = JSON.stringify(data);
	  var headers = {};
	  
	  var downloadStream = false;
	  var stream = null;
	  var tempName = null;
	  if (file != null && typeof file == 'object') {
	    	if (file.type == "download") {
	    		downloadStream = true;
	    		tempName = temp.path({suffix: '.pdf', dir: this.tempfolder});
	    		console.log("TEMPNAME IS ",tempName)
	    		stream = fs.createWriteStream(tempName);
	    	}
	  }
	  
	  if (method == 'GET') {
		  var stringify = querystring.stringify(data);
		  if (stringify.length > 0)
			  endpoint += '?' + stringify;
	  }
	  else if (method == 'PUT') {
		  var stringify = querystring.stringify(data);
		  if (stringify.length > 0)
			  endpoint += '?' + stringify;
		  
		  if (file != null) {
				var fStats = fs.statSync(file),
					mimetype = mime.lookup(file);
				console.log("FILE MIME",mimetype);
				headers = {
			      'Content-Type': mimetype,
			      'Content-Length': fStats.size
			    };
		  }
	  }
	  else {
	    headers = {
	      'Content-Type': 'application/json',
	      'Content-Length': dataString.length
	    };
	  }
	  
	  var options = {
		host: this.host,
	    port: this.port,
	    path: "/"+this.endpoint + endpoint,
	    method: method,
	    headers: headers,
	    rejectUnauthorized: false,
	    requestCert: true,
	    auth: this.username+":"+this.password,
	    agent: false
	  };
	  
	  console.info("SEND REQUEST TO",options);

	  var req = https.request(options, function(res) {
	    //res.setEncoding('utf-8');
	    var responseString = '';
	    
	    if (downloadStream) {
	    	res.pipe(stream);
	    	
	    	res.on('end', function() {
	    		success({ path: tempName });
	    	});
	    }
	    else {
		    res.on('data', function(data) {
		      responseString += data;
		    });
	
		    res.on('end', function() {
		      console.log("END",res.statusCode);
		      
		      try {
		    	  var responseObject = JSON.parse(responseString);
		    	  success(responseObject);
		      }
		      catch (err) {
		      	  console.log(err);
		    	  success(responseString);
		      }
		    });
	    }
	  });

	  if (file != null) {
		  if (typeof file != "object") {
			fs.readFile(file, function(err, data) {
				console.log("PUT FILE",file);
				req.write(data);
				req.end();
			});
		  }	  
		  else {
			  req.write(dataString);
			  req.end();
		  }
	  }
	  else {
		  req.write(dataString);
		  req.end();
	  }
  }
}

/*
[OperationContract(IsOneWay = false)]
[WebInvoke(RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json, Method = "GET", BodyStyle = WebMessageBodyStyle.Wrapped, UriTemplate = "/Auth?userName={userName}&password={password}")]
string Auth(string userName, string password);
 */
FCProREST.prototype.Auth = function(cb) {
	console.info("LOGIN",this.host,this.username,this.password);
	this._performRequest('/Auth', 'GET', {
	    userName: this.username,
	    password: this.password
	  }, function(data) {
		if (data.AuthResult) {
			console.log("AUTHED");
	    	cb(true,data);
		}
		else {
			cb(false,data);
		}
	});
};

/*
[OperationContract(IsOneWay = false)]
[WebInvoke(RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json, Method = "GET", BodyStyle = WebMessageBodyStyle.Wrapped, UriTemplate = "/GetNrOfPages?jobID={jobID}")]
int GetNrOfPages(string jobID);
 */
FCProREST.prototype.GetNrOfPages = function(jobID, cb) {
	this._performRequest('/GetNrOfPages', 'GET', {
		jobID: jobID
	}, cb);
}


/*[OperationContract(IsOneWay = false)]
[WebInvoke(RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json, Method = "PUT", BodyStyle = WebMessageBodyStyle.Wrapped, UriTemplate = "/UploadJob?ext={ext}")]
JobResult UploadJob(string ext, System.IO.Stream stm);
*/

/*[OperationContract(IsOneWay = false)]
[WebInvoke(RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json, Method = "PUT", BodyStyle = WebMessageBodyStyle.Wrapped, UriTemplate = "/UploadJobEx?ext={ext}&settingsName={settingsName}&maxPage={maxPage}")]
JobResult UploadJobEx(string ext, string settingsName, int maxPage, System.IO.Stream stm);
*/

/*[OperationContract(IsOneWay = false)]
[WebInvoke(RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json, Method = "PUT", BodyStyle = WebMessageBodyStyle.Wrapped, UriTemplate = "/UploadJobEx2?ext={ext}&settingsName={settingsName}&maxPage={maxPage}&outExts={outExts}")]
JobResult UploadJobEx2(string ext, string settingsName, int maxPage, string outExts, System.IO.Stream stm);
*/

/*[OperationContract(IsOneWay = false)]
[WebInvoke(RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json, Method = "PUT", BodyStyle = WebMessageBodyStyle.Wrapped, UriTemplate = "/UploadJobEx3?ext={ext}&settingsName={settingsName}&maxPage={maxPage}&outExts={outExts}&label={label}")]
JobResult UploadJobEx3(string ext, string settingsName, int maxPage, string outExts, string label, System.IO.Stream stm);
*/
FCProREST.prototype.UploadJob = function(ext, settingsName, file, label, cb) {
	this._performRequest('/UploadJobEx3', 'PUT', {
		ext: ext,
		settingsName: settingsName,
		maxPage: 10,
		outExts: "",
		label: label
	}, file, cb);
}

/*[OperationContract(IsOneWay = false)]
[WebInvoke(RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json, Method = "GET", BodyStyle = WebMessageBodyStyle.Wrapped, UriTemplate = "/GetStatus?jobID={jobID}")]
int GetStatus(string jobID);
*/
FCProREST.prototype.GetStatus = function(jobID, cb) {
	this._performRequest('/GetStatus', 'GET', {
		jobID: jobID
	}, cb);
}

/*[OperationContract(IsOneWay = false)]
[WebInvoke(RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json, Method = "GET", BodyStyle = WebMessageBodyStyle.Wrapped, UriTemplate = "/GetJob?jobID={jobID}")]
JobResult GetJob(string jobID);
*/
FCProREST.prototype.GetJob = function(jobID, cb) {
	this._performRequest('/GetJob', 'GET', {
		jobID: jobID
	}, cb);
}

/*[OperationContract(IsOneWay = false)]
[WebInvoke(RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json, Method = "GET", BodyStyle = WebMessageBodyStyle.Wrapped, UriTemplate = "/GetOwnJobs?status={status}")]
JobResult[] GetOwnJobs(int status);
*/
FCProREST.prototype.GetOwnJobs = function(status, cb) {
	this._performRequest('/GetOwnJobs', 'GET', {
		status: status
	}, cb);
}

/*[OperationContract(IsOneWay = false)]
[WebInvoke(RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json, Method = "GET", BodyStyle = WebMessageBodyStyle.Wrapped, UriTemplate = "/GetAllJobs?status={status}")]
JobResult[] GetAllJobs(int status);
*/
FCProREST.prototype.GetAllJobs = function(status, cb) {
	this._performRequest('/GetAllJobs', 'GET', {
		status: status
	}, cb);
}

/*[OperationContract(IsOneWay = false)]
[WebInvoke(RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json, Method = "GET", BodyStyle = WebMessageBodyStyle.Wrapped, UriTemplate = "/GetResultCount?jobID={jobID}")]
int GetResultCount(string jobID);
*/
FCProREST.prototype.GetResultCount = function(jobID, cb) {
	this._performRequest('/GetResultCount', 'GET', {
		jobID: jobID
	}, cb);
}

/*[OperationContract(IsOneWay = false)]
[WebInvoke(RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json, Method = "GET", BodyStyle = WebMessageBodyStyle.Wrapped, UriTemplate = "/GetResultExt?jobID={jobID}&index={index}")]
string GetResultExt(string jobID, int index);
*/
FCProREST.prototype.GetResultExt = function(jobID, index, cb) {
	this._performRequest('/GetResultExt', 'GET', {
		jobID: jobID,
		index: index
	}, cb);
}

/*[OperationContract(IsOneWay = false)]
[WebInvoke(RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json, Method = "GET", BodyStyle = WebMessageBodyStyle.Wrapped, UriTemplate = "/GetResultMimeType?jobID={jobID}&index={index}")]
string GetResultMimeType(string jobID, int index);
*/
FCProREST.prototype.GetResultMimeType = function(jobID, index, cb) {
	this._performRequest('/GetResultMimeType', 'GET', {
		jobID: jobID,
		index: index
	}, cb);
}

/*[OperationContract(IsOneWay = false)]
[WebInvoke(RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json, Method = "GET", BodyStyle = WebMessageBodyStyle.Wrapped, UriTemplate = "/GetResult?jobID={jobID}&index={index}&removeFile={removeFile}")]
byte[] GetResult(string jobID, int index, bool removeFile);
*/
FCProREST.prototype.GetResult = function(jobID, index, removeFile, cb) {
	this._performRequest('/GetResult', 'GET', {
		jobID: jobID,
		index: index,
		removeFile: removeFile
	}, cb);
}

/*[OperationContract(IsOneWay = false)]
[WebInvoke(RequestFormat = WebMessageFormat.Json, Method = "GET", BodyStyle = WebMessageBodyStyle.Wrapped, UriTemplate = "/GetResultEx?jobID={jobID}&index={index}&removeFile={removeFile}")]
System.IO.Stream GetResultEx(string jobID, int index, bool removeFile);
*/
FCProREST.prototype.GetResultEx = function(jobID, index, removeFile, cb) {
	this._performRequest('/GetResultEx', 'GET', {
		jobID: jobID,
		index: index,
		removeFile: removeFile
	}, {type: "download"}, cb);
}


FCProREST.prototype.DownloadResult = function(jobID, index, removeFile, cb) {
	this._performRequest('/DownloadResult', 'GET', {
		jobID: jobID,
		index: index,
		removeFile: removeFile
	}, cb);
}


/*[OperationContract(IsOneWay = false)]
[WebInvoke(RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json, Method = "GET", BodyStyle = WebMessageBodyStyle.Wrapped, UriTemplate = "/RemoveJob?jobID={jobID}")]
void RemoveJob(string jobID);
*/
FCProREST.prototype.RemoveJob = function(jobID, cb) {
	this._performRequest('/RemoveJob', 'GET', {
		jobID: jobID
	}, cb);
}

/*[OperationContract(IsOneWay = false)]
[WebInvoke(RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json, Method = "GET", BodyStyle = WebMessageBodyStyle.Wrapped, UriTemplate = "/GetSettingsCollection")]
EngineSettings[] GetSettingsCollection();
*/
FCProREST.prototype.GetSettingsCollection = function(cb) {
	this._performRequest('/GetSettingsCollection', 'GET', {
	}, cb);
}

/*[OperationContract(IsOneWay = false)]
[WebInvoke(RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json, Method = "GET", BodyStyle = WebMessageBodyStyle.Wrapped, UriTemplate = "/GetAvailablePages")]
int GetAvailablePages();
*/
FCProREST.prototype.GetAvailablePages = function(cb) {
	this._performRequest('/GetAvailablePages', 'GET', {
	}, cb);
}

/*[OperationContract(IsOneWay = false)]
[WebInvoke(RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json, Method = "GET", BodyStyle = WebMessageBodyStyle.Wrapped, UriTemplate = "/GetNrOfPagesInQueue")]
int GetNrOfPagesInQueue();
*/
FCProREST.prototype.GetNrOfPagesInQueue = function(cb) {
	this._performRequest('/GetNrOfPagesInQueue', 'GET', {
	}, cb);
}

/*
[OperationContract(IsOneWay = false)]
[WebInvoke(RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json, Method = "GET", BodyStyle = WebMessageBodyStyle.Wrapped, UriTemplate = "/GetNrOfDocumentsInQueue")]
int GetNrOfDocumentsInQueue();
*/
FCProREST.prototype.GetNrOfDocumentsInQueue = function(cb) {
	this._performRequest('/GetNrOfDocumentsInQueue', 'GET', {
	}, cb);
}

/*
[OperationContract(IsOneWay = false)]
[WebInvoke(RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json, Method = "GET", BodyStyle = WebMessageBodyStyle.Wrapped, UriTemplate = "/GetAvgSecPerPage")]
int GetAvgSecPerPage();
*/
FCProREST.prototype.GetAvgSecPerPage = function(cb) {
	this._performRequest('/GetAvgSecPerPage', 'GET', {
	}, cb);
}

/*
[OperationContract(IsOneWay = false)]
string CancelJob(string jobID);
*/
FCProREST.prototype.CancelJob = function(jobID, cb) {
	this._performRequest('/CancelJob', 'GET', {
		jobID: jobID
	}, cb);
}

/*
[OperationContract(IsOneWay = false)]
[WebInvoke(RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json, Method = "GET", BodyStyle = WebMessageBodyStyle.Wrapped, UriTemplate = "/GetServerVersion")]
string GetServerVersion();
*/
FCProREST.prototype.GetServerVersion = function(cb) {
	this._performRequest('/GetServerVersion', 'GET', {
	}, cb);
}

/*
[OperationContract(IsOneWay = false)]
[WebInvoke(RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json, Method = "GET", BodyStyle = WebMessageBodyStyle.Wrapped, UriTemplate = "/GetServerHash")]
int GetServerHash();
*/
FCProREST.prototype.GetServerHash = function(cb) {
	this._performRequest('/GetServerHash', 'GET', {
	}, cb);
}


/*[OperationContract(IsOneWay = false)]
[WebInvoke(RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json, Method = "GET", BodyStyle = WebMessageBodyStyle.Wrapped, UriTemplate = "/GetOCRProfiles")]
EngineSettings[] GetOCRProfiles();*/
FCProREST.prototype.GetOCRProfiles = function(cb) {
	this._performRequest('/admin/GetOCRProfiles', 'GET', {
	}, cb);
}



// LOGIC HANDLER
FCProREST.prototype.UploadWaitFor = function(ext, settingsName, file, label, cb) {
	var self = this;
	self.UploadJob(ext, settingsName, file, label, function(data) {
		var result = data.UploadJobEx3Result;
		if (result) {
			var jobID = result.JobID,
				jobGuid = result.JobGuid,
				label = result.JobLabel,
				status = result.Status;
			
			(function loop() {
			    if (status < 4) {
			    	self.GetStatus(jobGuid, function(statusData) {
						console.log("STATUS BEFORE:",statusData);
						status = statusData.GetStatusResult; 
						loop();
					});
			    }
			    else {
			    	var files = [];
			    	self.GetResultCount(jobGuid, function(resultData) {
			    		var count = resultData.GetResultCountResult;
			    		
			    		var filename = ""
			    		var x = 0;
			    		for (var i = 0; i < count; i++) {
				    		self.GetResultExt(jobGuid, x, function(resultExt) {
					    		var ext = resultExt.GetResultExtResult;
					    		
					    		self.GetResultEx(jobGuid, x, false, function(path) {
					    			console.log("DL RESULT",path);
					    			cb(jobGuid,path,data);
					    			x++;
					    		});
					    	})
			    		}
			    	});
			    }
			}());
		}
		
	});
};
