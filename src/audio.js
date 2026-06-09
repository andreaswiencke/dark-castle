// Background music playback for the web port. Plays the original songs (converted
// AMOS music banks, rendered to MP3 in assets/audio/). Browser-only; degrades to a
// no-op where the Audio element is unavailable (e.g. the fake-DOM smoke test).
//
// Faithful mapping (see EINLEITUNG in the AMOS source: "Music Off" when the intro
// ends): title music plays only during the intro, then silence in menu/gameplay;
// the death and ending screens get their own songs.

const TRACKS = { intro: "titel.mp3", death: "tot.mp3", ending: "end.mp3" };

export function createAudio(basePath = "assets/audio/") {
  const supported = typeof Audio !== "undefined";
  let el = null; // the single <audio> element in use
  let wantFile = null; // track that should be playing once unlocked / unmuted
  let muted = false;
  let notify = () => {}; // fired when playback starts/stops, so the UI can show/hide the mute button

  function load(file) {
    if (el && el._file === file) return el;
    if (el) try { el.pause(); } catch {}
    el = new Audio(basePath + file);
    el._file = file;
    el.loop = true;
    el.volume = 0.6;
    return el;
  }
  function tryPlay() {
    if (!supported || muted || !wantFile) return;
    const a = load(wantFile);
    // .play() may reject until the page has had a user gesture (autoplay policy).
    if (a && a.play) Promise.resolve(a.play()).catch(() => {});
  }

  function play(key) {
    wantFile = TRACKS[key] || null;
    if (!wantFile) return stop();
    tryPlay();
    notify();
  }
  function stop() {
    wantFile = null;
    if (el) try { el.pause(); el.currentTime = 0; } catch {}
    notify();
  }
  function setMuted(m) {
    muted = m;
    if (muted) { if (el) try { el.pause(); } catch {} }
    else tryPlay();
  }

  // Start any pending track on the first user gesture (autoplay unlock).
  if (supported && typeof window !== "undefined" && window.addEventListener) {
    const unlock = () => tryPlay();
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
  }

  return {
    play, stop, setMuted,
    isMuted: () => muted,
    isPlaying: () => wantFile != null,           // a track is active (intro / death / ending)
    onPlaybackChange: (cb) => { notify = cb; },   // UI hook to show the mute button only then
    supported,
  };
}
