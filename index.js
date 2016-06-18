'use strict';

const path = require('path');
const fs = require('fs-promise');

const extractImage = require('./lib/extract-image');
const decodeAztec = require('./lib/decode-aztec');
const extractPayload = require('./lib/extract-payload');
const parsePayload = require('./lib/parse-payload');

fs.readFile(process.argv[2])
	.then(extractImage)
	.then(decodeAztec)
	.then(extractPayload)
	.then(parsePayload)
	.then(payload => {
		console.log(JSON.stringify(payload, null, '  '));
	})
	.catch(err => console.error(err.stack))
