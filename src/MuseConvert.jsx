"use client";


import { useState, useRef, useCallback } from "react";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

const BACKEND_URL =
  "https://museconvertmxl-production-ae99.up.railway.app";

const INSTRUMENTS = [
  "Piccolo",
  "Flute",
  "Alto Flute",
  "Oboe",
  "Oboe d'amore",
  "English Horn",
  "Heckelphone",
  "Bass Oboe",
  "Clarinet in Bb",
  "Clarinet in A",
  "Clarinet in Eb",
  "Basset Horn",
  "Bass Clarinet",
  "Bassoon",
  "Contrabassoon",
  "Saxophone Bb Soprano",
  "Saxophone Eb Alto",
  "Saxophone Bb Tenor",
  "Saxophone Eb Baritone",
  "Saxophone Bb Bass",
  "Saxophone Eb Contrabass",
  "Horn in F",
  "Tuba Bb",
  "Tuba Eb",
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
  "Timpani",
  "Xylophone",
  "Marimba",
  "Orchestra Bells",
  "Glockenspiel",
  "Vibraphone",
  "Chimes",
  "Guitar",
  "Violin",
  "Viola",
  "Cello",
  "Double Bass",
];

const STAGES = [
  {
    id: "reading_pdf",
    title: "Reading score",
    description: "Analyzing your PDF",
  },
  {
    id: "extracting_music",
    title: "Extracting music",
    description: "Reading the notation",
  },
  {
    id: "transposing",
    title: "Transposing",
    description: "Rewriting for your instrument",
  },
  {
    id: "generating_pdf",
    title: "Generating PDF",
    description: "Preparing your finished score",
  },
];

function getStageIndex(stage) {
  if (stage === "done") return STAGES.length;

  const index = STAGES.findIndex((item) => item.id === stage);

  return index === -1 ? 0 : index;
}

function formatFileSize(bytes) {
  if (!bytes) return "";

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ─────────────────────────────────────────────
   Icons
───────────────────────────────────────────── */

function NoteIcon({ size = 24, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <ellipse
        cx="7"
        cy="18"
        rx="4"
        ry="2.5"
        fill={color}
        transform="rotate(-15 7 18)"
      />
      <line
        x1="11"
        y1="17"
        x2="11"
        y2="4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M11 4 Q18 2 20 8"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function UploadIcon({ active = false }) {
  const color = active ? "#d7b879" : "#a09480";

  return (
    <svg
      width="42"
      height="42"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 15V3M8 7l4-4 4 4"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 15v4a2 2 0 002 2h14a2 2 0 002-2v-4"
        stroke="#5d5546"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon({ size = 16, color = "#5ab88b" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 12l5 5L20 7"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3v12M7 11l5 5 5-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 21h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="#c8a96e"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      className="muse-spinner"
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeDasharray="28 56"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ─────────────────────────────────────────────
   Staff decoration
───────────────────────────────────────────── */

function StaffLines() {
  return (
    <svg
      viewBox="0 0 800 80"
      preserveAspectRatio="none"
      className="staff-lines"
      aria-hidden="true"
    >
      {[16, 28, 40, 52, 64].map((y) => (
        <line
          key={y}
          x1="0"
          y1={y}
          x2="800"
          y2={y}
          stroke="#e8dcc8"
          strokeWidth="1"
        />
      ))}
    </svg>
  );
}

/* ─────────────────────────────────────────────
   Select
───────────────────────────────────────────── */

function InstrumentSelect({
  value,
  onChange,
  placeholder,
  disabled = false,
}) {
  return (
    <div className="select-wrapper">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className={`instrument-select ${
          value ? "has-value" : "is-placeholder"
        }`}
      >
        <option value="" disabled>
          {placeholder}
        </option>

        {INSTRUMENTS.map((instrument) => (
          <option key={instrument} value={instrument}>
            {instrument}
          </option>
        ))}
      </select>

      <span className="select-arrow">⌄</span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main
───────────────────────────────────────────── */

export default function MuseConvert() {
  const [file, setFile] = useState(null);
  const [originalInst, setOriginalInst] = useState("");
  const [finalInst, setFinalInst] = useState("");

  const [jobId, setJobId] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);

  const [stage, setStage] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const fileRef = useRef(null);

  const isProcessing =
    stage !== "idle" &&
    stage !== "done" &&
    stage !== "error";

  const isDone = stage === "done";

  const currentStageIndex = getStageIndex(stage);

  const ready =
    Boolean(file) &&
    Boolean(originalInst) &&
    Boolean(finalInst) &&
    originalInst !== finalInst &&
    !isProcessing;

  /* ─────────────────────────────────────────────
     File selection
  ───────────────────────────────────────────── */

  const handleFile = useCallback((selectedFile) => {
    if (!selectedFile) return;

    if (
      selectedFile.type !== "application/pdf" &&
      !selectedFile.name.toLowerCase().endsWith(".pdf")
    ) {
      setFile(null);
      setErrorMsg("Please upload a PDF score.");
      setStage("error");
      return;
    }

    setFile(selectedFile);
    setErrorMsg("");
    setStage("idle");
    setJobId(null);
    setDownloadUrl(null);
  }, []);

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault();
      setDragOver(false);

      const droppedFile = event.dataTransfer.files?.[0];

      handleFile(droppedFile);
    },
    [handleFile]
  );

  /* ─────────────────────────────────────────────
     Start conversion
  ───────────────────────────────────────────── */

  const handleConvert = async () => {
    if (!file) {
      setErrorMsg("Please upload a PDF score.");
      setStage("error");
      return;
    }

    if (!originalInst || !finalInst) {
      setErrorMsg("Please select both instruments.");
      setStage("error");
      return;
    }

    if (originalInst === finalInst) {
      setErrorMsg(
        "Your source and target instruments must be different."
      );
      setStage("error");
      return;
    }

    setErrorMsg("");
    setJobId(null);
    setDownloadUrl(null);
    setStage("starting");

    try {
      const form = new FormData();

      form.append("file", file);
      form.append("original_instrument", originalInst);
      form.append("final_instrument", finalInst);

      /*
       * Job-based backend:
       *
       * POST /convert
       * → { job_id, download_url }
       */
      const response = await fetch(`${BACKEND_URL}/convert`, {
        method: "POST",
        body: form,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || `Server error (${response.status})`
        );
      }

      if (!data.job_id) {
        throw new Error(
          "The server did not return a conversion job ID."
        );
      }

      setJobId(data.job_id);

      if (data.download_url) {
        setDownloadUrl(data.download_url);
      }

      /*
       * If the backend doesn't immediately provide a stage,
       * begin at the first real processing stage.
       */
      setStage(data.stage || "reading_pdf");
    } catch (error) {
      console.error(error);

      setErrorMsg(
        error?.message ||
          "Something went wrong while starting the conversion."
      );

      setStage("error");
    }
  };

  /* ─────────────────────────────────────────────
     Poll backend
  ───────────────────────────────────────────── */

  useEffect(() => {
    if (!jobId) return;

    let cancelled = false;

    const poll = async () => {
      try {
        const response = await fetch(
          `${BACKEND_URL}/status/${jobId}`
        );

        if (!response.ok) {
          throw new Error("Could not retrieve conversion status.");
        }

        const data = await response.json();

        if (cancelled) return;

        if (data.stage) {
          setStage(data.stage);
        }

        if (data.download_url) {
          setDownloadUrl(data.download_url);
        }

        if (data.error) {
          setErrorMsg(data.error);
          setStage("error");
        }
      } catch (error) {
        /*
         * Don't immediately kill the conversion if one
         * polling request fails. Railway/network hiccups
         * shouldn't ruin a perfectly good running job.
         */
        console.warn("Status polling failed:", error);
      }
    };

    poll();

    const interval = setInterval(poll, 1200);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [jobId]);

  /* ─────────────────────────────────────────────
     Download
  ───────────────────────────────────────────── */

  const handleDownload = () => {
    if (!downloadUrl) return;

    const url = downloadUrl.startsWith("http")
      ? downloadUrl
      : `${BACKEND_URL}${downloadUrl}`;

    window.location.href = url;
  };

  /* ─────────────────────────────────────────────
     Reset
  ───────────────────────────────────────────── */

  const handleReset = () => {
    setFile(null);
    setOriginalInst("");
    setFinalInst("");
    setJobId(null);
    setDownloadUrl(null);
    setStage("idle");
    setErrorMsg("");
    setDragOver(false);

    if (fileRef.current) {
      fileRef.current.value = "";
    }
  };

  const progressPercent = isDone
    ? 100
    : Math.round(
        ((currentStageIndex + 1) / STAGES.length) * 100
      );

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        html,
        body,
        #root {
          min-height: 100%;
          margin: 0;
        }

        body {
          background: #0d0c0a;
        }

        button,
        select,
        input {
          font: inherit;
        }

        button:focus-visible,
        select:focus-visible {
          outline: 1px solid #c8a96e;
          outline-offset: 3px;
        }

        @keyframes museSpin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes museFadeUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes musePulse {
          0%,
          100% {
            opacity: .35;
            transform: scale(.8);
          }

          50% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .muse-page {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          color: #e8dcc8;
          background:
            radial-gradient(
              ellipse 70% 35% at 50% -5%,
              rgba(200,169,110,.10),
              transparent 72%
            ),
            #0d0c0a;
          font-family:
            Georgia,
            "Times New Roman",
            serif;
        }

        .muse-page::before {
          content: "";
          position: fixed;
          inset: 0;
          pointer-events: none;
          opacity: .35;
          background:
            repeating-linear-gradient(
              0deg,
              transparent 0px,
              transparent 31px,
              rgba(232,220,200,.018) 32px
            );
        }

        .muse-container {
          position: relative;
          z-index: 1;
          width: min(860px, calc(100% - 40px));
          margin: 0 auto;
          padding: 46px 0 60px;
        }

        /* HEADER */

        .muse-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 30px;
          margin-bottom: 36px;
        }

        .muse-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #c8a96e;
          font-size: 12px;
          letter-spacing: .27em;
          text-transform: uppercase;
          font-style: italic;
        }

        .muse-brand-mark {
          width: 32px;
          height: 32px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(200,169,110,.3);
          border-radius: 50%;
        }

        .muse-eyebrow {
          margin-top: 8px;
          color: #5e574a;
          font-size: 9px;
          letter-spacing: .25em;
          text-transform: uppercase;
        }

        .muse-header-note {
          padding-top: 5px;
          color: #4f493d;
          font-size: 10px;
          letter-spacing: .16em;
          text-transform: uppercase;
          text-align: right;
        }

        .muse-title {
          margin: 0;
          color: #f0e8d4;
          font-size: clamp(44px, 7vw, 72px);
          line-height: .98;
          font-weight: 400;
          letter-spacing: -.045em;
        }

        .muse-title span {
          color: #c8a96e;
          font-style: italic;
        }

        .muse-description {
          max-width: 520px;
          margin: 18px 0 0;
          color: #918676;
          font-size: 14px;
          line-height: 1.75;
        }

        .muse-rule {
          width: 48px;
          height: 1px;
          margin-top: 22px;
          background: #c8a96e;
          opacity: .55;
        }

        /* CARD */

        .muse-card {
          overflow: hidden;
          border: 1px solid #2e2a23;
          border-radius: 5px;
          background: #15130f;
          box-shadow:
            0 35px 100px rgba(0,0,0,.25),
            0 4px 18px rgba(0,0,0,.18);
        }

        .muse-score-bar {
          position: relative;
          height: 82px;
          overflow: hidden;
          border-bottom: 1px solid #2e2a23;
          background: #13120f;
        }

        .staff-lines {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          opacity: .065;
        }

        .muse-clef {
          position: absolute;
          left: 28px;
          top: 50%;
          transform: translateY(-53%);
          color: #e8dcc8;
          opacity: .28;
          font-size: 54px;
          line-height: 1;
        }

        .muse-score-meta {
          position: absolute;
          right: 28px;
          top: 50%;
          transform: translateY(-50%);
          color: #5f5748;
          font-size: 9px;
          letter-spacing: .2em;
          text-transform: uppercase;
        }

        .muse-body {
          padding: 38px;
        }

        /* UPLOAD */

        .upload-zone {
          min-height: 195px;
          padding: 30px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          cursor: pointer;
          border: 1px dashed #403a2f;
          border-radius: 4px;
          background: rgba(255,255,255,.003);
          transition:
            border-color .2s ease,
            background .2s ease,
            transform .2s ease;
        }

        .upload-zone:hover {
          border-color: #685a3e;
          background: rgba(200,169,110,.018);
        }

        .upload-zone.dragging {
          border-color: #c8a96e;
          background: rgba(200,169,110,.055);
          transform: scale(1.005);
        }

        .upload-zone.has-file {
          border-color: rgba(76,175,130,.48);
          background: rgba(76,175,130,.025);
        }

        .upload-icon-wrap {
          width: 58px;
          height: 58px;
          display: grid;
          place-items: center;
          margin-bottom: 8px;
          border: 1px solid #302c25;
          border-radius: 50%;
          background: #11100d;
        }

        .upload-title {
          color: #b8ad9a;
          font-size: 15px;
        }

        .upload-subtitle {
          margin-top: 7px;
          color: #575044;
          font-size: 10px;
          letter-spacing: .15em;
          text-transform: uppercase;
        }

        .uploaded-file {
          display: flex;
          align-items: center;
          gap: 10px;
          max-width: 100%;
          color: #62b88d;
          font-size: 15px;
        }

        .uploaded-file-name {
          max-width: 470px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .uploaded-file-size {
          margin-top: 8px;
          color: #5e594d;
          font-size: 11px;
        }

        /* INSTRUMENTS */

        .instrument-section {
          margin-top: 32px;
        }

        .instrument-grid {
          display: grid;
          grid-template-columns: minmax(0,1fr) 46px minmax(0,1fr);
          gap: 14px;
          align-items: end;
        }

        .field-label {
          display: block;
          margin-bottom: 9px;
          color: #706858;
          font-size: 9px;
          letter-spacing: .2em;
          text-transform: uppercase;
        }

        .select-wrapper {
          position: relative;
        }

        .instrument-select {
          appearance: none;
          width: 100%;
          min-height: 49px;
          padding: 0 42px 0 14px;
          border: 1px solid #302c25;
          border-radius: 3px;
          background: #0f0e0b;
          color: #e8dcc8;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 14px;
          cursor: pointer;
          transition:
            border-color .2s ease,
            background .2s ease;
        }

        .instrument-select:hover {
          border-color: #4a4235;
        }

        .instrument-select:focus {
          border-color: #c8a96e;
          outline: none;
        }

        .instrument-select.is-placeholder {
          color: #554f43;
        }

        .instrument-select:disabled {
          cursor: not-allowed;
          opacity: .5;
        }

        .select-arrow {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-57%);
          pointer-events: none;
          color: #6f6656;
          font-size: 17px;
        }

        .instrument-arrow {
          display: flex;
          align-items: center;
          justify-content: center;
          padding-bottom: 11px;
        }

        /* BUTTON */

        .convert-button {
          width: 100%;
          min-height: 53px;
          margin-top: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border: 1px solid #302c25;
          border-radius: 3px;
          background: #1d1a15;
          color: #514b40;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 11px;
          letter-spacing: .22em;
          text-transform: uppercase;
          transition:
            background .2s ease,
            border-color .2s ease,
            color .2s ease,
            transform .2s ease,
            box-shadow .2s ease;
        }

        .convert-button.ready {
          cursor: pointer;
          border-color: #c8a96e;
          background: #c8a96e;
          color: #0e0d0a;
          box-shadow: 0 10px 30px rgba(200,169,110,.07);
        }

        .convert-button.ready:hover {
          background: #d5b97f;
          border-color: #d5b97f;
          transform: translateY(-1px);
          box-shadow: 0 13px 35px rgba(200,169,110,.12);
        }

        .convert-button:disabled {
          cursor: not-allowed;
        }

        .muse-spinner {
          animation: museSpin 1s linear infinite;
        }

        /* ERROR */

        .error-box {
          margin-top: 15px;
          padding: 13px 15px;
          border: 1px solid rgba(210,83,83,.23);
          border-radius: 3px;
          background: rgba(210,83,83,.045);
          color: #d27a7a;
          font-size: 12px;
          line-height: 1.5;
          animation: museFadeUp .25s ease;
        }

        /* PROGRESS */

        .progress-panel {
          margin-top: 34px;
          padding-top: 30px;
          border-top: 1px solid #29261f;
          animation: museFadeUp .3s ease;
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 15px;
        }

        .progress-title {
          color: #d2c5b0;
          font-size: 15px;
        }

        .progress-number {
          color: #716958;
          font-size: 9px;
          letter-spacing: .18em;
          text-transform: uppercase;
        }

        .progress-track {
          height: 2px;
          overflow: hidden;
          margin-bottom: 24px;
          background: #2c2821;
        }

        .progress-fill {
          height: 100%;
          background: #c8a96e;
          transition: width .45s ease;
        }

        .stage-list {
          display: grid;
          gap: 12px;
        }

        .stage-row {
          display: flex;
          align-items: center;
          gap: 12px;
          min-height: 24px;
          color: #4e493e;
          font-size: 12px;
          transition: color .25s ease;
        }

        .stage-row.active {
          color: #d0c3ae;
        }

        .stage-row.complete {
          color: #817866;
        }

        .stage-dot {
          width: 21px;
          height: 21px;
          flex: 0 0 21px;
          display: grid;
          place-items: center;
          border: 1px solid #353129;
          border-radius: 50%;
        }

        .stage-row.active .stage-dot {
          border-color: #c8a96e;
        }

        .stage-row.complete .stage-dot {
          border-color: rgba(76,175,130,.45);
        }

        .active-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #c8a96e;
          animation: musePulse 1.2s ease-in-out infinite;
        }

        .stage-description {
          margin-left: auto;
          color: #514c42;
          font-size: 10px;
        }

        /* SUCCESS */

        .success-panel {
          margin-top: 34px;
          padding: 25px;
          border: 1px solid rgba(76,175,130,.23);
          border-radius: 4px;
          background: rgba(76,175,130,.025);
          animation: museFadeUp .35s ease;
        }

        .success-heading {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #b8d6c5;
          font-size: 15px;
        }

        .success-copy {
          margin-top: 9px;
          color: #737c72;
          font-size: 12px;
          line-height: 1.65;
        }

        .success-conversion {
          margin-top: 10px;
          color: #9baf9f;
          font-size: 12px;
        }

        .success-actions {
          display: grid;
          grid-template-columns: minmax(0,1fr) auto;
          gap: 10px;
          margin-top: 20px;
        }

        .download-button,
        .reset-button {
          min-height: 46px;
          border-radius: 3px;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 10px;
          letter-spacing: .14em;
          text-transform: uppercase;
          cursor: pointer;
          transition:
            transform .2s ease,
            background .2s ease,
            border-color .2s ease;
        }

        .download-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          border: 1px solid #4caf82;
          background: #4caf82;
          color: #0d120f;
        }

        .download-button:hover {
          background: #5cbd91;
          transform: translateY(-1px);
        }

        .reset-button {
          padding: 0 20px;
          border: 1px solid #39352d;
          background: transparent;
          color: #837966;
        }

        .reset-button:hover {
          border-color: #5a5141;
          color: #b0a38e;
        }

        /* FOOTER */

        .muse-footer {
          margin-top: 30px;
          text-align: center;
          color: #39352d;
          font-size: 9px;
          letter-spacing: .2em;
          text-transform: uppercase;
        }

        /* MOBILE */

        @media (max-width: 680px) {
          .muse-container {
            width: min(100% - 28px, 860px);
            padding-top: 30px;
          }

          .muse-header {
            margin-bottom: 27px;
          }

          .muse-header-note {
            display: none;
          }

          .muse-title {
            font-size: clamp(43px, 13vw, 60px);
          }

          .muse-description {
            font-size: 13px;
          }

          .muse-body {
            padding: 25px 20px 28px;
          }

          .muse-score-bar {
            height: 68px;
          }

          .muse-clef {
            left: 19px;
          }

          .muse-score-meta {
            right: 19px;
            font-size: 8px;
          }

          .upload-zone {
            min-height: 175px;
            padding: 24px 16px;
          }

          .instrument-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .instrument-arrow {
            height: 22px;
            padding: 0;
            transform: rotate(90deg);
          }

          .success-actions {
            grid-template-columns: 1fr;
          }

          .reset-button {
            padding: 0;
          }

          .stage-description {
            display: none;
          }
        }

        @media (max-width: 420px) {
          .muse-container {
            width: calc(100% - 20px);
          }

          .muse-brand {
            font-size: 10px;
          }

          .muse-body {
            padding: 21px 16px 23px;
          }

          .muse-upload {
            padding: 20px 12px;
          }

          .uploaded-file-name {
            max-width: 220px;
          }
        }
      `}</style>

      <div className="muse-page">
        <div className="muse-container">

          {/* ───────── Header ───────── */}

          <header className="muse-header">
            <div>
              <div className="muse-brand">
                <span className="muse-brand-mark">
                  <NoteIcon size={19} color="#c8a96e" />
                </span>

                <span>MuseConvert</span>
              </div>

              <div className="muse-eyebrow">
                MusicXML Transposition Engine
              </div>
            </div>

            <div className="muse-header-note">
              Sheet Music<br />
              Reimagined
            </div>
          </header>

          <h1 className="muse-title">
            Transpose.
            <br />
            <span>Transcribe.</span>
          </h1>

          <p className="muse-description">
            Convert a sheet-music PDF into a clean,
            print-ready score written for another instrument.
          </p>

          <div className="muse-rule" />

          {/* ───────── Main Card ───────── */}

          <main className="muse-card">

            {/* Musical header */}
            <div className="muse-score-bar">
              <StaffLines />

              <div className="muse-clef">
                𝄞
              </div>

              <div className="muse-score-meta">
                PDF&nbsp;&nbsp;→&nbsp;&nbsp;PDF
              </div>
            </div>

            <div className="muse-body">

              {/* ───────── Upload ───────── */}

              <div
                className={`upload-zone ${
                  dragOver ? "dragging" : ""
                } ${file ? "has-file" : ""}`}
                onClick={() => fileRef.current?.click()}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  hidden
                  onChange={(event) =>
                    handleFile(event.target.files?.[0])
                  }
                />

                {!file ? (
                  <>
                    <div className="upload-icon-wrap">
                      <UploadIcon active={dragOver} />
                    </div>

                    <div className="upload-title">
                      Drop your score here
                    </div>

                    <div className="upload-subtitle">
                      or click to browse&nbsp;&nbsp;·&nbsp;&nbsp;PDF
                    </div>
                  </>
                ) : (
                  <>
                    <div className="upload-icon-wrap">
                      <CheckIcon size={24} />
                    </div>

                    <div className="uploaded-file">
                      <span className="uploaded-file-name">
                        {file.name}
                      </span>
                    </div>

                    <div className="uploaded-file-size">
                      {formatFileSize(file.size)}
                      &nbsp;&nbsp;·&nbsp;&nbsp; Click to replace
                    </div>
                  </>
                )}
              </div>

              {/* ───────── Instrument selection ───────── */}

              <section className="instrument-section">
                <div className="instrument-grid">

                  <div>
                    <label className="field-label">
                      Written for
                    </label>

                    <InstrumentSelect
                      value={originalInst}
                      onChange={setOriginalInst}
                      placeholder="Choose instrument…"
                      disabled={isProcessing}
                    />
                  </div>

                  <div className="instrument-arrow">
                    <ArrowIcon />
                  </div>

                  <div>
                    <label className="field-label">
                      Transpose to
                    </label>

                    <InstrumentSelect
                      value={finalInst}
                      onChange={setFinalInst}
                      placeholder="Choose instrument…"
                      disabled={isProcessing}
                    />
                  </div>

                </div>
              </section>

              {/* ───────── Convert button ───────── */}

              <button
                className={`convert-button ${
                  ready ? "ready" : ""
                }`}
                disabled={!ready}
                onClick={handleConvert}
              >
                {isProcessing ? (
                  <>
                    <Spinner />
                    Converting score…
                  </>
                ) : isDone ? (
                  <>
                    <CheckIcon color="#0e0d0a" />
                    Conversion complete
                  </>
                ) : (
                  "Convert & Download PDF"
                )}
              </button>

              {/* ───────── Error ───────── */}

              {stage === "error" && errorMsg && (
                <div className="error-box">
                  {errorMsg}
                </div>
              )}

              {/* ───────── Progress ───────── */}

              {jobId &&
                !isDone &&
                stage !== "error" && (
                  <section className="progress-panel">

                    <div className="progress-header">
                      <div className="progress-title">
                        Converting your score
                      </div>

                      <div className="progress-number">
                        {progressPercent}%
                      </div>
                    </div>

                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${Math.min(
                            progressPercent,
                            100
                          )}%`,
                        }}
                      />
                    </div>

                    <div className="stage-list">
                      {STAGES.map((item, index) => {
                        const completed =
                          currentStageIndex > index;

                        const active =
                          currentStageIndex === index;

                        return (
                          <div
                            key={item.id}
                            className={`stage-row ${
                              active ? "active" : ""
                            } ${
                              completed ? "complete" : ""
                            }`}
                          >
                            <div className="stage-dot">

                              {completed ? (
                                <CheckIcon size={12} />
                              ) : active ? (
                                <span className="active-dot" />
                              ) : null}

                            </div>

                            <span>
                              {item.title}
                            </span>

                            <span className="stage-description">
                              {active
                                ? item.description
                                : completed
                                ? "Complete"
                                : ""}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                  </section>
                )}

              {/* ───────── Success ───────── */}

              {isDone && (
                <section className="success-panel">

                  <div className="success-heading">
                    <CheckIcon size={19} />
                    <span>
                      Your score is ready
                    </span>
                  </div>

                  <div className="success-conversion">
                    {originalInst}
                    &nbsp;&nbsp;→&nbsp;&nbsp;
                    {finalInst}
                  </div>

                  <div className="success-copy">
                    MuseConvert has finished transposing
                    your score. Your new PDF is ready to
                    download.
                  </div>

                  <div className="success-actions">

                    <button
                      className="download-button"
                      onClick={handleDownload}
                      disabled={!downloadUrl}
                    >
                      <DownloadIcon />
                      Download PDF
                    </button>

                    <button
                      className="reset-button"
                      onClick={handleReset}
                    >
                      Convert another
                    </button>

                  </div>

                </section>
              )}

            </div>
          </main>

          <footer className="muse-footer">
            MuseConvert · MusicXML Transposition Engine
          </footer>

        </div>
      </div>
    </>
  );
}
