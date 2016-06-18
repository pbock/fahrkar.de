'use strict';

class BitGrid {
	constructor(buffer) {
		// Don't ask me why this works – figured out by brute force after 22 hours
		// without sleep
		this.width = 83;
		const bufferWidth = Math.sqrt(buffer.length / 2) | 0;
		const offset = 2 * (bufferWidth - this.width);

		this.values = new Uint8Array(this.width * this.width);

		for (let y = 0; y < this.width + offset; y++) {
			for (let x = 0; x < this.width + offset; x+=2) {
				const inI = ((x + offset) / 2 | 0) + ((bufferWidth / 2 | 0) + 1) * 4 * y;
				const outI = x + this.width * y;
				const byte = buffer[inI];

				if (byte === 0xff) {
					this.values[outI + 0] = 0x00;
					this.values[outI + 1] = 0x00;
				} else if (byte === 0xf0) {
					this.values[outI + 0] = 0x00;
					this.values[outI + 1] = 0xff;
				} else if (byte === 0x0f) {
					this.values[outI + 0] = 0xff;
					this.values[outI + 1] = 0x00;
				} else if (byte === 0x00) {
					this.values[outI + 0] = 0xff;
					this.values[outI + 1] = 0xff;
				}
			}
		}
	}

	toString() {
		let output = '';
		for (let i = 0; i < this.values.length; i++) {
			if (i % this.width === 0) output += '\n';
			output += (this.values[i] === 0xff) ? ' ' : 'X';
		}
		return output.toString();
	}

	get(x, y) {
		const value = this.values[x + this.width * y];
		if (value === undefined) return;
		return !!value;
	}
}

module.exports = BitGrid;
