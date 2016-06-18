'use strict';

const Canvas = require('canvas');
const fs = require('fs');

const scale = 10;

module.exports = function(aztecCode) {
	const canvas = new Canvas(83 * scale, 83 * scale);
	const ctx = canvas.getContext('2d');

	for (let x = 0; x < 83; x++) {
		for (let y = 0; y < 83; y++) {
			const value = aztecCode.get(x, y);
			ctx.fillStyle = value ? '#fff' : '#000';
			ctx.fillRect(x * scale, y * scale, scale, scale);
		}
	}
	canvas.pngStream().pipe(fs.createWriteStream('code.png'));
}
