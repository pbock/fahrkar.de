'use strict';

const zlib = require('zlib');
const fs = require('fs');
const path = require('path');
const BitGrid = require('./bitgrid');

const streamStart = Buffer.from('stream\n');
const streamEnd = Buffer.from('\nendstream');

// const input = fs.readFileSync('/Users/Philipp/Desktop/code');
// const inflated = zlib.inflateSync(input);

function inflate(buffer) {
	return new Promise((resolve, reject) => {
		zlib.inflate(buffer, (err, inflated) => {
			if (err) return reject(err);
			resolve(inflated);
		})
	})
}

function decode(buffer) {
	let cursor = 0;
	const search = Buffer.from('/Image');

	while (cursor < buffer.length) {
		const index = buffer.indexOf(search, cursor);
		if (index === -1) break;

		cursor = index + 1;
		const endOfMetadata = buffer.indexOf('stream', index);
		const metadata = buffer.slice(index, endOfMetadata).toString();
		let width, height;
		try {
			width = +metadata.match(/\/Width (\d+)/)[1];
			height = +metadata.match(/\/Height (\d+)/)[1];
		} catch (e) {
			if (!e instanceof TypeError) throw e;
			else continue;
		}

		// Aztec codes are always encoded at 332x332px
		if (width === 332 && height === 332) {
			const start = buffer.indexOf(streamStart, index) + streamStart.length;
			const end = buffer.indexOf(streamEnd, index);
			const deflated = buffer.slice(start, end);

			return inflate(deflated)
				.then(i => (new BitGrid(i)).toString())
		}
	}
	return Promise.resolve(null);
}

// const srcDir = path.resolve('/Users/Philipp/Development/bahnlog/src/data/');
// const files = fs.readdirSync(srcDir).filter(n => /\.pdf$/.test(n));
const files = [ 'P8BKCO.pdf' ]

for (const file of files) {
	// const filepath = path.resolve(srcDir, file);
	const filepath = file;
	decode(fs.readFileSync(filepath)).then(c => console.log(c)).catch(e => console.error(e.stack))
}
