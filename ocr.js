'use strict';

var https = require('https'),
  path = require('path'),
  fs = require('fs'),
  request = require('request');

function OcrService(config) {
  if (!config) {
    throw new Error('Missing parameter config');
  }
  if (!config.apiKey) {
    throw new Error('config.apiKey must be set');
  }
  this.apiKey = config.apiKey;
}

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
    .on('response', function (res) {
      if (res.statusCode != 200) {
        callback(new Error('Failure to post workfile'));
      } else {
        res.on('data', function (chunk) {
          chunks.push(chunk);
        })
        res.on('end', function () {
          callback(null, JSON.parse(chunks.join('')));
        })
      }
    })
  );
};

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
        res.on('error', function (error) {
            callback(error);
        })
      }
    });
  req.write(postData);
  req.end();
};

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
          } else if(chunks.state === "error") {
              callback(new Error('Failure to OCR document'));
          }
        });
        res.on('error', function (error) {
            callback(error);
        })
      }
    });
  req.end();
};

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
    .on('response', function (res) {
      if (res.statusCode != 200) {
        callback(new Error('Failure getting PDF'));
      } else {
        res.pipe(fs.createWriteStream(outputFilePath))
        .on('error', function (error) {
          callback(error);
        })
        .on('finish', function () {
          callback(null);
        });
      }
    });
};

module.exports = OcrService;
