# nodejs ocr example code
The following is sample code for scanning documents or images for text within JPG, TIF, PNG, or BMP formats using node.js in conjunction with the Accusoft Cloud Services API. It returns the extracted content into either a searchable PDF or text file.
###Overview
Build OCR capabilities to your web application quickly using the Accusoft Cloud Services OCR API. Support for scanning documents and images for text within JPG, TIF, PNG, or BMP formats. If you are ready to build OCR into your own application then take a moment to learn more about the [Accusoft Cloud Services OCR API here](https://www.accusoft.com/products/accusoft-cloud-services/overview/).
###Installation
Download the package and type

	npm install
Open config.json and replace everything within the quotes including the curly braces with a valid [api key](http://www.accusoft.com/portal/ "Get your api key") obtained for **free** from accusoft.com.

	{
	  "apiKey": "{{ valid key here }}"
	}

This code will not function without a valid api key. Please sign up at [www.accusoft.com/products/accusoft-cloud-services/portal/](http://www.accusoft.com/portal/ "Get your api key") to get your key.
###Usage instructions
From within the subdirectory where you installed this code example, type

	node app <inputFile> <outputFile> <destination_format>

		 inputFile: path to your input file, including the filename
		 outputFile: path to your output file, including filename
		 destination_format: the format of the output file. It can either be text or PDF.

###Examples
Generate a PDF file from a bitmap file.

	node app sample.bmp sample.pdf pdf

Generate a PDF file from a JPEG file.

	node app sample.jpg sample.pdf pdf

Generate a TEXT file from a PNG file.

	node app sample.png sample.txt text

###Explanation
This is a fully functioning example to get you started using the ocr services. The main calls to the api are within **ocr.js**. Here is a brief walkthrough of that file.

####Loading required node modules

	'use strict';
	var https = require('https'),
  	 path = require('path'),
  	 fs = require('fs'),
  	 request = require('request');

####Creating a Workfile
The purpose of a WorkFile is for temporary storage of files on Accusoft servers so they can be shared by various back-end processes that need to act on it.
The parameter (**inputFilePath**) is sent via a POST to the Accusoft Cloud services api. The api key (**config.apiKey**) is sent as a header. The response will contain the (**fileId** and **affinityToken**) within a JSON object. These values will be needed for calls to the DocumentTextReaders and WorkFile APIs. For more information, see the [OCR work files documentation](http://help.accusoft.com/SAAS/pcc-for-acs/webframe.html#Work%20Files.html).
```
	OcrService.prototype.postWorkFile = function (inputFilePath, callback) {
	  if (arguments.length < 2) {
	    throw new Error('function ocrService.postWorkFile is missing parameters');
	  }

	  var options = {
	    url: 'https://api.accusoft.com/PCCIS/V1/WorkFile',
	    headers: {
	      'content-type': 'application/octet-stream',
	      'acs-api-key': this.apiKey
	    }
	  };

	  var chunks = [];
	  fs.createReadStream(inputFilePath)
	  .pipe(request.post(options)
	    .on('data', function (chunk) {
	      chunks.push(chunk);
	    })
	    .on('end', function () {
	      callback(null, JSON.parse(chunks.join('')));
	    })
	    .on('response', function (response) {
	      if (response.statusCode != 200) {
	        callback(new Error('Failure to post workfile'));
	      }
	    })
	  );
	};
```
####Reading text
The document text reader API allows you to read text from a raster document, producing either a text file, searchable PDF or box file. The contents of a JSON object containing the workfile ID (**fileId**) and describing the operation to perform (**destFormat**) are sent via POST to the Accusoft Cloud Services api with the api key (**config.apiKey**) sent as a header. A successful response will include a unique (**processId**) which identifies this documentTextReader. You will use this processId in subsequent GET calls to get the state and final results of the OCR operation. For more information, see the [OCR document text readers documentation](http://help.accusoft.com/SAAS/pcc-for-acs/webframe.html#Full-Page%20OCR.html).
```
	OcrService.prototype.postDocumentTextReaders = function (fileId, destFormat, callback) {
	  if (arguments.length < 3) {
	    throw new Error('function ocrService.postDocumentTextReaders is missing parameters');
	  }

	  var postData = JSON.stringify({
	    "input": {
	      "src": {
	        "fileId": fileId
	      },
	      "dest": {
	        "format": destFormat
	      }
	    }
	  }),
	  options = {
	    hostname: 'api.accusoft.com',
	    port: 443,
	    path: '/v1/documentTextReaders',
	    method: 'POST',
	    headers: {
	      'content-type': 'application/json',
	      'acs-api-key': this.apiKey
	    }
	  };

	  var chunks = [],
	    req = https.request(options, function (res) {
	       if (res.statusCode != 200) {
	        callback(new Error('Failure to post to document text readers'));
	      } else {
	        res.on('data', function (chunk) {
	          chunks.push(chunk);
	        });
	        res.on('end', function () {
	          callback(null, JSON.parse(chunks.join('')));
	        });
	      }
	    });
	  req.write(postData);
	  req.end();
	};
```
####Getting state and final output
Gets the state of a documentTextReader and its final output if available. The (**processId**) is passed via the URL and the api key (**config.apiKey**) is sent as a header via GET to the Accusoft Cloud Services api. Responses for the request are in a format that's identical to those of POST /v1/documentTextReader. Requests can be sent to this URL repeatedly while the response (**state**) is "processing". When the response state is "complete", the output section will include either the plain text of the document (**outputFilePath**), or a WorkFile id for a searchable PDF (depending on whether you requested "text" or "pdf" as your destination format). If PDF, you can use the **fileId** with the WorkFile API to download the output file. For more information, see the [OCR document text readers documentation](http://help.accusoft.com/SAAS/pcc-for-acs/webframe.html#Full-Page%20OCR.html).
```
	OcrService.prototype.getDocument = function(recurseCnt, outputFilePath, destFormat, processId, callback) {
	  if (arguments.length < 5) {
	    throw new Error('function ocrService.getDocument is missing parameters');
	  }

	  var self = this,
	  options = {
	    hostname: 'api.accusoft.com',
	    port: 443,
	    path: '/v1/documentTextReaders/'+processId,
	    method: 'GET',
	    headers: {
	      'content-type': 'application/json',
	      'acs-api-key': this.apiKey
	    }
	  };

	  var chunks = [],
	    req = https.get(options, function (res) {
	      if (res.statusCode != 200) {
	        callback(new Error('Failure to get document'));
	      } else {
	        res.on('data', function (chunk) {
	          chunks.push(chunk);
	        });
	        res.on('end', function () {
	          chunks = JSON.parse(chunks.join(''));
	          if(chunks.state === "processing" && recurseCnt < 481) {
	            setTimeout(
	              function() {
	                recurseCnt++;
	                self.getDocument(recurseCnt, outputFilePath, destFormat, processId, callback);
	              }, 500);
	          } else if(chunks.state === "complete") {
	            if (destFormat === "text") {
	              if(chunks.output.text) {
	                fs.writeFile(outputFilePath, chunks.output.text, function(err) {
	                  if(err) {
	                    callback(new Error('Failure to get document'));
	                  } else {
	                    callback(null);
	                  }
	                });
	              } else {
	                callback(new Error('Failure empty document'));
	              }
	            } else if (destFormat === "pdf") {
	              callback(null, chunks);
	            }
	          }
	        });
	      }
	    });
	  req.end();
	};
```
####Downloading PDF output
Gets the data associated with an existing WorkFile. The parameter (**workfileId**) is sent via a GET to the Accusoft Cloud services api. The api key (**config.apiKey**) and (**affinityToken**) are sent as a header. The response will contain binary data the will be be written out to (**outputFilePath**). For more information, see the [OCR write files documentation](http://help.accusoft.com/SAAS/pcc-for-acs/webframe.html#Work%20Files.html).
```
	OcrService.prototype.getPdf = function (outputFilePath, workfileId, affinityToken, callback) {
	  if (arguments.length < 4) {
	    throw new Error('function ocrService.getDocument is missing parameters');
	  }

	  var options = {
	    url: 'https://api.accusoft.com/v1/ocrWorkFile/'+workfileId,
	    headers: {
	      'Accusoft-Affinity-Hint': affinityToken,
	      'acs-api-key': this.apiKey
	    }
	  };

	  request(options)
	    .on('response', function (response) {
	      if (response.statusCode != 200) {
	        callback(new Error('Failure getting PDF'));
	      } else {
	        response.pipe(fs.createWriteStream(outputFilePath))
	        .on('error', function (error) {
	          callback(error);
	        })
	        .on('finish', function () {
	          callback(null);
	        });
	      }
	    });
```
##Support
If you have questions, please visit our online [help center](https://accusofthelp.zendesk.com/hc/en-us).

