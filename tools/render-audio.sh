#!/usr/bin/env bash
# Render the converted MODs (tools/abk2mod.mjs output) to looping MP3s for the
# web port. UADE runs the original Amiga replay routine, so the audio is faithful
# to the 1992 original.
#
# Requires: uade123 (brew install uade), ffmpeg.
# Pipeline:  sounds/*.abk  --abk2mod-->  assets/audio/*.mod  --uade+ffmpeg-->  *.mp3
#
# NOTE: only tot/end are rendered this way. The title (titel.ogg) is a direct
# recording of the original AMOS player in fs-uae (captured via BlackHole),
# because UADE could not play TitelSong.abk and its MOD conversion was off.
set -euo pipefail
cd "$(dirname "$0")/.."

for n in tot end; do
  uade123 -1 -w 180 -e wav -f "/tmp/dc_$n.wav" --stderr "assets/audio/$n.mod" >/dev/null 2>&1
  ffmpeg -hide_banner -loglevel error -y -i "/tmp/dc_$n.wav" -codec:a libmp3lame -q:a 5 "assets/audio/$n.mp3"
  echo "rendered assets/audio/$n.mp3 ($(stat -f%z "assets/audio/$n.mp3") bytes)"
done
