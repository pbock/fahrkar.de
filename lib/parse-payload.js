'use strict';

module.exports = function (payload) {
	// Parse ticket header
	let currentOffset = 0;
	const { data: header, length: headerLength } = parseHeader(payload);

	currentOffset += headerLength;

	// Parse identification block
	const { data: identification, length: identificationLength } =
		parseIdentification(payload.slice(currentOffset));

	currentOffset += identificationLength;

	// Parse segments
	const { data: segments, length: segmentsLength } =
		parseSegments(payload.slice(currentOffset));

	return { header, identification, segments };
}

function parseDate(date, time) {
	// Offset skips over '.' if there are any in the date string,
	// so 24122016 == 24.12.2016
	const offset = (date.length > 8) ? 1 : 0;
	const day = parseInt(date.substr(0, 2), 10);
	const month = parseInt(date.substr(2 + offset, 2), 10);
	const year = parseInt(date.substr(4 + 2 * offset, 4), 10);

	let hours = 0, minutes = 0;
	if (time) {
		hours = parseInt(time.substr(0, 2), 10);
		minutes = parseInt(time.substr(2, 2), 10);
	}

	return new Date(year, month - 1, day, hours, minutes);
}

function parseHeader(payload) {
	const version = payload.slice(6, 8).toString();
	const length = parseInt(payload.slice(8, 12).toString(), 10);
	const buffer = payload.slice(0, length);

	const pnr = buffer.slice(16, 22).toString();
	const issueDate = buffer.slice(36, 44).toString();
	const issueTime = buffer.slice(44, 48).toString();
	const date = parseDate(issueDate, issueTime);
	const flags = parseInt(buffer.slice(48, 49).toString(), 10);
	const isInternational = !!(flags & 1);
	const isEditedByConductor = !!(flags & 2);
	const isTestTicket = !!(flags & 4);
	const primaryLanguage = buffer.slice(49, 51).toString();
	const secondaryLanguage = buffer.slice(51, 53).toString();

	const data = {
		version,
		pnr,
		issueDate: date,
		isInternational,
		isEditedByConductor,
		isTestTicket,
		primaryLanguage,
		secondaryLanguage,
	};
	return { length, data };
}

const ID_TYPES = {
	1: 'Credit Card',
	4: 'BahnCard',
	7: 'Debit Card',
	8: 'bonus.card business',
	9: 'National ID Card',
	10: 'Passport',
	11: 'bahn.bonus Card',
}
function parseIdentification(payloadFragment) {
	const length = parseInt(payloadFragment.slice(8, 12), 10);
	const buffer = payloadFragment.slice(0, length);

	const carrier = buffer.slice(0, 4).toString();
	const type = ID_TYPES[parseInt(buffer.slice(12, 14), 10)];
	const lastDigits = buffer.slice(14, 18).toString();

	const data = {
		carrier,
		type,
		lastDigits,
	}
	return { length, data };
}

const PRODUCT_CLASSES = {
	0: 'Regional',
	1: 'IC/EC',
	2: 'ICE',
	'C': 'Regional',
	'B': 'IC/EC',
	'A': 'ICE',
}
const BAHNCARD_TYPES = {
	0: 'keine BahnCard',
	19: 'BahnCard 50',
	78: 'BahnCard 50',
	49: 'BahnCard 25',
	27: 'Einsteiger BahnCard 25 ohne Abo',
	39: 'Einsteiger BahnCard 25',
}
const FARE_TYPES = {
	3: 'Rail&Fly',
	12: 'Flexpreis',
	13: 'Sparpreis',
}
function parseCertificate(buffer) {
	const id = buffer.slice(0, 11).toString();
	const validFrom = parseDate(buffer.slice(22, 30).toString());
	const validUntil = parseDate(buffer.slice(30, 38).toString(), '2400');
	const serialNumber = buffer.slice(38).toString();
	return { id, validFrom, validUntil, serialNumber };
}
function parseSegments(segmentsFragment) {
	const length = parseInt(segmentsFragment.slice(8, 12), 10);
	const buffer = segmentsFragment.slice(0, length);

	const carrier = buffer.slice(0, 4).toString();
	const certificateCount = +buffer.slice(14, 15).toString();
	const certificates = [];
	const certificateLength = 46;
	for (let i = 0; i < certificateCount; i++) {
		const start = 15 + i * certificateLength;
		const end = start + certificateLength;
		const certificate = parseCertificate(buffer.slice(start, end));
		certificates.push(certificate);
	}

	const segment = {
		carrier,
		certificates,
	};

	let cursor = 15 + certificateCount * certificateLength;
	// const sBlockCount = parseInt(buffer.slice(cursor, cursor + 2).toString(), 10);
	cursor += 2;
	while (cursor < buffer.length) {
		if (buffer[cursor] !== 0x53) break;
		const length = 8 + parseInt(buffer.slice(cursor + 4, cursor + 8), 10);
		const type = buffer.slice(cursor + 1, cursor + 4).toString();
		const body = buffer.slice(cursor + 8, cursor + length).toString();

		switch (type) {
			case '001': // Fare type
				segment.fareTypeName = body;
				break;
			case '002': // Product class for entire ticket (0, 1, 2)
				segment.productClass = PRODUCT_CLASSES[+body];
				break;
			case '003': // Product class outbound (C, B, A)
				segment.productClassOutbound = PRODUCT_CLASSES[body];
				break;
			case '004': // Product class outbound (C, B, A)
				segment.productClassInbound = PRODUCT_CLASSES[body];
				break;
			case '009': // Passengers
				segment.adults = +body.split('-')[0];
				segment.bahnCards = +body.split('-')[1];
				segment.bahnCardTypes = BAHNCARD_TYPES[body.split('-')[2]];
				break;
			case '012': // Children
				segment.children = parseInt(body, 10);
				break;
			case '014': // Fare class
				segment.fareClass = body.substr(-1);
				break;
			case '015': // Outbound from station
				segment.outbound = segment.outbound || {};
				segment.outbound.from = body;
				break;
			case '016': // Outbound from station
				segment.outbound = segment.outbound || {};
				segment.outbound.to = body;
				break;
			case '017': // Inbound from station
				segment.inbound = segment.inbound || {};
				segment.inbound.from = body;
				break;
			case '018': // Inbound from station
				segment.inbound = segment.inbound || {};
				segment.inbound.to = body;
				break;
			case '021': // VIA
				segment.via = body;
				break;
			case '023': // Full Name
				segment.passenger = segment.passenger || {};
				segment.passenger.fullName = body;
				break;
			case '026':
				segment.fareType = FARE_TYPES[body];
				break;
			case '027':
				segment.identificationNumber = body;
				break;
			case '028':
				segment.passenger = segment.passenger || {};
				segment.passenger.firstName = body.split('#')[0];
				segment.passenger.lastName = body.split('#')[1];
				break;
			case '031':
				segment.validFrom = parseDate(body);
				break;
			case '032':
				segment.validUntil = parseDate(body, '2400');
				break;
			case '035':
				segment.fromId = body;
				break;
			case '036':
				segment.toId = body;
				break;
			default:
				segment['S' + type] = body.toString();
				break;
		}

		cursor += length;
	}

	return { data: segment };
}
