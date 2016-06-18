'use strict';

const fs = require('fs-promise');
const path = require('path');
const zxing = require('./zxing');
const zlib = require('zlib');
const Iconv = require('iconv').Iconv;

const ZLIB_HEADER = [ 0x78, 0x9c ];
const iconv = new Iconv('UTF-8', 'latin1');

module.exports = function(buffer) {
	const filepath = path.resolve('temp/' + Date.now() + '.png');
	return fs.outputFile(filepath, buffer)
		.then(() => zxing(filepath))
		.then(output => {
			output = new Buffer(iconv.convert(output));

			for (let i = 0; i < output.length; i++) {
				// Look for zlib magic header
				if (output[i] === ZLIB_HEADER[0] && output[i + 1] === ZLIB_HEADER[1]) {
					try {
						const inflated = zlib.inflateSync(output.slice(i));
						return inflated;
					} catch (e) {
						console.warn(e.stack);
					}
				}
			}
		})
}
