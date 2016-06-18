'use strict';

const zlib = require('zlib');
const ZLIB_HEADER = [ 0x78, 0x9c ];

module.exports = function (aztecContent) {
	for (let i = 0; i < aztecContent.length; i++) {
		// Look for zlib magic header
		if (aztecContent[i] === ZLIB_HEADER[0] && aztecContent[i + 1] === ZLIB_HEADER[1]) {
			const inflated = zlib.inflateSync(aztecContent.slice(i));
			return inflated;
		}
	}
}
