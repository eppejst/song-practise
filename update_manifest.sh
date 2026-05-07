#!/usr/bin/env node
// Scans /songs and generates songs.json with tags.
// Usage: node update_manifest.sh   (or ./update_manifest.sh)

const fs = require('fs');
const path = require('path');

const SONGS_DIR = path.join(__dirname, 'songs');
const OUTPUT = path.join(__dirname, 'songs.json');

// Tag map: folder name -> tags array
const TAG_MAP = {};

// 17 Mai
for (const s of [
  'Brudefærden i hardanger', 'Champagnegaloppen',
  'Den norske Sjømand (Reissiger)', 'Fædrelandssang (Høiest løfter)',
  'Gud signe vårt dyre fædraland', 'Ja, vi elsker dette landet',
  'Jeg vil værge mit land', 'Kongesangen', 'Naar fjordene blaaner',
  'Norges Fjelde', 'Olaf Trygvason', 'Sangerhilsen', 'Sarpsborgsangen'
]) TAG_MAP[s] = ['17 Mai'];

// Konkurranse
for (const s of [
  'Backstreet medley', 'Bysjan, bysjan lite bån', 'Du Vilar',
  'Echo - Foosnæs', 'Folkefrelsar', 'Gryning', 'Kråkevisa',
  'Londonderry Air', 'På jorden et sted', 'Psaume 121', 'Saltarelle',
  'Shenandoah', 'Tu es Petrus', 'Verbundenheit', 'Vi er slikt stoff',
  'Wie Lieblich'
]) TAG_MAP[s] = ['Konkurranse'];

const songs = [];

for (const folder of fs.readdirSync(SONGS_DIR).sort()) {
  const fullPath = path.join(SONGS_DIR, folder);
  if (!fs.statSync(fullPath).isDirectory()) continue;

  const files = fs.readdirSync(fullPath);
  const mp3s = files.filter(f => /\.mp3$/i.test(f));
  const pdfs = files.filter(f => /\.pdf$/i.test(f));
  const txts = files.filter(f => /\.txt$/i.test(f));

  if (mp3s.length === 0) continue;

  const entry = {
    name: folder,
    folder: 'songs/' + folder,
    files: mp3s.sort()
  };
  if (pdfs.length > 0) entry.pdf = pdfs[0];
  if (txts.length > 0) entry.lyrics = txts[0];
  const normFolder = folder.normalize('NFC');
  if (TAG_MAP[normFolder]) entry.tags = TAG_MAP[normFolder];

  songs.push(entry);
}

fs.writeFileSync(OUTPUT, JSON.stringify({ songs }, null, 2) + '\n');
console.log(`Generated ${OUTPUT} with ${songs.length} songs`);
