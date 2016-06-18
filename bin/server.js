'use strict';

const express = require('express');
const pr = require('path').resolve;

const config = require('../config');

const app = express();
app.set('view engine', 'pug');
app.set('views', pr(__dirname, '../templates'));

app.get('/', (req, res) => res.render('index'));
app.use('/', express.static(pr(__dirname, '../src/')));

app.listen(config.port, () => { console.log('listening') })
