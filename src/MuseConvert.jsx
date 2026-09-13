import React, { useCallback, useEffect, useRef, useState } from "react";

const BACKEND_URL =
  "https://museconvertmxl-production-ae99.up.railway.app";

// The backend runs the whole pipeline (OMR -> transpose -> engrave) inside
// a single request and streams the finished PDF straight back — there's no
// job id and no /status endpoint to poll. We give the request plenty of
// time to finish and simulate the stage indicator's progress locally, since
// the backend doesn't expose granular status.
const CLIENT_TIMEOUT_MS = 18 * 60 * 1000;

const GROUPS = [
  {
    name: "Strings",
    instruments: ["Violin", "Viola", "Cello", "Double Bass"],
  },
  {
    name: "Woodwinds",
    instruments: [
      "Piccolo",
      "Flute",
      "Alto Flute",
      "Oboe",
      "Oboe d'amore",
      "English Horn",
      "Heckelphone",
      "Bass Oboe",
      "Bassoon",
      "Contrabassoon",
      "Clarinet in Bb",
      "Clarinet in A",
      "Clarinet in Eb",
      "Basset Horn",
      "Bass Clarinet",
      "Saxophone Bb Soprano",
      "Saxophone Eb Alto",
      "Saxophone Bb Tenor",
      "Saxophone Eb Baritone",
      "Saxophone Bb Bass",
      "Saxophone Eb Contrabass",
    ],
  },
  {
    name: "Brass",
    instruments: [
      "Horn in F",
      "Trumpet in C",
      "Trumpet in Bb",
      "Trumpet in A",
      "Piccolo Trumpet Bb",
      "Piccolo Trumpet A",
      "Cornet in Bb",
      "Flugelhorn",
      "Posthorn",
      "Pocket Trumpet",
      "Alto Trombone",
      "Tenor Trombone",
      "Bass Trombone",
      "Contrabass Trombone",
      "Euphonium",
      "Tenor Tuba",
      "Tuba Bb",
      "Tuba Eb",
    ],
  },
  {
    name: "Percussion",
    instruments: [
      "Timpani",
      "Xylophone",
      "Marimba",
      "Orchestra Bells",
      "Glockenspiel",
      "Vibraphone",
      "Chimes",
    ],
  },
  {
    name: "Other",
    instruments: ["Guitar"],
  },
];

const PROGRESS_STAGES = [
  {
    key: "reading_pdf",
    label: "Reading score",
    description: "Opening your PDF",
  },
  {
    key: "extracting_music",
    label: "Extracting music",
    description: "Understanding the notation",
  },
  {
    key: "transposing",
    label: "Transposing",
    description: "Rewriting for your instrument",
  },
  {
    key: "generating_pdf",
    label: "Generating PDF",
    description: "Preparing your new score",
  },
  {
    key: "done",
    label: "Score ready",
    description: "Your score is complete",
  },
];

const PROCESSING_STAGE_KEYS = PROGRESS_STAGES.slice(0, 4).map((s) => s.key);

/* ============================================================
   ICONS
============================================================ */

function LogoMark() {
  return (
    <svg viewBox="0 0 40 40" width="32" height="32" fill="none">
      <rect
        x="1"
        y="1"
        width="38"
        height="38"
        rx="12"
        stroke="currentColor"
        strokeWidth="1"
      />
      <path
        d="M22.5 8.5v17.3c0 3.2-2 5.4-5 5.4-2.2 0-3.8-1.2-3.8-3s1.6-3 4.2-3c1.1 0 2.1.2 2.9.6V12.2l10-2.4v12.8c0 3.2-2 5.4-5 5.4-2.2 0-3.8-1.2-3.8-3s1.6-3 4.2-3c1.1 0 2.1.2 2.9.6V10.7"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="27" height="27" viewBox="0 0 32 32" fill="none">
      <path
        d="M16 21V6m0 0-5 5m5-5 5 5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 17v7.5A1.5 1.5 0 0 0 9.5 26h13a1.5 1.5 0 0 0 1.5-1.5V17"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="25" height="25" viewBox="0 0 32 32" fill="none">
      <path
        d="M8 4h11l6 6v18H8V4Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M19 4v7h6M12 17h8M12 21h6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle
        cx="10.8"
        cy="10.8"
        r="6.3"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="m16 16 4.3 4.3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="m6 6 12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path
        d="m7 9 5 5 5-5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 12h13M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="m5 12 4.2 4.2L19 6.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MusicIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M9 18V5l10-2v13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="6.5" cy="18" r="3" stroke="currentColor" strokeWidth="1.5" />
      <circle
        cx="16.5"
        cy="16"
        r="3"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function SwapIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
      <path
        d="M7 7h12l-3-3M17 17H5l3 3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ============================================================
   MUSIC STAFF
============================================================ */

function MusicStaff() {
  return (
    <svg
      className="mc-staff"
      viewBox="0 0 1000 150"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <g className="mc-staff-lines">
        <line x1="0" y1="48" x2="1000" y2="48" />
        <line x1="0" y1="63" x2="1000" y2="63" />
        <line x1="0" y1="78" x2="1000" y2="78" />
        <line x1="0" y1="93" x2="1000" y2="93" />
        <line x1="0" y1="108" x2="1000" y2="108" />
      </g>

      <g className="mc-staff-notes">
        <text x="80" y="101">
          ♪
        </text>
        <text x="195" y="75">
          ♫
        </text>
        <text x="330" y="105">
          ♪
        </text>
        <text x="470" y="79">
          ♩
        </text>
        <text x="605" y="105">
          ♪
        </text>
        <text x="730" y="72">
          ♫
        </text>
        <text x="855" y="99">
          ♪
        </text>
      </g>
    </svg>
  );
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

  const [dragActive, setDragActive] = useState(false);
  const [instrumentPicker, setInstrumentPicker] = useState(null);
  const [instrumentSearch, setInstrumentSearch] = useState("");

  const fileRef = useRef(null);
  const pickerRef = useRef(null);
  const submittingRef = useRef(false);
  const abortRef = useRef(null);
  const stageTimersRef = useRef([]);

  const isProcessing = PROCESSING_STAGE_KEYS.includes(stage);

  const currentStageIndex = PROGRESS_STAGES.findIndex(
    (item) => item.key === stage
  );

  /* ============================================================
     FILE HANDLING
  ============================================================ */

  const handleFile = useCallback((selectedFile) => {
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith(".pdf")) {
      setErrorMsg("MuseConvert currently accepts PDF scores only.");
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setErrorMsg("");
    setStage("idle");
    setDownloadUrl(null);
    setDownloadFilename(null);
  }, []);

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault();
      setDragActive(false);

      const droppedFile = event.dataTransfer.files?.[0];

      if (droppedFile) {
        handleFile(droppedFile);
      }
    },
    [handleFile]
  );

  /* ============================================================
     CLOSE PICKER
  ============================================================ */

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target)
      ) {
        setInstrumentPicker(null);
        setInstrumentSearch("");
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  /* ============================================================
     CLEANUP ON UNMOUNT
  ============================================================ */

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

  /* ============================================================
     CONVERSION
  ============================================================ */

  const handleConvert = async () => {
    if (submittingRef.current) return;

    if (!file) {
      setErrorMsg("Add a PDF score to get started.");
      return;
    }

    if (!originalInst || !finalInst) {
      setErrorMsg(
        "Choose both the source and destination instruments."
      );
      return;
    }

    if (originalInst === finalInst) {
      setErrorMsg(
        "Choose a different destination instrument to transpose the score."
      );
      return;
    }

    submittingRef.current = true;
    clearStageTimers();
    setErrorMsg("");
    setDownloadUrl(null);
    setDownloadFilename(null);
    setStage("reading_pdf");

    // The backend doesn't report real progress, so the stage indicator
    // advances on a simple timer and then parks on "extracting_music"
    // (the long-running OMR step) until the request actually resolves.
    stageTimersRef.current.push(
      setTimeout(() => setStage("extracting_music"), 1500)
    );

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
        } catch (_) {
          // response wasn't JSON, fall back to the generic message
        }
        throw new Error(message);
      }

      clearStageTimers();
      setStage("transposing");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const disposition = res.headers.get("content-disposition");
      const match = disposition && /filename="?([^";]+)"?/i.exec(disposition);
      const filename = match
        ? match[1]
        : `converted_${file.name.replace(/\.pdf$/i, "")}.pdf`;

      stageTimersRef.current.push(
        setTimeout(() => setStage("generating_pdf"), 350)
      );
      stageTimersRef.current.push(
        setTimeout(() => {
          setDownloadUrl(url);
          setDownloadFilename(filename);
          setStage("done");
        }, 700)
      );
    } catch (error) {
      clearStageTimers();
      if (error?.name === "AbortError") {
        setErrorMsg("The request took too long and was cancelled.");
      } else {
        setErrorMsg(
          error?.message ||
            "Something went wrong while converting the score."
        );
      }
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

    if (fileRef.current) {
      fileRef.current.value = "";
    }
  };

  const chooseInstrument = (instrument) => {
    if (instrumentPicker === "source") {
      setOriginalInst(instrument);
    } else {
      setFinalInst(instrument);
    }

    setInstrumentPicker(null);
    setInstrumentSearch("");
    setErrorMsg("");
  };

  const filteredGroups = GROUPS.map((group) => ({
    ...group,
    instruments: group.instruments.filter((instrument) =>
      instrument
        .toLowerCase()
        .includes(instrumentSearch.toLowerCase())
    ),
  })).filter((group) => group.instruments.length > 0);

  const activeInstrument =
    instrumentPicker === "source" ? originalInst : finalInst;

  /* ============================================================
     UI
  ============================================================ */

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,600;1,500&display=swap');

        :root {
          --mc-bg: #070a08;
          --mc-surface: #0c110d;
          --mc-surface-2: #101710;
          --mc-surface-3: #141d15;

          --mc-text: #eef3ec;
          --mc-text-soft: #bfcabe;
          --mc-muted: #7c8b7f;
          --mc-muted-2: #57645a;

          --mc-gold: #4f9d72;
          --mc-gold-light: #7fc79d;
          --mc-gold-dark: #2f5f45;

          --mc-border: rgba(255,255,255,0.09);
          --mc-border-hover: rgba(79,157,114,0.42);

          --mc-green: #74b98c;
          --mc-red: #ca8174;
        }

        * {
          box-sizing: border-box;
        }

        html {
          background: var(--mc-bg);
        }

        body {
          margin: 0;
          background: var(--mc-bg);
        }

        button,
        input {
          font: inherit;
        }

        button {
          -webkit-tap-highlight-color: transparent;
        }

        .mc-app {
          min-height: 100vh;
          color: var(--mc-text);
          font-family: "DM Sans", sans-serif;
          overflow-x: hidden;
          background:
            radial-gradient(
              circle at 50% -15%,
              rgba(79,157,114,0.08),
              transparent 35%
            ),
            radial-gradient(
              circle at 100% 45%,
              rgba(79,157,114,0.03),
              transparent 30%
            ),
            var(--mc-bg);
        }

        .mc-shell {
          width: min(1160px, calc(100% - 48px));
          margin: 0 auto;
        }

        /* NAV */

        .mc-nav {
          height: 78px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255,255,255,0.065);
        }

        .mc-brand {
          display: flex;
          align-items: center;
          gap: 11px;
          color: var(--mc-text);
        }

        .mc-brand-mark {
          width: 32px;
          height: 32px;
          display: grid;
          place-items: center;
          color: var(--mc-gold);
        }

        .mc-brand-name {
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.13em;
          text-transform: uppercase;
        }

        .mc-nav-right {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .mc-nav-tag {
          color: var(--mc-muted);
          font-family: "DM Mono", monospace;
          font-size: 9px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .mc-nav-status {
          display: flex;
          align-items: center;
          gap: 7px;
          color: var(--mc-muted);
          font-family: "DM Mono", monospace;
          font-size: 9px;
          letter-spacing: 0.07em;
          text-transform: uppercase;
        }

        .mc-nav-status-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--mc-green);
          box-shadow: 0 0 9px rgba(116,185,140,0.5);
        }

        /* HERO */

        .mc-hero {
          position: relative;
          padding: 92px 0 80px;
          text-align: center;
        }

        .mc-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: var(--mc-gold);
          font-family: "DM Mono", monospace;
          font-size: 9px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .mc-eyebrow::before,
        .mc-eyebrow::after {
          content: "";
          width: 24px;
          height: 1px;
          background: rgba(79,157,114,0.42);
        }

        .mc-hero h1 {
          max-width: 850px;
          margin: 21px auto 0;
          font-family: "Playfair Display", Georgia, serif;
          font-size: clamp(58px, 7vw, 88px);
          line-height: 0.96;
          font-weight: 500;
          letter-spacing: -0.055em;
        }

        .mc-hero h1 em {
          color: var(--mc-gold-light);
          font-style: italic;
        }

        .mc-hero-copy {
          max-width: 560px;
          margin: 25px auto 0;
          color: var(--mc-muted);
          font-size: 14px;
          line-height: 1.75;
        }

        .mc-staff-wrap {
          position: relative;
          max-width: 850px;
          height: 90px;
          margin: 37px auto -22px;
          opacity: 0.4;

          mask-image: linear-gradient(
            90deg,
            transparent,
            black 15%,
            black 85%,
            transparent
          );

          -webkit-mask-image: linear-gradient(
            90deg,
            transparent,
            black 15%,
            black 85%,
            transparent
          );
        }

        .mc-staff {
          width: 100%;
          height: 100%;
        }

        .mc-staff-lines line {
          stroke: rgba(79,157,114,0.22);
          stroke-width: 1;
        }

        .mc-staff-notes {
          fill: rgba(127,199,157,0.72);
          font-family: Georgia, serif;
          font-size: 38px;
        }

        /* WORKSPACE */

        .mc-workspace {
          margin-bottom: 90px;
        }

        .mc-workspace-card {
          position: relative;
          overflow: visible;
          border: 1px solid var(--mc-border);
          border-radius: 20px;
          background:
            linear-gradient(
              145deg,
              rgba(20,20,20,0.98),
              rgba(12,12,12,0.98)
            );
          box-shadow:
            0 35px 100px rgba(0,0,0,0.4),
            inset 0 1px 0 rgba(255,255,255,0.025);
        }

        .mc-workspace-header {
          min-height: 76px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 27px;
          border-bottom: 1px solid var(--mc-border);
        }

        .mc-workspace-title {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.11em;
          text-transform: uppercase;
        }

        .mc-workspace-subtitle {
          margin-top: 5px;
          color: var(--mc-muted-2);
          font-size: 11px;
        }

        .mc-step {
          color: var(--mc-muted-2);
          font-family: "DM Mono", monospace;
          font-size: 9px;
          letter-spacing: 0.08em;
        }

        .mc-main-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
        }

        /* UPLOAD */

        .mc-upload-panel {
          min-height: 490px;
          padding: 30px;
          border-right: 1px solid var(--mc-border);
          display: flex;
          flex-direction: column;
        }

        .mc-section-label {
          margin-bottom: 12px;
          color: var(--mc-muted);
          font-family: "DM Mono", monospace;
          font-size: 9px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .mc-dropzone {
          flex: 1;
          min-height: 400px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;

          border: 1px dashed rgba(255,255,255,0.14);
          border-radius: 15px;

          background:
            radial-gradient(
              circle at 50% 42%,
              rgba(79,157,114,0.06),
              transparent 37%
            ),
            rgba(255,255,255,0.008);

          cursor: pointer;
          transition:
            border-color 180ms ease,
            background 180ms ease,
            transform 180ms ease;
        }

        .mc-dropzone:hover,
        .mc-dropzone.active {
          border-color: var(--mc-border-hover);
          background:
            radial-gradient(
              circle at 50% 42%,
              rgba(79,157,114,0.1),
              transparent 42%
            ),
            rgba(79,157,114,0.018);
          transform: translateY(-1px);
        }

        .mc-dropzone-content {
          width: 100%;
          max-width: 360px;
          padding: 30px;
        }

        .mc-upload-icon {
          width: 62px;
          height: 62px;
          margin: 0 auto 21px;

          display: grid;
          place-items: center;

          border: 1px solid rgba(79,157,114,0.26);
          border-radius: 15px;

          color: var(--mc-gold);
          background: rgba(79,157,114,0.05);
        }

        .mc-dropzone h2 {
          margin: 0;
          font-family: "Playfair Display", Georgia, serif;
          font-size: 27px;
          font-weight: 500;
          letter-spacing: -0.025em;
        }

        .mc-dropzone p {
          max-width: 280px;
          margin: 10px auto 0;
          color: var(--mc-muted);
          font-size: 12px;
          line-height: 1.65;
        }

        .mc-browse {
          display: inline-flex;
          margin-top: 20px;
          color: var(--mc-gold-light);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        /* FILE */

        .mc-file-card {
          flex: 1;
          min-height: 400px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;

          padding: 25px;

          border: 1px solid rgba(79,157,114,0.22);
          border-radius: 15px;

          background:
            linear-gradient(
              145deg,
              rgba(19,28,21,0.9),
              rgba(11,16,12,0.95)
            );
        }

        .mc-file-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .mc-file-icon {
          width: 56px;
          height: 68px;
          display: grid;
          place-items: center;

          position: relative;

          border: 1px solid rgba(79,157,114,0.32);
          border-radius: 8px;

          color: var(--mc-gold);
          background: rgba(79,157,114,0.05);

          font-family: "DM Mono", monospace;
          font-size: 9px;
          letter-spacing: 0.08em;
        }

        .mc-file-icon::after {
          content: "";
          position: absolute;
          top: -1px;
          right: -1px;
          width: 13px;
          height: 13px;

          background: #131c14;

          border-left: 1px solid rgba(79,157,114,0.32);
          border-bottom: 1px solid rgba(79,157,114,0.32);
        }

        .mc-remove {
          width: 31px;
          height: 31px;

          display: grid;
          place-items: center;

          border: 1px solid var(--mc-border);
          border-radius: 50%;

          background: transparent;
          color: var(--mc-muted);

          cursor: pointer;
          transition: all 150ms ease;
        }

        .mc-remove:hover {
          color: var(--mc-text);
          border-color: rgba(255,255,255,0.25);
        }

        .mc-file-name {
          margin-top: 27px;
          color: var(--mc-text);
          font-size: 15px;
          font-weight: 600;
          line-height: 1.45;
          word-break: break-word;
        }

        .mc-file-meta {
          margin-top: 7px;
          color: var(--mc-muted-2);
          font-family: "DM Mono", monospace;
          font-size: 9px;
        }

        .mc-file-ready {
          display: flex;
          align-items: center;
          gap: 8px;

          color: var(--mc-green);

          font-family: "DM Mono", monospace;
          font-size: 9px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .mc-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
          box-shadow: 0 0 8px currentColor;
        }

        /* CONTROLS */

        .mc-controls {
          min-height: 490px;
          padding: 30px;
          display: flex;
          flex-direction: column;
        }

        .mc-controls-title {
          margin: 5px 0 25px;
          font-family: "Playfair Display", Georgia, serif;
          font-size: 27px;
          font-weight: 500;
          letter-spacing: -0.025em;
        }

        .mc-instruments {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .mc-instrument {
          position: relative;
          flex: 1;
          min-width: 0;
        }

        .mc-instrument-label {
          margin-bottom: 8px;
          color: var(--mc-muted-2);
          font-family: "DM Mono", monospace;
          font-size: 8px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .mc-instrument-button {
          width: 100%;
          min-height: 124px;

          padding: 16px;

          border: 1px solid var(--mc-border);
          border-radius: 13px;

          background: rgba(255,255,255,0.018);
          color: var(--mc-text);

          text-align: left;
          cursor: pointer;

          transition:
            border-color 160ms ease,
            background 160ms ease,
            transform 160ms ease;
        }

        .mc-instrument-button:hover,
        .mc-instrument-button.selected {
          border-color: var(--mc-border-hover);
          background: rgba(79,157,114,0.05);
        }

        .mc-instrument-button:hover {
          transform: translateY(-1px);
        }

        .mc-instrument-button-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: var(--mc-gold);
        }

        .mc-instrument-name {
          margin-top: 17px;
          color: var(--mc-text);
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .mc-instrument-hint {
          margin-top: 4px;
          color: var(--mc-muted-2);
          font-size: 9px;
        }

        .mc-arrow-between {
          margin-top: 21px;
          color: var(--mc-gold-dark);
          flex: 0 0 auto;
        }

        /* PICKER */

        .mc-picker {
          position: absolute;
          z-index: 100;

          top: calc(100% + 9px);
          left: 0;

          width: min(330px, 75vw);

          padding: 10px;

          border: 1px solid rgba(79,157,114,0.3);
          border-radius: 14px;

          background: #101510;

          box-shadow:
            0 25px 70px rgba(0,0,0,0.55),
            inset 0 1px 0 rgba(255,255,255,0.025);
        }

        .mc-picker-search {
          display: flex;
          align-items: center;
          gap: 9px;

          padding: 10px;

          border: 1px solid var(--mc-border);
          border-radius: 9px;

          background: rgba(255,255,255,0.025);
          color: var(--mc-muted);
        }

        .mc-picker-search input {
          width: 100%;
          border: 0;
          outline: 0;

          background: transparent;
          color: var(--mc-text);

          font-size: 11px;
        }

        .mc-picker-search input::placeholder {
          color: var(--mc-muted-2);
        }

        .mc-picker-list {
          max-height: 285px;
          margin-top: 7px;
          padding-right: 3px;
          overflow-y: auto;
        }

        .mc-picker-list::-webkit-scrollbar {
          width: 4px;
        }

        .mc-picker-list::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.12);
          border-radius: 10px;
        }

        .mc-group {
          padding: 7px 2px 3px;
        }

        .mc-group-name {
          padding: 6px 7px;

          color: var(--mc-gold);
          font-family: "DM Mono", monospace;
          font-size: 8px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .mc-option {
          width: 100%;
          padding: 8px;

          border: 0;
          border-radius: 7px;

          background: transparent;
          color: var(--mc-muted);

          text-align: left;
          font-size: 11px;

          cursor: pointer;
        }

        .mc-option:hover,
        .mc-option.current {
          color: var(--mc-text);
          background: rgba(79,157,114,0.09);
        }

        .mc-option.current {
          box-shadow: inset 2px 0 0 var(--mc-gold);
        }

        /* ACTION */

        .mc-action {
          margin-top: auto;
          padding-top: 27px;
        }

        .mc-convert-button {
          width: 100%;
          min-height: 53px;

          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;

          border: 0;
          border-radius: 10px;

          background: var(--mc-gold);
          color: #0a1710;

          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;

          cursor: pointer;

          transition:
            background 160ms ease,
            transform 160ms ease,
            box-shadow 160ms ease;
        }

        .mc-convert-button:hover:not(:disabled) {
          background: var(--mc-gold-light);
          transform: translateY(-1px);
          box-shadow: 0 12px 30px rgba(79,157,114,0.18);
        }

        .mc-convert-button:disabled {
          opacity: 0.32;
          cursor: not-allowed;
        }

        .mc-error {
          margin-top: 12px;

          padding: 11px 13px;

          border: 1px solid rgba(202,129,116,0.25);
          border-radius: 9px;

          background: rgba(202,129,116,0.05);
          color: #dca59a;

          font-size: 11px;
          line-height: 1.5;
        }

        /* PROCESSING */

        .mc-progress {
          padding: 65px 50px 58px;
        }

        .mc-progress-heading {
          text-align: center;
          max-width: 650px;
          margin: 0 auto 40px;
        }

        .mc-progress-heading .mc-eyebrow {
          margin-bottom: 17px;
        }

        .mc-progress-heading h2 {
          margin: 0;

          font-family: "Playfair Display", Georgia, serif;
          font-size: 44px;
          line-height: 1.02;
          font-weight: 500;
          letter-spacing: -0.04em;
        }

        .mc-progress-heading h2 em {
          color: var(--mc-gold-light);
          font-style: italic;
        }

        .mc-progress-heading p {
          margin: 13px 0 0;

          color: var(--mc-muted);
          font-family: "DM Mono", monospace;
          font-size: 9px;
          letter-spacing: 0.04em;
        }

        .mc-progress-visual {
          position: relative;

          max-width: 780px;
          height: 150px;

          margin: 0 auto 40px;

          display: flex;
          align-items: center;
          justify-content: center;

          overflow: hidden;

          border-top: 1px solid rgba(79,157,114,0.14);
          border-bottom: 1px solid rgba(79,157,114,0.14);
        }

        .mc-progress-staff {
          position: absolute;
          inset: 0;
          opacity: 0.42;
        }

        .mc-progress-notes {
          position: relative;
          z-index: 2;

          display: flex;
          align-items: center;
          gap: 32px;

          color: var(--mc-gold-light);
          font-family: Georgia, serif;
          font-size: 38px;

          animation: mcFloat 2.4s ease-in-out infinite;
        }

        .mc-progress-notes span:nth-child(2) {
          animation-delay: 150ms;
        }

        .mc-progress-notes span:nth-child(3) {
          animation-delay: 300ms;
        }

        .mc-progress-notes span:nth-child(4) {
          animation-delay: 450ms;
        }

        @keyframes mcFloat {
          0%, 100% {
            transform: translateY(0);
            opacity: 0.6;
          }

          50% {
            transform: translateY(-5px);
            opacity: 1;
          }
        }

        .mc-stage-list {
          max-width: 780px;
          margin: 0 auto;

          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 9px;
        }

        .mc-stage {
          padding-top: 12px;

          border-top: 2px solid rgba(255,255,255,0.07);

          color: var(--mc-muted-2);
        }

        .mc-stage.complete {
          border-top-color: var(--mc-gold);
          color: var(--mc-text);
        }

        .mc-stage.active {
          border-top-color: var(--mc-gold);
          color: var(--mc-gold-light);
        }

        .mc-stage-number {
          font-family: "DM Mono", monospace;
          font-size: 8px;
        }

        .mc-stage-label {
          margin-top: 7px;
          font-size: 10px;
          font-weight: 600;
        }

        .mc-stage-desc {
          margin-top: 4px;
          color: var(--mc-muted-2);
          font-size: 8px;
          line-height: 1.4;
        }

        /* RESULT */

        .mc-result {
          padding: 70px 40px 65px;
          text-align: center;
        }

        .mc-result-check {
          width: 70px;
          height: 70px;

          margin: 0 auto 24px;

          display: grid;
          place-items: center;

          border: 1px solid rgba(79,157,114,0.4);
          border-radius: 50%;

          color: var(--mc-gold-light);
          background: rgba(79,157,114,0.05);

          box-shadow: 0 0 35px rgba(79,157,114,0.07);
        }

        .mc-result h2 {
          margin: 0;

          font-family: "Playfair Display", Georgia, serif;
          font-size: 47px;
          line-height: 1;
          font-weight: 500;
          letter-spacing: -0.045em;
        }

        .mc-result-copy {
          max-width: 510px;
          margin: 14px auto 27px;

          color: var(--mc-muted);
          font-size: 12px;
          line-height: 1.7;
        }

        .mc-result-copy strong {
          color: var(--mc-text);
          font-weight: 600;
        }

        .mc-result-card {
          max-width: 500px;

          margin: 0 auto 23px;
          padding: 15px 17px;

          display: flex;
          align-items: center;
          gap: 12px;

          border: 1px solid var(--mc-border);
          border-radius: 10px;

          background: rgba(255,255,255,0.018);

          text-align: left;
        }

        .mc-result-card-icon {
          color: var(--mc-gold);
        }

        .mc-result-file {
          min-width: 0;

          color: var(--mc-text);
          font-size: 11px;
          font-weight: 600;

          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .mc-result-route {
          margin-top: 4px;

          color: var(--mc-muted-2);
          font-family: "DM Mono", monospace;
          font-size: 8px;
        }

        .mc-result-actions {
          display: flex;
          justify-content: center;
          gap: 9px;
        }

        .mc-download,
        .mc-again {
          min-height: 47px;

          display: inline-flex;
          align-items: center;
          justify-content: center;

          border-radius: 9px;

          cursor: pointer;

          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .mc-download {
          gap: 8px;
          padding: 0 21px;

          border: 0;
          background: var(--mc-gold);
          color: #0a1710;
        }

        .mc-download:hover {
          background: var(--mc-gold-light);
        }

        .mc-again {
          padding: 0 19px;

          border: 1px solid var(--mc-border);
          background: transparent;
          color: var(--mc-muted);
        }

        .mc-again:hover {
          color: var(--mc-text);
          border-color: rgba(255,255,255,0.22);
        }

        /* FOOTER */

        .mc-footer {
          padding: 0 0 45px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          color: var(--mc-muted-2);

          font-family: "DM Mono", monospace;
          font-size: 8px;
          letter-spacing: 0.07em;
          text-transform: uppercase;
        }

        .mc-footer-gold {
          color: rgba(79,157,114,0.68);
        }

        /* RESPONSIVE */

        @media (max-width: 850px) {
          .mc-shell {
            width: min(100% - 28px, 700px);
          }

          .mc-nav {
            height: 70px;
          }

          .mc-nav-tag {
            display: none;
          }

          .mc-hero {
            padding: 72px 0 55px;
          }

          .mc-main-grid {
            grid-template-columns: 1fr;
          }

          .mc-upload-panel {
            border-right: 0;
            border-bottom: 1px solid var(--mc-border);
          }

          .mc-dropzone,
          .mc-file-card {
            min-height: 300px;
          }

          .mc-stage-list {
            grid-template-columns: repeat(2, 1fr);
            row-gap: 20px;
          }
        }

        @media (max-width: 600px) {
          .mc-shell {
            width: calc(100% - 20px);
          }

          .mc-brand-name {
            font-size: 12px;
          }

          .mc-nav-status {
            display: none;
          }

          .mc-hero {
            padding: 58px 0 40px;
          }

          .mc-hero h1 {
            font-size: 49px;
          }

          .mc-hero-copy {
            padding: 0 8px;
            font-size: 13px;
          }

          .mc-staff-wrap {
            height: 70px;
          }

          .mc-workspace {
            margin-bottom: 65px;
          }

          .mc-workspace-header {
            padding: 18px;
          }

          .mc-workspace-subtitle {
            display: none;
          }

          .mc-upload-panel,
          .mc-controls {
            padding: 20px;
          }

          .mc-dropzone,
          .mc-file-card {
            min-height: 285px;
          }

          .mc-instruments {
            flex-direction: column;
            align-items: stretch;
            gap: 7px;
          }

          .mc-arrow-between {
            margin: 0 auto;
            transform: rotate(90deg);
          }

          .mc-instrument-button {
            min-height: 100px;
          }

          .mc-picker {
            width: 100%;
          }

          .mc-progress {
            padding: 45px 20px 40px;
          }

          .mc-progress-heading h2 {
            font-size: 35px;
          }

          .mc-progress-visual {
            height: 120px;
          }

          .mc-progress-notes {
            gap: 22px;
            font-size: 30px;
          }

          .mc-stage-list {
            grid-template-columns: 1fr;
          }

          .mc-result {
            padding: 50px 20px;
          }

          .mc-result h2 {
            font-size: 38px;
          }

          .mc-result-actions {
            flex-direction: column;
          }

          .mc-download,
          .mc-again {
            width: 100%;
          }

          .mc-footer {
            flex-direction: column;
            gap: 10px;
            text-align: center;
          }
        }
      `}</style>

      <div className="mc-app">
        <div className="mc-shell">

          {/* NAV */}
          <nav className="mc-nav">
            <div className="mc-brand">
              <div className="mc-brand-mark">
                <LogoMark />
              </div>

              <div className="mc-brand-name">
                MuseConvert
              </div>
            </div>

            <div className="mc-nav-right">
              <div className="mc-nav-tag">
                Sheet music, reimagined
              </div>

              <div className="mc-nav-status">
                <span className="mc-nav-status-dot" />
                PDF → PDF
              </div>
            </div>
          </nav>

          {/* HERO */}
          <section className="mc-hero">
            <div className="mc-eyebrow">
              The score studio
            </div>

            <h1>
              Your music.
              <br />
              <em>Any instrument.</em>
            </h1>

            <p className="mc-hero-copy">
              Transform a sheet-music PDF into a clean,
              transposed score. Choose where the music starts,
              choose where it goes, and let MuseConvert handle
              the notation.
            </p>

            <div className="mc-staff-wrap">
              <MusicStaff />
            </div>
          </section>

          {/* WORKSPACE */}
          <main className="mc-workspace">
            <div className="mc-workspace-card">

              {/* CONVERTER */}
              {!isProcessing &&
                stage !== "done" &&
                stage !== "error" && (
                  <>
                    <div className="mc-workspace-header">
                      <div>
                        <div className="mc-workspace-title">
                          Convert your score
                        </div>

                        <div className="mc-workspace-subtitle">
                          Upload once. Choose your instruments.
                          Get a new score.
                        </div>
                      </div>

                      <div className="mc-step">
                        01 / 01
                      </div>
                    </div>

                    <div className="mc-main-grid">

                      {/* UPLOAD */}
                      <section className="mc-upload-panel">
                        <div className="mc-section-label">
                          01 — Source score
                        </div>

                        <input
                          ref={fileRef}
                          type="file"
                          accept=".pdf,application/pdf"
                          style={{ display: "none" }}
                          onChange={(event) =>
                            handleFile(event.target.files?.[0])
                          }
                        />

                        {!file ? (
                          <div
                            className={`mc-dropzone ${
                              dragActive ? "active" : ""
                            }`}
                            onClick={() =>
                              fileRef.current?.click()
                            }
                            onDragEnter={(event) => {
                              event.preventDefault();
                              setDragActive(true);
                            }}
                            onDragOver={(event) => {
                              event.preventDefault();
                              setDragActive(true);
                            }}
                            onDragLeave={(event) => {
                              event.preventDefault();
                              setDragActive(false);
                            }}
                            onDrop={handleDrop}
                          >
                            <div className="mc-dropzone-content">
                              <div className="mc-upload-icon">
                                <UploadIcon />
                              </div>

                              <h2>
                                Drop your score here
                              </h2>

                              <p>
                                Upload a PDF of the sheet music
                                you want to transpose.
                              </p>

                              <span className="mc-browse">
                                Browse files →
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="mc-file-card">
                            <div>
                              <div className="mc-file-top">
                                <div className="mc-file-icon">
                                  <FileIcon />
                                </div>

                                <button
                                  className="mc-remove"
                                  onClick={resetConverter}
                                  aria-label="Remove file"
                                  type="button"
                                >
                                  <XIcon />
                                </button>
                              </div>

                              <div className="mc-file-name">
                                {file.name}
                              </div>

                              <div className="mc-file-meta">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                                {" · "}
                                PDF score
                              </div>
                            </div>

                            <div className="mc-file-ready">
                              <span className="mc-dot" />
                              Score loaded and ready
                            </div>
                          </div>
                        )}
                      </section>

                      {/* CONTROLS */}
                      <section className="mc-controls">
                        <div className="mc-section-label">
                          02 — Destination
                        </div>

                        <div className="mc-controls-title">
                          Choose your instruments
                        </div>

                        <div className="mc-instruments">

                          {/* SOURCE */}
                          <div
                            className="mc-instrument"
                            ref={
                              instrumentPicker === "source"
                                ? pickerRef
                                : null
                            }
                          >
                            <div className="mc-instrument-label">
                              Written for
                            </div>

                            <button
                              type="button"
                              className={`mc-instrument-button ${
                                originalInst ? "selected" : ""
                              }`}
                              onClick={() =>
                                setInstrumentPicker(
                                  instrumentPicker === "source"
                                    ? null
                                    : "source"
                                )
                              }
                            >
                              <div className="mc-instrument-button-top">
                                <MusicIcon />
                                <ChevronIcon />
                              </div>

                              <div className="mc-instrument-name">
                                {originalInst ||
                                  "Choose instrument"}
                              </div>

                              <div className="mc-instrument-hint">
                                Original score
                              </div>
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

                          {/* ARROW */}
                          <div className="mc-arrow-between">
                            <SwapIcon />
                          </div>

                          {/* TARGET */}
                          <div
                            className="mc-instrument"
                            ref={
                              instrumentPicker === "target"
                                ? pickerRef
                                : null
                            }
                          >
                            <div className="mc-instrument-label">
                              Transpose to
                            </div>

                            <button
                              type="button"
                              className={`mc-instrument-button ${
                                finalInst ? "selected" : ""
                              }`}
                              onClick={() =>
                                setInstrumentPicker(
                                  instrumentPicker === "target"
                                    ? null
                                    : "target"
                                )
                              }
                            >
                              <div className="mc-instrument-button-top">
                                <MusicIcon />
                                <ChevronIcon />
                              </div>

                              <div className="mc-instrument-name">
                                {finalInst ||
                                  "Choose instrument"}
                              </div>

                              <div className="mc-instrument-hint">
                                New score
                              </div>
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

                        <div className="mc-action">
                          <button
                            type="button"
                            className="mc-convert-button"
                            onClick={handleConvert}
                            disabled={
                              !file ||
                              !originalInst ||
                              !finalInst ||
                              originalInst === finalInst
                            }
                          >
                            Convert score
                            <ArrowIcon />
                          </button>

                          {errorMsg && (
                            <div className="mc-error">
                              {errorMsg}
                            </div>
                          )}
                        </div>
                      </section>
                    </div>
                  </>
                )}

              {/* PROCESSING */}
              {isProcessing && (
                <section className="mc-progress">
                  <div className="mc-progress-heading">
                    <div className="mc-eyebrow">
                      Working on your score
                    </div>

                    <h2>
                      Rewriting the music
                      <br />
                      for <em>{finalInst}</em>
                    </h2>

                    <p>
                      {originalInst} → {finalInst}
                    </p>
                  </div>

                  <div className="mc-progress-visual">
                    <div className="mc-progress-staff">
                      <MusicStaff />
                    </div>

                    <div className="mc-progress-notes">
                      <span>♪</span>
                      <span>♫</span>
                      <span>♩</span>
                      <span>♪</span>
                    </div>
                  </div>

                  <div className="mc-stage-list">
                    {PROGRESS_STAGES.slice(0, 4).map(
                      (item, index) => {
                        const complete =
                          index < currentStageIndex;

                        const active =
                          index === currentStageIndex;

                        return (
                          <div
                            key={item.key}
                            className={`mc-stage ${
                              complete ? "complete" : ""
                            } ${
                              active ? "active" : ""
                            }`}
                          >
                            <div className="mc-stage-number">
                              {complete
                                ? "✓"
                                : `0${index + 1}`}
                            </div>

                            <div className="mc-stage-label">
                              {item.label}
                            </div>

                            <div className="mc-stage-desc">
                              {item.description}
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </section>
              )}

              {/* SUCCESS */}
              {stage === "done" && (
                <section className="mc-result">
                  <div className="mc-result-check">
                    <CheckIcon />
                  </div>

                  <h2>
                    Your score is ready.
                  </h2>

                  <p className="mc-result-copy">
                    The music has been transposed from{" "}
                    <strong>{originalInst}</strong> to{" "}
                    <strong>{finalInst}</strong>.
                    Your new PDF is ready to download.
                  </p>

                  <div className="mc-result-card">
                    <div className="mc-result-card-icon">
                      <MusicIcon />
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div className="mc-result-file">
                        {file?.name ||
                          "Converted score.pdf"}
                      </div>

                      <div className="mc-result-route">
                        {originalInst} → {finalInst}
                      </div>
                    </div>
                  </div>

                  <div className="mc-result-actions">
                    <button
                      type="button"
                      className="mc-download"
                      onClick={handleDownload}
                    >
                      Download PDF
                      <ArrowIcon />
                    </button>

                    <button
                      type="button"
                      className="mc-again"
                      onClick={resetConverter}
                    >
                      Convert another
                    </button>
                  </div>
                </section>
              )}

              {/* ERROR */}
              {stage === "error" && (
                <section className="mc-result">
                  <div
                    className="mc-result-check"
                    style={{
                      color: "var(--mc-red)",
                      borderColor:
                        "rgba(202,129,116,0.35)",
                      background:
                        "rgba(202,129,116,0.05)",
                    }}
                  >
                    <XIcon />
                  </div>

                  <h2>
                    Something went wrong.
                  </h2>

                  <p className="mc-result-copy">
                    {errorMsg ||
                      "MuseConvert couldn't complete the conversion. Please try again."}
                  </p>

                  <div className="mc-result-actions">
                    <button
                      type="button"
                      className="mc-download"
                      onClick={resetConverter}
                    >
                      Try again
                    </button>
                  </div>
                </section>
              )}
            </div>
          </main>

          {/* FOOTER */}
          <footer className="mc-footer">
            <span>
              © {new Date().getFullYear()} MuseConvert
            </span>

            <span className="mc-footer-gold">
              Built for musicians, by musicians
            </span>
          </footer>
        </div>
      </div>
    </>
  );
}

/* ============================================================
   INSTRUMENT PICKER
============================================================ */

function InstrumentPicker({
  search,
  setSearch,
  groups,
  activeInstrument,
  onChoose,
}) {
  return (
    <div className="mc-picker">
      <div className="mc-picker-search">
        <SearchIcon />

        <input
          autoFocus
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Search instruments..."
        />
      </div>

      <div className="mc-picker-list">
        {groups.map((group) => (
          <div className="mc-group" key={group.name}>
            <div className="mc-group-name">
              {group.name}
            </div>

            {group.instruments.map((instrument) => (
              <button
                type="button"
                key={instrument}
                className={`mc-option ${
                  activeInstrument === instrument
                    ? "current"
                    : ""
                }`}
                onClick={() =>
                  onChoose(instrument)
                }
              >
                {instrument}
              </button>
            ))}
          </div>
        ))}

        {groups.length === 0 && (
          <div
            style={{
              padding: "18px 10px",
              color: "var(--mc-muted)",
              fontSize: "11px",
            }}
          >
            No instruments found.
          </div>
        )}
      </div>
    </div>
  );
}
