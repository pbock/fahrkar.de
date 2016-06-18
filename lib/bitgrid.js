'use strict';

class BitGrid {
	constructor(buffer) {
		console.log(buffer);
		this.width = Math.sqrt(buffer.length / 2) | 0;
		this.values = new Uint8Array(this.width * this.width);
		console.log(this.width);
		for (let y = 0; y < this.width; y++) {
			for (let x = 0; x < this.width; x+=2) {
				const inI = (x / 2 | 0) + ((this.width / 2 | 0) + 1) * 4 * y;
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
