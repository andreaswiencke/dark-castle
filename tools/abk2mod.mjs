// Convert an AMOS Music Bank (.abk, bank type "Music   ") into a 4-channel
// ProTracker MOD. Format reference: https://www.exotica.org.uk/wiki/AMOS_Music_Bank_format
//
// Usage:
//   node tools/abk2mod.mjs --dump <file.abk>          # print parsed structure
//   node tools/abk2mod.mjs <in.abk> <out.mod>         # convert (added in a later step)
//
// All multi-byte integers in the AMOS bank are big-endian.
import { readFile } from "node:fs/promises";

const AMBK = 0x416d426b; // "AmBk"
const BANK_HEADER = 20; // AmBk(4)+num(2)+flags(2)+len(4)+type(8)

// ---- parsing -------------------------------------------------------------

export function parseAbk(buf) {
  if (buf.readUInt32BE(0) !== AMBK) throw new Error("not an AmBk bank");
  const type = buf.toString("latin1", 12, 20);
  if (!type.startsWith("Music")) throw new Error(`not a Music bank (type="${type}")`);

  // Main music header is right after the 20-byte bank header. Its three section
  // offsets are relative to the START of this header (i.e. relative to BANK_HEADER).
  const H = BANK_HEADER;
  const instrAbs = H + buf.readUInt32BE(H + 0);
  const songAbs = H + buf.readUInt32BE(H + 4);
  const patAbs = H + buf.readUInt32BE(H + 8);

  return {
    type,
    sections: { instrAbs, songAbs, patAbs, fileLen: buf.length },
    instruments: parseInstruments(buf, instrAbs, songAbs, patAbs),
    songs: parseSongs(buf, songAbs),
    patternTable: parsePatternTable(buf, patAbs),
    _buf: buf,
  };
}

function parseInstruments(buf, instrAbs, songAbs, patAbs) {
  const n = buf.readUInt16BE(instrAbs);
  const recs = [];
  for (let i = 0; i < n; i++) {
    const r = instrAbs + 2 + i * 32;
    recs.push({
      sampleOff: buf.readUInt32BE(r + 0), // from instrument-section start
      repeatOff: buf.readUInt32BE(r + 4), // from instrument-section start
      field8: buf.readUInt16BE(r + 8), // rep: repeat start (longwords); non-rep: length (words)
      field10: buf.readUInt16BE(r + 10), // rep: repeat length (words); non-rep: 1 or 2
      volume: buf.readUInt16BE(r + 12) & 0xff, // 0..0x40 (upper byte = stray finetune)
      declaredLenW: buf.readUInt16BE(r + 14), // UNRELIABLE per spec
      name: buf.toString("latin1", r + 16, r + 32).replace(/[\x00- ]+$/g, ""),
    });
  }
  // True sample byte-lengths: sort distinct sample offsets, length = gap to next;
  // the instrument-block end is the next section start (in file order) or file end.
  const blockEnd = [songAbs, patAbs, buf.length].filter((x) => x > instrAbs).sort((a, b) => a - b)[0];
  const instrBlockLen = blockEnd - instrAbs; // sample offsets are relative to instrAbs
  const offs = [...new Set(recs.map((x) => x.sampleOff))].sort((a, b) => a - b);
  const lenByOff = new Map();
  for (let i = 0; i < offs.length; i++) {
    const end = i + 1 < offs.length ? offs[i + 1] : instrBlockLen;
    lenByOff.set(offs[i], end - offs[i]);
  }

  return recs.map((rec) => {
    const byteLen = lenByOff.get(rec.sampleOff) ?? 0;
    // Repeating sample if repeatOff differs from sampleOff and points inside the sample.
    const repeats = rec.repeatOff > rec.sampleOff && rec.repeatOff < rec.sampleOff + byteLen;
    const repeatStartBytes = repeats ? rec.field8 * 4 : 0; // field8 = repeat start in longwords
    const repeatLenBytes = repeats ? rec.field10 * 2 : 0; // field10 = repeat length in words
    return {
      name: rec.name,
      volume: Math.min(rec.volume, 64),
      dataAbs: instrAbs + rec.sampleOff,
      byteLen,
      repeats,
      repeatStartBytes,
      repeatLenBytes,
    };
  });
}

function parseSongs(buf, songAbs) {
  const n = buf.readUInt16BE(songAbs);
  const songs = [];
  for (let i = 0; i < n; i++) {
    const songStart = songAbs + buf.readUInt32BE(songAbs + 2 + i * 4);
    // NOTE: real files have the 4 channel-playlist offsets FIRST (+0..+6), then the
    // tempo at +8 — the opposite order from the exotica wiki. (tempo 17 = documented
    // default lands at +8, and +0..+6 are valid even playlist offsets.)
    const tempo = buf.readUInt16BE(songStart + 8);
    const name = buf.toString("latin1", songStart + 12, songStart + 28).replace(/[\x00- ]+$/g, "");
    const playlists = [];
    for (let c = 0; c < 4; c++) {
      const plStart = songStart + buf.readUInt16BE(songStart + c * 2);
      const list = [];
      let p = plStart;
      for (let guard = 0; guard < 4096; guard++, p += 2) {
        const w = buf.readUInt16BE(p);
        if (w === 0xfffe || w === 0xffff) break;
        list.push(w);
      }
      playlists.push(list);
    }
    songs.push({ tempo, name, playlists });
  }
  return songs;
}

function parsePatternTable(buf, patAbs) {
  const n = buf.readUInt16BE(patAbs);
  const entries = [];
  for (let i = 0; i < n; i++) {
    const e = patAbs + 2 + i * 8;
    entries.push([0, 1, 2, 3].map((c) => patAbs + buf.readUInt16BE(e + c * 2)));
  }
  return { count: n, base: patAbs, channelStreamAbs: entries };
}

// ---- dump ----------------------------------------------------------------

function dump(parsed) {
  const { sections: s, instruments, songs, patternTable } = parsed;
  console.log(`type="${parsed.type}"  fileLen=${s.fileLen}`);
  console.log(`sections: instr@${s.instrAbs} song@${s.songAbs} pattern@${s.patAbs}`);
  console.log(`instruments: ${instruments.length}`);
  instruments.forEach((it, i) =>
    console.log(
      `  [${i}] "${it.name}" vol=${it.volume} len=${it.byteLen}B` +
        (it.repeats ? ` loop@${it.repeatStartBytes}+${it.repeatLenBytes}` : " (no loop)") +
        ` data@${it.dataAbs}`,
    ),
  );
  console.log(`songs: ${songs.length}`);
  songs.forEach((sg, i) => {
    console.log(`  song[${i}] "${sg.name}" tempo=${sg.tempo}`);
    sg.playlists.forEach((pl, c) =>
      console.log(`    ch${c}: ${pl.length} entries -> [${pl.slice(0, 24).join(",")}${pl.length > 24 ? ",…" : ""}]`),
    );
  });
  console.log(`patterns: ${patternTable.count}`);
}

// ---- conversion to ProTracker MOD ---------------------------------------

const EMPTY = { sample: 0, period: 0, cmd: 0, param: 0 };
const stats = {}; // count AMOS command usage, for visibility
const tally = (k) => (stats[k] = (stats[k] || 0) + 1);

// AMOS tempo -> SoundTracker speed (ticks/row). amos_tempo = 100 / st_speed.
const amosTempoToSpeed = (t) => Math.max(1, Math.min(31, Math.round(100 / (t || 17))));

// Simulate one channel's pattern stream into a list of MOD cells (one per row).
// Continuing effects (porta/vibrato/arp/volslide) are repeated on each sustain row,
// matching how the AMOS player keeps an effect running until changed/stopped.
function simulateChannel(buf, abs) {
  const rows = [];
  let curInstr = 0; // 0-based; MOD sample = curInstr + 1
  let activeEff = null; // {cmd, param} continuing effect
  let oneShot = null; // one-shot effect for the next emitted row
  let hasNote = false;
  let period = 0;
  let p = abs;

  const flush = (delayN) => {
    const eff = oneShot ?? activeEff ?? EMPTY;
    rows.push({ sample: hasNote ? curInstr + 1 : 0, period: hasNote ? period : 0, cmd: eff.cmd, param: eff.param });
    oneShot = null;
    hasNote = false;
    for (let i = 1; i < delayN; i++) {
      const e = activeEff ?? EMPTY;
      rows.push({ sample: 0, period: 0, cmd: e.cmd, param: e.param });
    }
  };

  for (let guard = 0; guard < 200000; guard++) {
    if (p + 2 > buf.length) { tally("eof_stop"); if (hasNote) flush(1); return rows; }
    const w = buf.readUInt16BE(p);
    p += 2;
    if (w & 0x8000) {
      const cmd = (w >> 8) & 0x7f;
      const par = w & 0xff;
      tally("cmd_" + cmd.toString(16).padStart(2, "0"));
      switch (cmd) {
        case 0x00: if (hasNote) flush(1); return rows; // end of pattern
        case 0x09: curInstr = par; break;              // set instrument
        case 0x03: oneShot = { cmd: 0x0c, param: Math.min(par, 64) }; break; // set volume -> C
        case 0x08: oneShot = { cmd: 0x0f, param: amosTempoToSpeed(par) }; break; // tempo -> F
        case 0x10: flush(par || 1); break;             // delay
        case 0x0a: activeEff = { cmd: 0x00, param: par }; break; // arpeggio -> 0
        case 0x0b: activeEff = { cmd: 0x03, param: par }; break; // tone porta -> 3
        case 0x0c: activeEff = { cmd: 0x04, param: par }; break; // vibrato -> 4
        case 0x0d: activeEff = { cmd: 0x0a, param: par }; break; // volume slide -> A
        case 0x0e: activeEff = { cmd: 0x01, param: par }; break; // porta up -> 1
        case 0x0f: activeEff = { cmd: 0x02, param: par }; break; // porta down -> 2
        case 0x04: activeEff = null; break;            // stop effect
        case 0x06: oneShot = { cmd: 0x0e, param: 0x01 }; break; // filter on -> E01
        case 0x07: oneShot = { cmd: 0x0e, param: 0x00 }; break; // filter off -> E00
        case 0x05: oneShot = { cmd: 0x0e, param: 0x60 | (par & 0x0f) }; break; // repeat -> E6x
        case 0x11: if (hasNote) flush(1); return rows; // position jump also fires
          // end-of-pattern (spec). We terminate here and loop the whole module in the
          // browser, so we don't emit a MOD Bxx (its order index wouldn't match our
          // 64-row chunks).
        case 0x01: case 0x02: break;                   // old slides: unsupported by player
        default: break;
      }
    } else {
      period = w & 0x0fff; // Amiga period (bits 12-0; real values <= 856 fit 12 bits)
      hasNote = true;
      tally("note");
    }
  }
  return rows;
}

function extractSamples(parsed) {
  const buf = parsed._buf;
  return parsed.instruments.map((it) => {
    let data = buf.subarray(it.dataAbs, it.dataAbs + it.byteLen);
    if (data.length & 1) data = Buffer.concat([data, Buffer.from([0])]); // MOD wants even length
    return {
      name: it.name.slice(0, 22),
      volume: it.volume,
      data,
      lenWords: data.length >> 1,
      repStartWords: it.repeats ? it.repeatStartBytes >> 1 : 0,
      repLenWords: it.repeats ? Math.max(1, it.repeatLenBytes >> 1) : 1,
    };
  });
}

// Build per-channel timelines (each channel concatenates its own playlist), then
// merge row-by-row into a single 4-channel timeline.
function buildTimeline(parsed, songIndex = 0) {
  const buf = parsed._buf;
  const song = parsed.songs[songIndex];
  const chTimelines = [0, 1, 2, 3].map((c) => {
    const rows = [];
    for (const P of song.playlists[c]) {
      if (P < parsed.patternTable.count) rows.push(...simulateChannel(buf, parsed.patternTable.channelStreamAbs[P][c]));
    }
    return rows;
  });
  const total = Math.max(...chTimelines.map((a) => a.length), 0);
  const timeline = [];
  for (let r = 0; r < total; r++) timeline.push([0, 1, 2, 3].map((c) => chTimelines[c][r] ?? EMPTY));
  return timeline;
}

function cell4(cell) {
  const { sample, period, cmd, param } = cell;
  return Buffer.from([
    (sample & 0xf0) | ((period >> 8) & 0x0f),
    period & 0xff,
    ((sample & 0x0f) << 4) | (cmd & 0x0f),
    param & 0xff,
  ]);
}

function buildMod(title, samples, timeline) {
  const nPat = Math.max(1, Math.ceil(timeline.length / 64));
  const parts = [];
  const pad = (s, n) => { const b = Buffer.alloc(n); b.write(s.slice(0, n), "latin1"); return b; };

  parts.push(pad(title, 20));
  for (let i = 0; i < 31; i++) {
    const s = samples[i];
    const h = Buffer.alloc(30);
    if (s) {
      h.write(s.name, 0, "latin1");
      h.writeUInt16BE(s.lenWords, 22);
      h.writeUInt8(0, 24); // finetune
      h.writeUInt8(s.volume, 25);
      h.writeUInt16BE(s.repStartWords, 26);
      h.writeUInt16BE(s.repLenWords, 28);
    } else {
      h.writeUInt16BE(0, 22);
      h.writeUInt16BE(1, 28); // empty sample: repeat length 1
    }
    parts.push(h);
  }
  const order = Buffer.alloc(128);
  for (let i = 0; i < nPat; i++) order[i] = i;
  parts.push(Buffer.from([nPat])); // song length
  parts.push(Buffer.from([0x7f])); // restart byte
  parts.push(order);
  parts.push(Buffer.from("M.K.", "latin1"));

  for (let pi = 0; pi < nPat; pi++) {
    for (let r = 0; r < 64; r++) {
      const row = timeline[pi * 64 + r];
      for (let c = 0; c < 4; c++) parts.push(cell4(row ? row[c] : EMPTY));
    }
  }
  for (let i = 0; i < 31; i++) if (samples[i]) parts.push(samples[i].data);
  return Buffer.concat(parts);
}

export function convertAbkToMod(buf) {
  const parsed = parseAbk(buf);
  const samples = extractSamples(parsed);
  const timeline = buildTimeline(parsed, 0);
  const mod = buildMod(parsed.songs[0]?.name || "dark castle", samples, timeline);
  return { mod, parsed, rows: timeline.length, nPat: Math.ceil(timeline.length / 64) };
}

// ---- cli -----------------------------------------------------------------

const args = process.argv.slice(2);
if (args[0] === "--dump" && args[1]) {
  dump(parseAbk(await readFile(args[1])));
} else if (args.length === 2) {
  const { writeFile } = await import("node:fs/promises");
  const { mod, rows, nPat } = convertAbkToMod(await readFile(args[0]));
  await writeFile(args[1], mod);
  console.log(`wrote ${args[1]} (${mod.length} bytes, ${rows} rows, ${nPat} patterns)`);
  console.log("AMOS command usage:", JSON.stringify(stats));
} else {
  console.error("usage:\n  node tools/abk2mod.mjs --dump <file.abk>\n  node tools/abk2mod.mjs <in.abk> <out.mod>");
  process.exit(1);
}
