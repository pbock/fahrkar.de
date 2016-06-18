'use strict';

class BitGrid {
	constructor(buffer) {
		this.values = new Uint8Array(83 * 83);
		for (let y = 0; y < 83; y++) {
			for (let x = 0; x < 83; x+=2) {
				const inI = (x / 2 | 0) + 42 * 4 * y;
				const outI = x + 83 * y;
				const byte = buffer[inI];

				if (byte === 0x00) {
					this.values[outI + 0] = 0x00;
					this.values[outI + 1] = 0x00;
				} else if (byte === 0x0f) {
					this.values[outI + 0] = 0x00;
					this.values[outI + 1] = 0xff;
				} else if (byte === 0xf0) {
					this.values[outI + 0] = 0xff;
					this.values[outI + 1] = 0x00;
				} else if (byte === 0xff) {
					this.values[outI + 0] = 0xff;
					this.values[outI + 1] = 0xff;
				}
			}
		}
	}

	toString() {
		let output = '';
		for (let i = 0; i < this.values.length; i++) {
			if (i % 83 === 0) output += '\n';
			output += (this.values[i] === 0xff) ? ' ' : 'X';
		}
		return output.toString();
	}
}

module.exports = BitGrid;
