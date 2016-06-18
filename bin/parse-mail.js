'use strict';

const { MailParser } = require('mailparser');
const nodemailer = require('nodemailer');

const convertPdfToMobileTicket = require('./create-ticket');

const config = require('../config');

const mailparser = new MailParser();
mailparser.on('end', mail => {
	// console.log(mail);
	const { from } = mail.headers;
	const { attachments } = mail;
	const pdf = findPdf(attachments);

	if (pdf) {
		convertPdfToMobileTicket(pdf)
			.then(sendSuccessMail(from))
			.catch(sendErrorMail(from))
	} else {
		sendErrorMail(from)(new Error('No PDF found in attachments'));
	}
})
process.stdin.pipe(mailparser);

const transporter = nodemailer.createTransport(config.email)

function sendSuccessMail(recipient) {
	return function({ ticket, filebase }) {
		const body = `Hallo,

		wir haben deine Fahrkarte nach ${ticket.segments.outbound.to} in ein mobiles
		Ticket umgewandelt.

		Du findest es unter <https://fahrkar.de/tickets/${filebase}>. Bitte öffne
		diesen Link mit deinem Telefon und speichere die Seite auf deinem
		Startbildschirm. Wir werden die Datei innerhalb kurzer Zeit löschen, auf
		deinem Telefon wird sie aber weiterhin verfügbar sein.

		Bitte denke daran, dass dies keine gültige Fahrkarte der Deutschen Bahn AG
		ist. Du musst unbedingt eine andere, gültige Fahrkarte mitnehmen.
		Bei unserer Fahrkarte handelt es sich nur um eine Machbarkeitsstudie.

		Gute Reise,
		Fahrkar.de`.replace(/\t+/g, '');

		transporter.sendMail({
			from: 'Fahrkar.de <fahrkar@corvus.uberspace.de>',
			to: recipient,
			subject: `Deine Fahrkarte nach ${ticket.segments.outbound.to}`,
			text: body,
		})
	}
}
function sendErrorMail(recipient) {
	return function(error) {
		const body = `Hallo,

		leider ist beim Umwandeln deiner Fahrkarte etwas schiefgelaufen. Bitte
		sieh noch einmal nach, ob du uns auch das PDF mit weitergeleitet hast.

		Leider unterstützen wir momentan nur innerdeutsche Fahrkarten.

		Viele Grüße,
		Fahrkar.de`.replace(/\t+/g, '');

		transporter.sendMail({
			from: 'Fahrkar.de <fahrkar@corvus.uberspace.de>',
			to: recipient,
			subject: 'Fehler bei deiner Fahrkarte',
			text: body,
		})
	}
}

function findPdf(attachments) {
	let longest = { length: 0 };
	for (const attachment of attachments) {
		if (attachment.contentType !== 'application/pdf') continue;
		if (longest.length < attachment.length) {
			longest = attachment;
		}
	}
	if (!longest.length) return null;
	return longest.content;
}
