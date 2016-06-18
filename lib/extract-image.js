'use strict';

const zlib = require('zlib');
const fs = require('fs');
const path = require('path');
const BitGrid = require('./bitgrid');
const decodeAztec = require('./decode-aztec');


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
				.then(i => { console.log(i); return i})
				.then(i => (new BitGrid(i)))
				.then(bitGridToPng)
		}
	}
	return Promise.resolve(null);
}

function bitGridToPng(bitGrid) {
	const scale = 10;
	const canvas = new Canvas(bitGrid.width * scale, bitGrid.width * scale);
	const ctx = canvas.getContext('2d');

	for (let x = 0; x < bitGrid.width; x++) {
		for (let y = 0; y < bitGrid.width; y++) {
			const value = bitGrid.get(x, y);
			ctx.fillStyle = value ? '#000' : '#fff';
			ctx.fillRect(x * scale, y * scale, scale, scale);
		}
	}
	return canvas.toBuffer();
}
const Canvas = require('canvas');


module.exports = decode;
