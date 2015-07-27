'use strict';

var OcrService = require('./ocr.js'),
argsValidator = require('./argsValidator.js'),
config = require('./config.json'),
args,
ocrService,
affinityToken;

function execute(args) {
  ocrService = new OcrService({ apiKey: config.apiKey });
  ocrService.postWorkFile(args.inputFilePath, function (error, data) {
    if (error) {
      console.log(error);
    } else {
      console.log('Sucessfully posted ' + args.inputFilePath + ' to work file API.');
      postDocumentTextReaders (data);
    }
  });
}

function postDocumentTextReaders (data) {
  affinityToken = data.affinityToken;
  ocrService.postDocumentTextReaders(data.fileId, args.destFormat, function (error, data) {
    if (error) {
      console.log(error);
    } else {
      console.log('Sucessfully posted ' + args.inputFilePath + ' to document text readers API.');
      getDocument(data);
    }
  });
}

function getDocument (data) {
  ocrService.getDocument(0, args.outputFilePath, args.destFormat, data.processId, function (error, data) {
    if (error) {
      console.log(error);
    } else {
      if (data) {
        getPdf (data);
      }
    }
  });
}

function getPdf (data) {
  ocrService.getPdf(args.outputFilePath, data.output.fileId, affinityToken, function (error, data) {
    if (error) {
      console.log(error);
    } else {
      console.log('OCR completed...');
    }
  });
}

args = argsValidator.validateArgs(process.argv);
if (!args) {
  process.exit(-1);
}
execute(args);
