'use strict';

const zxing = require('node-zxing');
const zlib = require('zlib');
const Iconv = require('iconv').Iconv;

const iconv = new Iconv('UTF-8', 'latin1');

const ZLIB_HEADER = [ 0x78, 0x9c ];

module.exports = function (filepath) {
	return new Promise((resolve, reject) => {
		zxing().decode(filepath, (err, output) => {
			if (err) return reject(err);
			if (!output.length) return reject(new Error('No barcode found'));
			output = new Buffer(iconv.convert(output));

			for (let i = 0; i < output.length; i++) {
				// Look for zlib magic header
				if (output[i] === ZLIB_HEADER[0] && output[i + 1] === ZLIB_HEADER[1]) {
					try {
						const inflated = zlib.inflateSync(output.slice(i));
						resolve(inflated);
						break;
					} catch (e) {
						console.warn(e.stack);
					}
				}
			}
			reject(new Error('No barcode found'));
		})
	})
}
