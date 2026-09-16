import React, { useCallback, useEffect, useRef, useState } from "react";

const BACKEND_URL = "https://museconvertmxl-production-ae99.up.railway.app";

// The backend runs the whole pipeline (OMR -> transpose -> engrave) inside
// a single request and streams the finished PDF straight back — there's no
// job id and no /status endpoint to poll. We give the request plenty of
// time and simulate the stage track locally, since the backend doesn't
// expose granular progress.
const CLIENT_TIMEOUT_MS = 18 * 60 * 1000;

const GROUPS = [
  { name: "Strings", instruments: ["Violin", "Viola", "Cello", "Double Bass"] },
  {
    name: "Woodwinds",
    instruments: [
      "Piccolo", "Flute", "Alto Flute", "Oboe", "Oboe d'amore", "English Horn",
      "Heckelphone", "Bass Oboe", "Bassoon", "Contrabassoon",
      "Clarinet in Bb", "Clarinet in A", "Clarinet in Eb", "Basset Horn", "Bass Clarinet",
      "Saxophone Bb Soprano", "Saxophone Eb Alto", "Saxophone Bb Tenor",
      "Saxophone Eb Baritone", "Saxophone Bb Bass", "Saxophone Eb Contrabass",
    ],
  },
  {
    name: "Brass",
    instruments: [
      "Horn in F", "Trumpet in C", "Trumpet in Bb", "Trumpet in A",
      "Piccolo Trumpet Bb", "Piccolo Trumpet A", "Cornet in Bb", "Flugelhorn",
      "Posthorn", "Pocket Trumpet", "Alto Trombone", "Tenor Trombone",
      "Bass Trombone", "Contrabass Trombone", "Euphonium", "Tenor Tuba",
      "Tuba Bb", "Tuba Eb",
    ],
  },
  {
    name: "Percussion",
    instruments: ["Timpani", "Xylophone", "Marimba", "Orchestra Bells", "Glockenspiel", "Vibraphone", "Chimes"],
  },
  { name: "Other", instruments: ["Guitar"] },
];

// Mirrors the backend's clef assignment logic so the instrument the person
// picks visibly matches what the engraved score will actually use.
const ALTO_CLEF_INSTRUMENTS = new Set(["Viola"]);
const BASS_CLEF_INSTRUMENTS = new Set([
  "Cello", "Double Bass", "Bassoon", "Contrabassoon",
  "Tenor Trombone", "Bass Trombone", "Contrabass Trombone",
  "Euphonium", "Tenor Tuba", "Tuba Bb", "Tuba Eb", "Timpani",
]);
function clefFor(instrument) {
  if (ALTO_CLEF_INSTRUMENTS.has(instrument)) return "𝄡";
  if (BASS_CLEF_INSTRUMENTS.has(instrument)) return "𝄢";
  return "𝄞";
}

const PROGRESS_STAGES = [
  { key: "reading_pdf", label: "Reading" },
  { key: "extracting_music", label: "Extracting" },
  { key: "transposing", label: "Transposing" },
  { key: "generating_pdf", label: "Engraving" },
];
const PROCESSING_STAGE_KEYS = PROGRESS_STAGES.map((s) => s.key);

/* ============================================================
   ICONS
============================================================ */

function UploadIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 16V4m0 0-4 4m4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 15v4a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function FileIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M6 3h9l5 5v13H6V3Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M15 3v5h5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="m19.5 19.5-4.3-4.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function XIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function CheckIcon({ size = 17 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="m5 12 4.2 4.2L19 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CornerBrackets() {
  return (
    <>
      <span className="mc-corner mc-corner-tl" />
      <span className="mc-corner mc-corner-tr" />
      <span className="mc-corner mc-corner-bl" />
      <span className="mc-corner mc-corner-br" />
    </>
  );
}

/* ============================================================
   HELPERS
============================================================ */

function formatElapsed(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, "0")}`;
}

/* ============================================================
   MAIN
============================================================ */

export default function MuseConvert() {
  const [file, setFile] = useState(null);
  const [originalInst, setOriginalInst] = useState("");
  const [finalInst, setFinalInst] = useState("");

  const [stage, setStage] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [downloadFilename, setDownloadFilename] = useState(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  const [dragActive, setDragActive] = useState(false);
  const [instrumentPicker, setInstrumentPicker] = useState(null);
  const [instrumentSearch, setInstrumentSearch] = useState("");

  const fileRef = useRef(null);
  const pickerRef = useRef(null);
  const submittingRef = useRef(false);
  const abortRef = useRef(null);
  const stageTimersRef = useRef([]);

  const isProcessing = PROCESSING_STAGE_KEYS.includes(stage);
  const currentStageIndex = PROGRESS_STAGES.findIndex((s) => s.key === stage);
  const showConverter = !isProcessing && stage !== "done" && stage !== "error";

  /* file handling */

  const handleFile = useCallback((selectedFile) => {
    if (!selectedFile) return;
    if (!selectedFile.name.toLowerCase().endsWith(".pdf")) {
      setErrorMsg("MuseConvert accepts PDF scores only.");
      return;
    }
    setFile(selectedFile);
    setErrorMsg("");
    setStage("idle");
    setDownloadUrl(null);
    setDownloadFilename(null);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragActive(false);
      const f = e.dataTransfer.files?.[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  useEffect(() => {
    const onClick = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setInstrumentPicker(null);
        setInstrumentSearch("");
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (!isProcessing) return;
    const start = Date.now();
    setElapsedMs(0);
    const id = setInterval(() => setElapsedMs(Date.now() - start), 500);
    return () => clearInterval(id);
  }, [isProcessing]);

  useEffect(() => {
    return () => {
      stageTimersRef.current.forEach(clearTimeout);
      if (abortRef.current) abortRef.current.abort();
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearStageTimers = () => {
    stageTimersRef.current.forEach(clearTimeout);
    stageTimersRef.current = [];
  };

  /* conversion */

  const handleConvert = async () => {
    if (submittingRef.current) return;
    if (!file) return setErrorMsg("Add a PDF score to get started.");
    if (!originalInst || !finalInst) return setErrorMsg("Choose both instruments.");
    if (originalInst === finalInst) return setErrorMsg("Choose a different destination instrument.");

    submittingRef.current = true;
    clearStageTimers();
    setErrorMsg("");
    setDownloadUrl(null);
    setDownloadFilename(null);
    setStage("reading_pdf");

    stageTimersRef.current.push(setTimeout(() => setStage("extracting_music"), 1400));

    const controller = new AbortController();
    abortRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("original_instrument", originalInst);
      form.append("final_instrument", finalInst);

      const res = await fetch(`${BACKEND_URL}/convert-pdf`, {
        method: "POST",
        body: form,
        signal: controller.signal,
      });

      if (!res.ok) {
        let message = "The conversion could not be completed.";
        try {
          const data = await res.json();
          if (data?.error) message = data.error;
        } catch {}
        throw new Error(message);
      }

      clearStageTimers();
      setStage("transposing");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const disposition = res.headers.get("content-disposition");
      const match = disposition && /filename="?([^";]+)"?/i.exec(disposition);
      const filename = match ? match[1] : `converted_${file.name.replace(/\.pdf$/i, "")}.pdf`;

      stageTimersRef.current.push(setTimeout(() => setStage("generating_pdf"), 350));
      stageTimersRef.current.push(
        setTimeout(() => {
          setDownloadUrl(url);
          setDownloadFilename(filename);
          setStage("done");
        }, 700)
      );
    } catch (error) {
      clearStageTimers();
      setErrorMsg(
        error?.name === "AbortError"
          ? "The request took too long and was cancelled."
          : error?.message || "Something went wrong while converting the score."
      );
      setStage("error");
    } finally {
      clearTimeout(timeout);
      submittingRef.current = false;
      abortRef.current = null;
    }
  };

  const handleDownload = () => {
    if (!downloadUrl) return;
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = downloadFilename || "converted-score.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetConverter = () => {
    clearStageTimers();
    if (abortRef.current) abortRef.current.abort();
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setFile(null);
    setOriginalInst("");
    setFinalInst("");
    setStage("idle");
    setErrorMsg("");
    setDownloadUrl(null);
    setDownloadFilename(null);
    setInstrumentPicker(null);
    setInstrumentSearch("");
    setDragActive(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const chooseInstrument = (instrument) => {
    if (instrumentPicker === "source") setOriginalInst(instrument);
    else setFinalInst(instrument);
    setInstrumentPicker(null);
    setInstrumentSearch("");
    setErrorMsg("");
  };

  const filteredGroups = GROUPS.map((g) => ({
    ...g,
    instruments: g.instruments.filter((i) => i.toLowerCase().includes(instrumentSearch.toLowerCase())),
  })).filter((g) => g.instruments.length > 0);

  const activeInstrument = instrumentPicker === "source" ? originalInst : finalInst;

  /* progress track position, as a 0..1 fraction */
  const trackProgress =
    currentStageIndex >= 0 ? currentStageIndex / (PROGRESS_STAGES.length - 1) : 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,500;0,600;1,500;1,600&family=Inter:wght@400;500;600&display=swap');

        :root {
          --ink: #0b0b0a;
          --ink-2: #131211;
          --ink-3: #171615;

          --paper: #f3ecdd;
          --paper-dim: #b3a891;
          --paper-faint: #6c6353;

          --line: rgba(243,236,221,0.10);
          --line-strong: rgba(243,236,221,0.24);

          --wine: #a3423a;
          --wine-light: #cf7264;
          --wine-deep: #4a1e1a;
          --wine-wash: rgba(163,66,58,0.14);

          --bad: #d9836f;
        }

        * { box-sizing: border-box; }
        html, body { margin: 0; background: var(--ink); }
        button, input { font: inherit; color: inherit; }
        button { -webkit-tap-highlight-color: transparent; }

        .mc-app {
          position: relative;
          min-height: 100vh;
          background: var(--ink);
          color: var(--paper);
          font-family: "Inter", sans-serif;
        }

        .mc-grain {
          position: fixed;
          inset: 0;
          z-index: 50;
          pointer-events: none;
          opacity: 0.035;
          mix-blend-mode: overlay;
        }

        .mc-shell {
          width: min(720px, calc(100% - 40px));
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        /* NAV */
        .mc-nav {
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--line);
        }
        .mc-brand {
          font-family: "Fraunces", serif;
          font-style: italic;
          font-weight: 500;
          font-size: 19px;
          letter-spacing: 0.01em;
        }
        .mc-nav-tag {
          font-size: 12px;
          color: var(--paper-faint);
        }

        /* HERO BAND — full-bleed so the watermark clef can run to the
           viewport edge regardless of the shell's max-width */
        .mc-hero-band {
          position: relative;
          overflow: hidden;
        }
        .mc-hero-clef {
          position: absolute;
          top: 50%;
          right: -40px;
          transform: translateY(-52%);
          font-family: "Fraunces", serif;
          font-size: 320px;
          line-height: 1;
          color: transparent;
          -webkit-text-stroke: 1px var(--line-strong);
          user-select: none;
          pointer-events: none;
        }
        .mc-hero {
          padding: 54px 0 50px;
          position: relative;
        }
        .mc-hero h1 {
          margin: 0;
          max-width: 11ch;
          font-family: "Fraunces", serif;
          font-weight: 500;
          font-size: clamp(36px, 6vw, 52px);
          line-height: 1.05;
          letter-spacing: -0.01em;
        }
        .mc-hero h1 em {
          font-style: italic;
          color: var(--wine-light);
        }
        .mc-hero p {
          margin: 16px 0 0;
          max-width: 38ch;
          color: var(--paper-dim);
          font-size: 14.5px;
          line-height: 1.7;
        }

        /* CARD — engraved-plate framing: an outer line and an inset line */
        .mc-plate {
          position: relative;
          border: 1px solid var(--line-strong);
          border-radius: 3px;
          background: var(--ink-2);
          padding: 7px;
          margin-bottom: 56px;
        }
        .mc-plate::before {
          content: "";
          position: absolute;
          inset: 7px;
          border: 1px solid var(--line);
          border-radius: 2px;
          pointer-events: none;
        }
        .mc-plate-inner { position: relative; }

        .mc-section {
          padding: 28px 28px 26px;
        }
        .mc-section + .mc-section {
          border-top: 1px solid var(--line);
        }

        .mc-label {
          font-size: 12px;
          font-weight: 500;
          color: var(--paper-faint);
          margin-bottom: 13px;
          letter-spacing: 0.02em;
        }

        /* DROPZONE — corner-mounted like a photo corner */
        .mc-dropzone {
          position: relative;
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 22px 20px;
          cursor: pointer;
          transition: background 160ms ease;
        }
        .mc-dropzone:hover, .mc-dropzone.active {
          background: var(--wine-wash);
        }
        .mc-corner {
          position: absolute;
          width: 16px;
          height: 16px;
          border-color: var(--line-strong);
          transition: border-color 160ms ease;
        }
        .mc-dropzone:hover .mc-corner, .mc-dropzone.active .mc-corner {
          border-color: var(--wine-light);
        }
        .mc-corner-tl { top: 0; left: 0; border-top: 1.5px solid; border-left: 1.5px solid; }
        .mc-corner-tr { top: 0; right: 0; border-top: 1.5px solid; border-right: 1.5px solid; }
        .mc-corner-bl { bottom: 0; left: 0; border-bottom: 1.5px solid; border-left: 1.5px solid; }
        .mc-corner-br { bottom: 0; right: 0; border-bottom: 1.5px solid; border-right: 1.5px solid; }

        .mc-dropzone-icon {
          flex: none;
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          border: 1px solid var(--line-strong);
          color: var(--wine-light);
        }
        .mc-dropzone-copy strong {
          display: block;
          font-size: 14.5px;
          font-weight: 500;
        }
        .mc-dropzone-copy span {
          display: block;
          margin-top: 3px;
          color: var(--paper-faint);
          font-size: 12px;
        }

        .mc-file-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 18px;
          border: 1px solid var(--line-strong);
          border-radius: 2px;
        }
        .mc-file-row-icon {
          flex: none;
          width: 32px;
          height: 32px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          border: 1px solid var(--line-strong);
          color: var(--wine-light);
        }
        .mc-file-row-info { min-width: 0; flex: 1; }
        .mc-file-row-name {
          font-size: 13.5px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .mc-file-row-meta {
          margin-top: 1px;
          color: var(--paper-faint);
          font-size: 11.5px;
        }
        .mc-file-row-remove {
          flex: none;
          width: 26px;
          height: 26px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          border: none;
          background: transparent;
          color: var(--paper-faint);
          cursor: pointer;
        }
        .mc-file-row-remove:hover { color: var(--paper); background: rgba(255,255,255,0.05); }

        /* INSTRUMENTS */
        .mc-instruments {
          display: flex;
          align-items: stretch;
          gap: 0;
          border: 1px solid var(--line-strong);
          border-radius: 2px;
        }
        .mc-instrument { position: relative; flex: 1; min-width: 0; }
        .mc-instrument + .mc-instrument { border-left: 1px dashed var(--line-strong); }

        .mc-instrument-select {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 15px 14px;
          border: 0;
          background: transparent;
          text-align: left;
          cursor: pointer;
        }
        .mc-instrument-select:hover, .mc-instrument-select.selected {
          background: var(--wine-wash);
        }
        .mc-instrument-clef {
          flex: none;
          font-family: "Fraunces", serif;
          font-size: 26px;
          color: var(--wine-light);
          width: 20px;
          text-align: center;
        }
        .mc-instrument-clef.placeholder { color: var(--paper-faint); opacity: 0.5; }
        .mc-instrument-text { min-width: 0; }
        .mc-instrument-caption {
          font-size: 10.5px;
          color: var(--paper-faint);
        }
        .mc-instrument-value {
          margin-top: 2px;
          font-size: 13.5px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .mc-instrument-value.placeholder { color: var(--paper-faint); font-weight: 400; }

        /* PICKER */
        .mc-picker {
          position: absolute;
          z-index: 30;
          top: calc(100% + 8px);
          left: 0;
          width: min(280px, 85vw);
          padding: 8px;
          border: 1px solid var(--line-strong);
          background: var(--ink-3);
          box-shadow: 0 24px 60px rgba(0,0,0,0.5);
        }
        .mc-picker-search {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 10px;
          border: 1px solid var(--line);
          color: var(--paper-faint);
        }
        .mc-picker-search input {
          width: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          font-size: 13px;
        }
        .mc-picker-list { max-height: 240px; margin-top: 6px; overflow-y: auto; }
        .mc-picker-group-name {
          padding: 8px 8px 4px;
          font-size: 11px;
          font-weight: 600;
          color: var(--paper-faint);
        }
        .mc-picker-option {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 7px 8px;
          border: 0;
          background: transparent;
          text-align: left;
          font-size: 13px;
          cursor: pointer;
        }
        .mc-picker-option-clef {
          flex: none;
          width: 16px;
          font-family: "Fraunces", serif;
          font-size: 15px;
          color: var(--wine-light);
          opacity: 0.75;
          text-align: center;
        }
        .mc-picker-option:hover { background: rgba(255,255,255,0.05); }
        .mc-picker-option.current { background: var(--wine-wash); color: var(--wine-light); }
        .mc-picker-empty { padding: 14px 8px; color: var(--paper-faint); font-size: 13px; }

        /* ACTION — wax-seal style button */
        .mc-convert-button {
          width: 100%;
          min-height: 50px;
          border: 0;
          border-radius: 999px;
          background: linear-gradient(180deg, var(--wine-light), var(--wine));
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.25),
            0 10px 24px rgba(163,66,58,0.28);
          color: #2a0f0c;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.03em;
          cursor: pointer;
          transition: transform 120ms ease, box-shadow 120ms ease;
        }
        .mc-convert-button:hover:not(:disabled) { transform: translateY(-1px); }
        .mc-convert-button:active:not(:disabled) {
          transform: translateY(0px) scale(0.98);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 10px rgba(163,66,58,0.25);
        }
        .mc-convert-button:disabled {
          background: var(--ink-3);
          box-shadow: none;
          color: var(--paper-faint);
          cursor: not-allowed;
        }

        .mc-error {
          margin-top: 13px;
          padding: 11px 13px;
          border: 1px solid rgba(217,131,111,0.3);
          border-radius: 2px;
          background: rgba(217,131,111,0.08);
          color: var(--bad);
          font-size: 12.5px;
          line-height: 1.5;
        }

        /* PROCESSING */
        .mc-processing { padding: 46px 30px 42px; text-align: center; }
        .mc-processing h2 {
          margin: 0;
          font-family: "Fraunces", serif;
          font-weight: 500;
          font-size: 24px;
        }
        .mc-processing p {
          margin: 8px 0 0;
          color: var(--paper-dim);
          font-size: 13.5px;
        }

        .mc-track-wrap {
          margin: 42px auto 0;
          max-width: 440px;
        }
        .mc-track {
          position: relative;
          height: 2px;
          background: var(--line-strong);
        }
        .mc-track-fill {
          position: absolute;
          top: 0; left: 0; bottom: 0;
          background: var(--wine-light);
          transition: width 500ms ease;
        }
        .mc-track-note {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          font-family: "Fraunces", serif;
          font-size: 22px;
          color: var(--wine-light);
          transition: left 500ms ease;
          animation: mc-bob 1.4s ease-in-out infinite;
        }
        @keyframes mc-bob {
          0%, 100% { margin-top: 0; }
          50% { margin-top: -4px; }
        }
        .mc-track-ticks {
          display: flex;
          justify-content: space-between;
          margin-top: 16px;
        }
        .mc-track-tick {
          font-size: 11.5px;
          color: var(--paper-faint);
          text-align: center;
        }
        .mc-track-tick.reached { color: var(--paper); }
        .mc-track-tick:first-child { text-align: left; }
        .mc-track-tick:last-child { text-align: right; }

        .mc-elapsed {
          margin-top: 26px;
          font-size: 12px;
          color: var(--paper-faint);
        }

        /* RESULT */
        .mc-result { padding: 50px 28px 46px; text-align: center; }
        .mc-result-icon {
          width: 44px; height: 44px;
          margin: 0 auto 16px;
          display: grid; place-items: center;
          border-radius: 50%;
          border: 1px solid var(--line-strong);
          color: var(--wine-light);
        }
        .mc-result-icon.bad { color: var(--bad); border-color: rgba(217,131,111,0.4); }
        .mc-result h2 {
          margin: 0;
          font-family: "Fraunces", serif;
          font-weight: 500;
          font-size: 25px;
        }
        .mc-result p {
          max-width: 40ch;
          margin: 9px auto 24px;
          color: var(--paper-dim);
          font-size: 13.5px;
          line-height: 1.6;
        }
        .mc-result-route {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 24px;
          padding: 8px 14px;
          border: 1px solid var(--line-strong);
          border-radius: 999px;
          font-size: 12.5px;
        }
        .mc-result-route span.clef { font-family: "Fraunces", serif; font-size: 16px; color: var(--wine-light); }
        .mc-result-actions { display: flex; justify-content: center; gap: 10px; }
        .mc-download, .mc-again {
          min-height: 42px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 22px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }
        .mc-download {
          border: 0;
          background: linear-gradient(180deg, var(--wine-light), var(--wine));
          color: #2a0f0c;
        }
        .mc-download:hover { filter: brightness(1.06); }
        .mc-again { border: 1px solid var(--line-strong); background: none; color: var(--paper-dim); }
        .mc-again:hover { border-color: var(--paper-faint); color: var(--paper); }

        .mc-footer {
          padding: 0 0 44px;
          text-align: center;
          color: var(--paper-faint);
          font-size: 11.5px;
        }

        @media (max-width: 560px) {
          .mc-hero-clef { font-size: 220px; right: -60px; }
          .mc-instruments { flex-direction: column; }
          .mc-instrument + .mc-instrument { border-left: 0; border-top: 1px dashed var(--line-strong); }
          .mc-picker { width: 100%; }
          .mc-result-actions { flex-direction: column; }
          .mc-download, .mc-again { width: 100%; }
          .mc-section { padding: 22px; }
        }
      `}</style>

      <div className="mc-app">
        <svg width="0" height="0" style={{ position: "absolute" }}>
          <filter id="mc-noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
          </filter>
        </svg>
        <div className="mc-grain" style={{ filter: "url(#mc-noise)" }} />

        <div className="mc-hero-band">
          <div className="mc-hero-clef">𝄞</div>
          <div className="mc-shell">
            <nav className="mc-nav">
              <div className="mc-brand">MuseConvert</div>
              <div className="mc-nav-tag">PDF in, PDF out</div>
            </nav>

            <section className="mc-hero">
              <h1>
                Sheet music, <em>re-engraved</em> for a new instrument.
              </h1>
              <p>
                Upload a PDF score and choose the instrument it should play
                on. MuseConvert reads the notation, transposes it, and lays
                out a clean new part.
              </p>
            </section>
          </div>
        </div>

        <div className="mc-shell">
          <div className="mc-plate">
            <div className="mc-plate-inner">
              {showConverter && (
                <>
                  <div className="mc-section">
                    <div className="mc-label">Score</div>

                    <input
                      ref={fileRef}
                      type="file"
                      accept=".pdf,application/pdf"
                      style={{ display: "none" }}
                      onChange={(e) => handleFile(e.target.files?.[0])}
                    />

                    {!file ? (
                      <div
                        className={`mc-dropzone ${dragActive ? "active" : ""}`}
                        onClick={() => fileRef.current?.click()}
                        onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
                        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                        onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                        onDrop={handleDrop}
                      >
                        <CornerBrackets />
                        <div className="mc-dropzone-icon"><UploadIcon /></div>
                        <div className="mc-dropzone-copy">
                          <strong>Drop a PDF here, or click to browse</strong>
                          <span>One file, sheet music only</span>
                        </div>
                      </div>
                    ) : (
                      <div className="mc-file-row">
                        <div className="mc-file-row-icon"><FileIcon /></div>
                        <div className="mc-file-row-info">
                          <div className="mc-file-row-name">{file.name}</div>
                          <div className="mc-file-row-meta">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                        </div>
                        <button className="mc-file-row-remove" onClick={resetConverter} type="button" aria-label="Remove file">
                          <XIcon />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mc-section">
                    <div className="mc-label">Instruments</div>
                    <div className="mc-instruments">
                      <div className="mc-instrument" ref={instrumentPicker === "source" ? pickerRef : null}>
                        <button
                          type="button"
                          className={`mc-instrument-select ${originalInst ? "selected" : ""}`}
                          onClick={() => setInstrumentPicker(instrumentPicker === "source" ? null : "source")}
                        >
                          <span className={`mc-instrument-clef ${originalInst ? "" : "placeholder"}`}>
                            {originalInst ? clefFor(originalInst) : "𝄞"}
                          </span>
                          <span className="mc-instrument-text">
                            <span className="mc-instrument-caption">Written for</span>
                            <span className={`mc-instrument-value ${originalInst ? "" : "placeholder"}`}>
                              {originalInst || "Choose instrument"}
                            </span>
                          </span>
                        </button>
                        {instrumentPicker === "source" && (
                          <InstrumentPicker
                            search={instrumentSearch}
                            setSearch={setInstrumentSearch}
                            groups={filteredGroups}
                            activeInstrument={activeInstrument}
                            onChoose={chooseInstrument}
                          />
                        )}
                      </div>

                      <div className="mc-instrument" ref={instrumentPicker === "target" ? pickerRef : null}>
                        <button
                          type="button"
                          className={`mc-instrument-select ${finalInst ? "selected" : ""}`}
                          onClick={() => setInstrumentPicker(instrumentPicker === "target" ? null : "target")}
                        >
                          <span className={`mc-instrument-clef ${finalInst ? "" : "placeholder"}`}>
                            {finalInst ? clefFor(finalInst) : "𝄞"}
                          </span>
                          <span className="mc-instrument-text">
                            <span className="mc-instrument-caption">Transpose to</span>
                            <span className={`mc-instrument-value ${finalInst ? "" : "placeholder"}`}>
                              {finalInst || "Choose instrument"}
                            </span>
                          </span>
                        </button>
                        {instrumentPicker === "target" && (
                          <InstrumentPicker
                            search={instrumentSearch}
                            setSearch={setInstrumentSearch}
                            groups={filteredGroups}
                            activeInstrument={activeInstrument}
                            onChoose={chooseInstrument}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mc-section">
                    <button
                      type="button"
                      className="mc-convert-button"
                      onClick={handleConvert}
                      disabled={!file || !originalInst || !finalInst || originalInst === finalInst}
                    >
                      Convert score
                    </button>
                    {errorMsg && <div className="mc-error">{errorMsg}</div>}
                  </div>
                </>
              )}

              {isProcessing && (
                <div className="mc-processing">
                  <h2>Converting your score</h2>
                  <p>{originalInst} to {finalInst}</p>

                  <div className="mc-track-wrap">
                    <div className="mc-track">
                      <div className="mc-track-fill" style={{ width: `${trackProgress * 100}%` }} />
                      <div className="mc-track-note" style={{ left: `${trackProgress * 100}%` }}>♩</div>
                    </div>
                    <div className="mc-track-ticks">
                      {PROGRESS_STAGES.map((s, i) => (
                        <div key={s.key} className={`mc-track-tick ${i <= currentStageIndex ? "reached" : ""}`}>
                          {s.label}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mc-elapsed">{formatElapsed(elapsedMs)} elapsed — larger scores can take a few minutes</div>
                </div>
              )}

              {stage === "done" && (
                <div className="mc-result">
                  <div className="mc-result-icon"><CheckIcon /></div>
                  <h2>Your score is ready</h2>
                  <p>The part has been rewritten and re-engraved for its new instrument.</p>
                  <div className="mc-result-route">
                    <span className="clef">{clefFor(originalInst)}</span>
                    {originalInst}
                    <span style={{ color: "var(--paper-faint)" }}>→</span>
                    <span className="clef">{clefFor(finalInst)}</span>
                    {finalInst}
                  </div>
                  <div className="mc-result-actions">
                    <button type="button" className="mc-download" onClick={handleDownload}>Download PDF</button>
                    <button type="button" className="mc-again" onClick={resetConverter}>Convert another</button>
                  </div>
                </div>
              )}

              {stage === "error" && (
                <div className="mc-result">
                  <div className="mc-result-icon bad"><XIcon size={19} /></div>
                  <h2>Conversion failed</h2>
                  <p>{errorMsg || "MuseConvert couldn't finish converting this score."}</p>
                  <div className="mc-result-actions">
                    <button type="button" className="mc-download" onClick={handleConvert}>Try again</button>
                    <button type="button" className="mc-again" onClick={resetConverter}>Start over</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <footer className="mc-footer">© {new Date().getFullYear()} MuseConvert</footer>
        </div>
      </div>
    </>
  );
}

/* ============================================================
   INSTRUMENT PICKER
============================================================ */

function InstrumentPicker({ search, setSearch, groups, activeInstrument, onChoose }) {
  return (
    <div className="mc-picker">
      <div className="mc-picker-search">
        <SearchIcon />
        <input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search instruments"
        />
      </div>
      <div className="mc-picker-list">
        {groups.map((group) => (
          <div key={group.name}>
            <div className="mc-picker-group-name">{group.name}</div>
            {group.instruments.map((instrument) => (
              <button
                type="button"
                key={instrument}
                className={`mc-picker-option ${activeInstrument === instrument ? "current" : ""}`}
                onClick={() => onChoose(instrument)}
              >
                <span className="mc-picker-option-clef">{clefFor(instrument)}</span>
                {instrument}
              </button>
            ))}
          </div>
        ))}
        {groups.length === 0 && <div className="mc-picker-empty">No instruments found.</div>}
      </div>
    </div>
  );
}
