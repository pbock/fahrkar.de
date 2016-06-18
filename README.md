Fahrkar.de
==========

Deutsche Bahn's tickets suck a bit. You're stuck with a choice between a PDF
(to be printed onto paper – remember paper?) or their not-very-good mobile app.
Most airlines and coach companies hand out their tickets and boarding passes
in user-friendly de-facto standard formats like Apple Wallet or just a simple
2D barcode to be shown in your email app – but not Deutsche Bahn.

Deutsche Bahn has shown little incentive to change that – so we'll have to
do it ourselves.

Fahrkar.de lets users forward their tickets by email, parses their data
and turns it into a nice, offline-ready HTML-based ticket.

The code is a bit of an undocumented mess (yes, I'm parsing the Aztec codes
out of the PDF by hand; yes, I'm including the zxing JAR files in the
repository). It was cobbled together within 24 sleeples hours at Deutsche
Bahn's Hackathon in June 2016.

Thanks to rumpeltux for [his previous work on DB's Online Tickets][rumpeltux]
on which much of my parsing is based.

[rumpeltux]: https://github.com/rumpeltux/onlineticket/blob/master/onlineticket.py
