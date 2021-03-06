'use strict';

const Datauri = require('datauri');
const moment = require('moment');
const path = require('path');
const fs = require('fs-promise');
const pug = require('pug');

const extractImage = require('../lib/extract-image');
const decodeAztec = require('../lib/decode-aztec');
const extractPayload = require('../lib/extract-payload');
const parsePayload = require('../lib/parse-payload');

const template = pug.compile(fs.readFileSync(path.resolve(__dirname, '../templates/mobile-ticket.pug')));

moment.locale('de');

function validityString(validFrom, validUntil) {
	const format = 'D. MMMM Y';
	const from = moment(validFrom);
	const until = moment(validUntil);
	if (from.clone().add(1, 'day').isSameOrAfter(until)) {
		return from.format(format);
	} else {
		return from.format(format) + '–' + until.format(format);
	}
}

function convertPdfToMobileTicket(pdf) {
	let aztecContent, image;
	return extractImage(pdf)
		.then(i => {
			image = i;
			return i;
		})
		.then(decodeAztec)
		.then(aztec => {
			aztecContent = aztec;
			return extractPayload(aztec);
		})
		.then(parsePayload)
		.then(ticket => {
			// console.log(ticket);
			const datauri = new Datauri();
			const filebase = ticket.header.pnr + Date.now();
			datauri.format('.png', image);

			const identificationStrings = {
				'Credit Card': 'Ihrer <strong>Kreditkarte</strong>, deren',
				'BahnCard': 'Ihrer <strong>BahnCard</strong>, deren',
				'Debit Card': 'Ihrer <strong>EC-Karte</strong>, deren',
				'bonus.card business': 'Ihrer <strong>bonus.card business</strong>, deren',
				'National ID Card': 'Ihrem <strong>Personalausweis</strong>, dessen',
				'Passport': 'Ihrem <strong>Reisepass</strong>, dessen',
				'bahn.bonus Card': 'Ihrer <strong>bahn.bonus Card</strong>, deren',
			}
			let identification = `Diese Fahrkarte ist nur gültig in Verbindung mit `
				+ (identificationStrings[ticket.identification.type] || ticket.identification.type)
				+ ` Nummer auf <strong>…${ticket.identification.lastDigits}</strong> endet.`;

			const aztecURL = datauri.content;
			const html = template({
				aztecContent,
				aztecURL,
				ticket,
				validityString,
				identification,
			});

			const manifest = [ 'CACHE MANIFEST', '', 'index.html', 'assets/css/mobile-ticket.css' ];
			return Promise.all([
				fs.outputFile(path.resolve(__dirname, '../src/tickets/', filebase, 'index.appcache'), manifest.join('\n')),
				fs.outputFile(path.resolve(__dirname, '../src/tickets/', filebase, 'index.html'), html),
			])
			.then(() => ({ filebase, ticket }));
		})
}

module.exports = convertPdfToMobileTicket;
