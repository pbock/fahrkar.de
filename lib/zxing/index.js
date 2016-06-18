'use strict';

const exec = require('child_process').exec;
const path = require('path');

const corePath = path.resolve(__dirname, 'core-3.1.0.jar');
const javasePath = path.resolve(__dirname, 'javase-3.1.0.jar');
module.exports = function(filepath) {
	return new Promise((resolve, reject) => {
		exec(`java -cp ${javasePath}:${corePath} ` +
			`com.google.zxing.client.j2se.CommandLineRunner ${filepath} ` +
			`--try_harder --possibleFormats=AZTEC`, (err, stdout, stderr) => {
				if (err) return reject(err);
				if (stderr) return reject(new Error(stderr));

				const lines = stdout.split('\n');
				const output = [];
				let outputHasStarted = false;
				for (let i = 0; i < lines.length; i++) {
					if (lines[i] === 'Parsed result:') {
						break;
					}
					if (outputHasStarted) output.push(lines[i]);
					if (lines[i] === 'Raw result:') {
						outputHasStarted = true;
					}
				}
				if (output.length) return resolve(output.join('\n'));

				if (stdout.length) reject(new Error(stdout));
				else reject(new Error(stderr));
			})

	})
}
