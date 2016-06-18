'use strict';

const fs = require('fs-promise');
const path = require('path');
const zxing = require('./zxing');
const Iconv = require('iconv').Iconv;

const iconv = new Iconv('UTF-8', 'latin1');

module.exports = function(buffer) {
	const filepath = path.resolve('temp/' + Date.now() + '.png');
	return fs.outputFile(filepath, buffer)
		.then(() => zxing(filepath))
		.then(output => new Buffer(iconv.convert(output)) )
}
