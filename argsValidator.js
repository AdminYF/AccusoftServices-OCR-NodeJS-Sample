'use strict';

var fs = require('fs'),
  path = require('path'),
  parseArgs = require('minimist'),
  f = {};

module.exports.writeLine = console.log;
function writeLine(line) {
  module.exports.writeLine(line);
}

function validateArgs(processArgs) {
  function validateFilePath(filePath) {
    var dirname = path.dirname(filePath),
      basename = path.basename(filePath),
      extname = path.extname(filePath),
      isDirectory = fs.statSync(dirname).isDirectory(),
      validFileName = !!basename,
      validExtName = !!extname;

    return isDirectory && validFileName && validExtName;
  }

  var argv = parseArgs(processArgs.slice(2)),
    destFormats = ['text', 'pdf'];

  if (argv.help) {
    writeLine('Usage: node app INPUT OUTPUT DEST_FORMAT');
    writeLine('Perform OCR on INPUT and put result in OUTPUT with DEST_FORMAT.');
    return null;
  }

  if (argv._.length < 3) {
    writeLine('Usage: node app INPUT OUTPUT DEST_FORMAT');
    return null;
  }

  var inputPath = argv._[0],
    outputPath = argv._[1],
    destFormat = argv._[2];

  if (!validateFilePath(inputPath)) {
    writeLine('Invalid input path [' + inputPath + ']');
    return null;
  }

  try {
    if (!fs.statSync(inputPath).isFile()) {
      writeLine('Invalid input path [' + inputPath + ']');
      return null;
    }
  } catch (error) {
    writeLine('Invalid input path [' + inputPath + ']');
    return null;
  }

  if (!validateFilePath(outputPath)) {
    writeLine('Invalid output path [' + outputPath + ']');
    return null;
  }

  if (!destFormat || destFormats.indexOf(destFormat) === -1) {
    writeLine('Invalid output type [' + destFormat + ']');
    return null;
  }

  return {
    inputFilePath: inputPath,
    outputFilePath: outputPath,
    destFormat: destFormat
  };
}

module.exports.validateArgs = validateArgs;
