import React, { useCallback, useEffect, useRef, useState } from "react";

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

/* ---------------------------------- */
/* Icons                              */
/* ---------------------------------- */

function InstrumentIcon() {
  return (
    <svg
      viewBox="0 0 48 48"
      width="38"
      height="38"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M11 31.5c4.8 0 7.3-2.3 7.3-6.9V11.7c0-1.5 1.2-2.7 2.7-2.7h1.6c1.5 0 2.7 1.2 2.7 2.7v12.9c0 8.1-4.6 13-13.3 13H11v-6.1Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M25.3 17.5h9.4c1.6 0 2.9 1.3 2.9 2.9v5.8c0 1.6-1.3 2.9-2.9 2.9h-9.4"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M31 17.5v11.6M35.4 17.5v11.6"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="13.7" cy="35.1" r="2.3" fill="currentColor" />
    </svg>
  );
}

function MusicStaff() {
  return (
    <svg
      className="music-staff"
      viewBox="0 0 900 150"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <g className="staff-lines">
        <line x1="0" y1="45" x2="900" y2="45" />
        <line x1="0" y1="60" x2="900" y2="60" />
        <line x1="0" y1="75" x2="900" y2="75" />
        <line x1="0" y1="90" x2="900" y2="90" />
        <line x1="0" y1="105" x2="900" y2="105" />
      </g>

      <g className="staff-notes">
        <text x="70" y="99">
          ♪
        </text>
        <text x="155" y="70">
          ♫
        </text>
        <text x="270" y="103">
          ♪
        </text>
        <text x="385" y="77">
          ♩
        </text>
        <text x="510" y="105">
          ♪
        </text>
        <text x="625" y="68">
          ♫
        </text>
        <text x="750" y="98">
          ♪
        </text>
        <text x="835" y="73">
          ♩
        </text>
      </g>
    </svg>
  );
}

function ArrowIcon({ direction = "right" }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{
        transform: direction === "down" ? "rotate(90deg)" : undefined,
      }}
    >
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
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
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

function UploadIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <path
        d="M16 21V6m0 0-5 5m5-5 5 5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 17v7.5A1.5 1.5 0 0 0 9.5 26h13a1.5 1.5 0 0 0 1.5-1.5V17"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 4v11m0 0 4-4m-4 4-4-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 20h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
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
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path
        d="m6 6 12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ---------------------------------- */
/* Main component                     */
/* ---------------------------------- */

export default function MuseConvert() {
  const [file, setFile] = useState(null);
  const [originalInst, setOriginalInst] = useState("");
  const [finalInst, setFinalInst] = useState("");

  const [jobId, setJobId] = useState(null);
  const [stage, setStage] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [downloadUrl, setDownloadUrl] = useState(null);

  const [dragActive, setDragActive] = useState(false);
  const [instrumentPicker, setInstrumentPicker] = useState(null);
  const [instrumentSearch, setInstrumentSearch] = useState("");

  const fileRef = useRef(null);
  const pickerRef = useRef(null);

  const isProcessing =
    !!jobId &&
    stage !== "done" &&
    stage !== "error" &&
    stage !== "idle";

  const currentStageIndex = PROGRESS_STAGES.findIndex(
    (item) => item.key === stage
  );

  /* ---------------------------------- */
  /* File handling                      */
  /* ---------------------------------- */

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
    setJobId(null);
    setDownloadUrl(null);
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

  /* ---------------------------------- */
  /* Poll conversion status             */
  /* ---------------------------------- */

  useEffect(() => {
    if (!jobId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/status/${jobId}`);
        const data = await res.json();

        if (data.stage) {
          setStage(data.stage);
        }
      } catch (_) {
        // Ignore temporary polling errors.
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [jobId]);

  /* ---------------------------------- */
  /* Close instrument picker            */
  /* ---------------------------------- */

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

  /* ---------------------------------- */
  /* Conversion                         */
  /* ---------------------------------- */

  const handleConvert = async () => {
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

    setStage("starting");
    setErrorMsg("");
    setJobId(null);
    setDownloadUrl(null);

    try {
      const form = new FormData();

      form.append("file", file);
      form.append("original_instrument", originalInst);
      form.append("final_instrument", finalInst);

      const res = await fetch(`${BACKEND_URL}/convert`, {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "The conversion could not be started."
        );
      }

      setJobId(data.job_id);
      setDownloadUrl(data.download_url);
    } catch (error) {
      setErrorMsg(
        error?.message ||
          "Something went wrong while starting the conversion."
      );
      setStage("error");
    }
  };

  const handleDownload = () => {
    if (!downloadUrl) return;

    window.location.href = `${BACKEND_URL}${downloadUrl}`;
  };

  const resetConverter = () => {
    setFile(null);
    setOriginalInst("");
    setFinalInst("");
    setJobId(null);
    setStage("idle");
    setErrorMsg("");
    setDownloadUrl(null);
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

  /* ---------------------------------- */
  /* UI                                 */
  /* ---------------------------------- */

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,600;1,500;1,600&display=swap');

        :root {
          --mc-bg: #0b0a08;
          --mc-surface: #12100d;
          --mc-surface-2: #181510;
          --mc-surface-3: #201c16;
          --mc-ivory: #eee6d6;
          --mc-muted: #968c7a;
          --mc-muted-2: #6f685d;
          --mc-gold: #c9a968;
          --mc-gold-light: #e0c78f;
          --mc-border: rgba(238, 230, 214, 0.11);
          --mc-border-strong: rgba(201, 169, 104, 0.36);
          --mc-green: #76ad8d;
          --mc-red: #c98272;
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
          background:
            radial-gradient(
              circle at 50% -10%,
              rgba(201, 169, 104, 0.10),
              transparent 34%
            ),
            radial-gradient(
              circle at 90% 55%,
              rgba(201, 169, 104, 0.035),
              transparent 28%
            ),
            var(--mc-bg);
          color: var(--mc-ivory);
          font-family: "DM Sans", sans-serif;
          overflow-x: hidden;
        }

        .mc-shell {
          width: min(1160px, calc(100% - 48px));
          margin: 0 auto;
        }

        .mc-nav {
          height: 82px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(238, 230, 214, 0.07);
        }

        .mc-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--mc-ivory);
        }

        .mc-brand-mark {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border: 1px solid var(--mc-border-strong);
          color: var(--mc-gold);
          border-radius: 50%;
          font-family: Georgia, serif;
          font-size: 20px;
        }

        .mc-brand-name {
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .mc-nav-right {
          display: flex;
          align-items: center;
          gap: 28px;
        }

        .mc-nav-link {
          color: var(--mc-muted);
          font-size: 12px;
          letter-spacing: 0.09em;
          text-transform: uppercase;
        }

        .mc-nav-pill {
          color: var(--mc-gold-light);
          border: 1px solid rgba(201, 169, 104, 0.22);
          border-radius: 999px;
          padding: 8px 13px;
          font-family: "DM Mono", monospace;
          font-size: 10px;
          letter-spacing: 0.06em;
        }

        .mc-hero {
          position: relative;
          padding: 96px 0 76px;
          text-align: center;
        }

        .mc-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: var(--mc-gold);
          font-family: "DM Mono", monospace;
          font-size: 10px;
          letter-spacing: 0.17em;
          text-transform: uppercase;
          margin-bottom: 24px;
        }

        .mc-eyebrow::before,
        .mc-eyebrow::after {
          content: "";
          width: 28px;
          height: 1px;
          background: rgba(201, 169, 104, 0.45);
        }

        .mc-hero h1 {
          max-width: 800px;
          margin: 0 auto;
          font-family: "Playfair Display", Georgia, serif;
          font-size: clamp(54px, 7vw, 88px);
          line-height: 0.98;
          font-weight: 500;
          letter-spacing: -0.045em;
        }

        .mc-hero h1 em {
          color: var(--mc-gold-light);
          font-style: italic;
        }

        .mc-hero-copy {
          max-width: 570px;
          margin: 26px auto 0;
          color: var(--mc-muted);
          font-size: 16px;
          line-height: 1.7;
        }

        .mc-staff-wrap {
          position: relative;
          max-width: 900px;
          height: 110px;
          margin: 44px auto -5px;
          opacity: 0.48;
          mask-image: linear-gradient(
            90deg,
            transparent,
            black 13%,
            black 87%,
            transparent
          );
          -webkit-mask-image: linear-gradient(
            90deg,
            transparent,
            black 13%,
            black 87%,
            transparent
          );
        }

        .music-staff {
          width: 100%;
          height: 100%;
        }

        .staff-lines line {
          stroke: rgba(201, 169, 104, 0.22);
          stroke-width: 1;
        }

        .staff-notes {
          fill: rgba(224, 199, 143, 0.75);
          font-family: Georgia, serif;
          font-size: 42px;
        }

        .mc-workspace {
          position: relative;
          margin-bottom: 100px;
        }

        .mc-workspace-card {
          position: relative;
          background:
            linear-gradient(
              145deg,
              rgba(24, 21, 16, 0.97),
              rgba(15, 13, 10, 0.98)
            );
          border: 1px solid var(--mc-border);
          border-radius: 24px;
          box-shadow:
            0 30px 90px rgba(0, 0, 0, 0.34),
            inset 0 1px 0 rgba(255, 255, 255, 0.025);
          overflow: visible;
        }

        .mc-workspace-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 28px;
          border-bottom: 1px solid var(--mc-border);
        }

        .mc-workspace-title {
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .mc-workspace-subtitle {
          margin-top: 4px;
          color: var(--mc-muted-2);
          font-size: 12px;
        }

        .mc-step {
          font-family: "DM Mono", monospace;
          color: var(--mc-muted);
          font-size: 10px;
          letter-spacing: 0.08em;
        }

        .mc-main-grid {
          display: grid;
          grid-template-columns: 1.12fr 0.88fr;
          min-height: 470px;
        }

        .mc-upload-panel {
          padding: 32px;
          border-right: 1px solid var(--mc-border);
          display: flex;
          flex-direction: column;
        }

        .mc-section-label {
          color: var(--mc-muted);
          font-family: "DM Mono", monospace;
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 13px;
        }

        .mc-dropzone {
          flex: 1;
          min-height: 330px;
          border: 1px dashed rgba(238, 230, 214, 0.18);
          border-radius: 17px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          cursor: pointer;
          transition: all 180ms ease;
          background:
            radial-gradient(
              circle at 50% 42%,
              rgba(201, 169, 104, 0.055),
              transparent 35%
            ),
            rgba(255, 255, 255, 0.008);
        }

        .mc-dropzone:hover,
        .mc-dropzone.active {
          border-color: rgba(201, 169, 104, 0.55);
          background:
            radial-gradient(
              circle at 50% 42%,
              rgba(201, 169, 104, 0.09),
              transparent 40%
            ),
            rgba(201, 169, 104, 0.018);
          transform: translateY(-1px);
        }

        .mc-dropzone-content {
          max-width: 340px;
          padding: 35px;
        }

        .mc-upload-icon {
          width: 68px;
          height: 68px;
          margin: 0 auto 22px;
          display: grid;
          place-items: center;
          color: var(--mc-gold);
          border: 1px solid rgba(201, 169, 104, 0.25);
          background: rgba(201, 169, 104, 0.045);
          border-radius: 50%;
        }

        .mc-dropzone h2 {
          margin: 0;
          font-family: "Playfair Display", Georgia, serif;
          font-weight: 500;
          font-size: 27px;
          letter-spacing: -0.02em;
        }

        .mc-dropzone p {
          margin: 10px 0 0;
          color: var(--mc-muted);
          font-size: 13px;
          line-height: 1.6;
        }

        .mc-browse {
          display: inline-block;
          margin-top: 22px;
          color: var(--mc-gold-light);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .mc-file-card {
          flex: 1;
          min-height: 330px;
          border-radius: 17px;
          background: linear-gradient(145deg, #1d1913, #13110d);
          border: 1px solid rgba(201, 169, 104, 0.22);
          padding: 30px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .mc-file-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
        }

        .mc-file-icon {
          width: 54px;
          height: 68px;
          border: 1px solid rgba(201, 169, 104, 0.35);
          background: rgba(201, 169, 104, 0.055);
          display: grid;
          place-items: center;
          color: var(--mc-gold);
          border-radius: 8px;
          font-family: "DM Mono", monospace;
          font-size: 11px;
          position: relative;
        }

        .mc-file-icon::after {
          content: "";
          position: absolute;
          top: -1px;
          right: -1px;
          width: 14px;
          height: 14px;
          background: var(--mc-bg);
          border-left: 1px solid rgba(201, 169, 104, 0.35);
          border-bottom: 1px solid rgba(201, 169, 104, 0.35);
        }

        .mc-remove {
          width: 32px;
          height: 32px;
          border: 1px solid var(--mc-border);
          background: transparent;
          color: var(--mc-muted);
          border-radius: 50%;
          display: grid;
          place-items: center;
          cursor: pointer;
        }

        .mc-remove:hover {
          color: var(--mc-ivory);
          border-color: rgba(238, 230, 214, 0.28);
        }

        .mc-file-name {
          margin-top: 26px;
          color: var(--mc-ivory);
          font-size: 16px;
          font-weight: 600;
          line-height: 1.4;
          word-break: break-word;
        }

        .mc-file-meta {
          margin-top: 7px;
          color: var(--mc-muted-2);
          font-family: "DM Mono", monospace;
          font-size: 10px;
        }

        .mc-file-ready {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--mc-green);
          font-family: "DM Mono", monospace;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .mc-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
        }

        .mc-controls {
          padding: 32px;
          display: flex;
          flex-direction: column;
        }

        .mc-controls-title {
          font-family: "Playfair Display", Georgia, serif;
          font-size: 25px;
          font-weight: 500;
          margin-bottom: 27px;
        }

        .mc-instruments {
          display: flex;
          align-items: stretch;
          gap: 12px;
        }

        .mc-instrument {
          position: relative;
          flex: 1;
          min-width: 0;
        }

        .mc-instrument-label {
          color: var(--mc-muted);
          font-family: "DM Mono", monospace;
          font-size: 9px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 9px;
        }

        .mc-instrument-button {
          width: 100%;
          min-height: 94px;
          padding: 17px;
          border: 1px solid var(--mc-border);
          border-radius: 13px;
          background: rgba(255, 255, 255, 0.018);
          color: var(--mc-ivory);
          text-align: left;
          cursor: pointer;
          transition: all 160ms ease;
        }

        .mc-instrument-button:hover,
        .mc-instrument-button.selected {
          border-color: rgba(201, 169, 104, 0.45);
          background: rgba(201, 169, 104, 0.045);
        }

        .mc-instrument-button-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          color: var(--mc-gold);
        }

        .mc-instrument-name {
          margin-top: 11px;
          color: var(--mc-ivory);
          font-size: 14px;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .mc-instrument-hint {
          margin-top: 4px;
          color: var(--mc-muted-2);
          font-size: 10px;
        }

        .mc-arrow-between {
          align-self: center;
          color: var(--mc-gold);
          margin-top: 21px;
        }

        .mc-picker {
          position: absolute;
          z-index: 50;
          top: calc(100% + 9px);
          left: 0;
          width: min(340px, 75vw);
          background: #17140f;
          border: 1px solid rgba(201, 169, 104, 0.28);
          border-radius: 15px;
          padding: 12px;
          box-shadow: 0 28px 70px rgba(0, 0, 0, 0.55);
        }

        .mc-picker-search {
          display: flex;
          align-items: center;
          gap: 9px;
          border: 1px solid var(--mc-border);
          background: rgba(255, 255, 255, 0.025);
          border-radius: 9px;
          padding: 10px 11px;
          color: var(--mc-muted);
        }

        .mc-picker-search input {
          width: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          color: var(--mc-ivory);
          font-size: 12px;
        }

        .mc-picker-search input::placeholder {
          color: var(--mc-muted-2);
        }

        .mc-picker-list {
          max-height: 285px;
          overflow-y: auto;
          margin-top: 8px;
          padding-right: 3px;
        }

        .mc-picker-list::-webkit-scrollbar {
          width: 4px;
        }

        .mc-picker-list::-webkit-scrollbar-thumb {
          background: rgba(238, 230, 214, 0.12);
          border-radius: 10px;
        }

        .mc-group {
          padding: 8px 3px 4px;
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
          border: 0;
          background: transparent;
          color: var(--mc-muted);
          border-radius: 7px;
          text-align: left;
          padding: 9px 8px;
          cursor: pointer;
          font-size: 12px;
        }

        .mc-option:hover,
        .mc-option.current {
          color: var(--mc-ivory);
          background: rgba(201, 169, 104, 0.08);
        }

        .mc-option.current {
          box-shadow: inset 2px 0 0 var(--mc-gold);
        }

        .mc-action {
          margin-top: auto;
          padding-top: 30px;
        }

        .mc-convert-button {
          width: 100%;
          min-height: 56px;
          border: 0;
          border-radius: 10px;
          background: var(--mc-gold);
          color: #17120a;
          font-weight: 700;
          font-size: 12px;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 180ms ease;
          box-shadow: 0 8px 25px rgba(201, 169, 104, 0.12);
        }

        .mc-convert-button:hover:not(:disabled) {
          background: var(--mc-gold-light);
          transform: translateY(-1px);
          box-shadow: 0 12px 30px rgba(201, 169, 104, 0.17);
        }

        .mc-convert-button:disabled {
          opacity: 0.38;
          cursor: not-allowed;
          box-shadow: none;
        }

        .mc-error {
          margin-top: 14px;
          border: 1px solid rgba(201, 130, 114, 0.27);
          background: rgba(201, 130, 114, 0.055);
          color: #dca79a;
          border-radius: 9px;
          padding: 12px 14px;
          font-size: 12px;
          line-height: 1.5;
        }

        .mc-progress {
          padding: 45px 46px 48px;
        }

        .mc-progress-heading {
          text-align: center;
          max-width: 600px;
          margin: 0 auto 38px;
        }

        .mc-progress-heading .mc-eyebrow {
          margin-bottom: 15px;
        }

        .mc-progress-heading h2 {
          margin: 0;
          font-family: "Playfair Display", Georgia, serif;
          font-size: 42px;
          font-weight: 500;
          letter-spacing: -0.035em;
        }

        .mc-progress-heading h2 em {
          color: var(--mc-gold-light);
          font-style: italic;
        }

        .mc-progress-heading p {
          margin: 11px 0 0;
          color: var(--mc-muted);
          font-size: 13px;
        }

        .mc-progress-visual {
          position: relative;
          height: 150px;
          margin: 0 auto 38px;
          max-width: 760px;
          overflow: hidden;
          border-top: 1px solid rgba(201, 169, 104, 0.12);
          border-bottom: 1px solid rgba(201, 169, 104, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .mc-progress-staff {
          position: absolute;
          width: 100%;
          opacity: 0.5;
        }

        .mc-progress-notes {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 34px;
          color: var(--mc-gold-light);
          font-family: Georgia, serif;
          font-size: 38px;
          animation: mcFloat 2.5s ease-in-out infinite;
        }

        .mc-progress-notes span:nth-child(2) {
          animation-delay: 180ms;
        }

        .mc-progress-notes span:nth-child(3) {
          animation-delay: 360ms;
        }

        .mc-progress-notes span:nth-child(4) {
          animation-delay: 540ms;
        }

        @keyframes mcFloat {
          0%,
          100% {
            transform: translateY(0);
            opacity: 0.65;
          }

          50% {
            transform: translateY(-5px);
            opacity: 1;
          }
        }

        .mc-stage-list {
          max-width: 760px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 8px;
        }

        .mc-stage {
          border-top: 2px solid rgba(238, 230, 214, 0.08);
          padding-top: 12px;
          color: var(--mc-muted-2);
        }

        .mc-stage.complete {
          border-top-color: var(--mc-gold);
          color: var(--mc-ivory);
        }

        .mc-stage.active {
          border-top-color: var(--mc-gold);
          color: var(--mc-gold-light);
        }

        .mc-stage-number {
          font-family: "DM Mono", monospace;
          font-size: 9px;
          color: inherit;
        }

        .mc-stage-label {
          margin-top: 7px;
          font-size: 11px;
          font-weight: 600;
        }

        .mc-stage-desc {
          margin-top: 4px;
          color: var(--mc-muted-2);
          font-size: 9px;
          line-height: 1.4;
        }

        .mc-result {
          padding: 62px 45px 55px;
          text-align: center;
        }

        .mc-result-check {
          width: 74px;
          height: 74px;
          margin: 0 auto 25px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          color: var(--mc-gold-light);
          border: 1px solid rgba(201, 169, 104, 0.42);
          background: rgba(201, 169, 104, 0.055);
        }

        .mc-result h2 {
          margin: 0;
          font-family: "Playfair Display", Georgia, serif;
          font-size: 48px;
          font-weight: 500;
          letter-spacing: -0.04em;
        }

        .mc-result-copy {
          max-width: 500px;
          margin: 13px auto 28px;
          color: var(--mc-muted);
          font-size: 13px;
          line-height: 1.6;
        }

        .mc-result-copy strong {
          color: var(--mc-ivory);
          font-weight: 600;
        }

        .mc-result-card {
          max-width: 500px;
          margin: 0 auto 24px;
          padding: 16px 18px;
          border: 1px solid var(--mc-border);
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.018);
          display: flex;
          align-items: center;
          gap: 12px;
          text-align: left;
        }

        .mc-result-card-icon {
          color: var(--mc-gold);
        }

        .mc-result-file {
          min-width: 0;
          color: var(--mc-ivory);
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .mc-result-route {
          margin-top: 4px;
          color: var(--mc-muted-2);
          font-family: "DM Mono", monospace;
          font-size: 9px;
        }

        .mc-result-actions {
          display: flex;
          justify-content: center;
          gap: 10px;
        }

        .mc-download {
          min-height: 48px;
          padding: 0 23px;
          border: 0;
          border-radius: 9px;
          background: var(--mc-gold);
          color: #17120a;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          display: inline-flex;
          align-items: center;
          gap: 9px;
          cursor: pointer;
        }

        .mc-download:hover {
          background: var(--mc-gold-light);
        }

        .mc-again {
          min-height: 48px;
          padding: 0 20px;
          border: 1px solid var(--mc-border);
          border-radius: 9px;
          background: transparent;
          color: var(--mc-muted);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
        }

        .mc-again:hover {
          color: var(--mc-ivory);
          border-color: rgba(238, 230, 214, 0.25);
        }

        .mc-footer {
          padding: 0 0 50px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: var(--mc-muted-2);
          font-family: "DM Mono", monospace;
          font-size: 9px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .mc-footer-gold {
          color: rgba(201, 169, 104, 0.65);
        }

        @media (max-width: 850px) {
          .mc-shell {
            width: min(100% - 28px, 700px);
          }

          .mc-nav {
            height: 70px;
          }

          .mc-nav-link {
            display: none;
          }

          .mc-hero {
            padding: 70px 0 48px;
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
            min-height: 280px;
          }

          .mc-stage-list {
            grid-template-columns: repeat(2, 1fr);
            row-gap: 18px;
          }
        }

        @media (max-width: 600px) {
          .mc-shell {
            width: min(100% - 20px, 700px);
          }

          .mc-brand-name {
            font-size: 13px;
          }

          .mc-nav-pill {
            display: none;
          }

          .mc-hero {
            padding: 60px 0 35px;
          }

          .mc-hero h1 {
            font-size: 50px;
          }

          .mc-hero-copy {
            font-size: 14px;
          }

          .mc-staff-wrap {
            height: 80px;
          }

          .mc-workspace {
            margin-bottom: 70px;
          }

          .mc-workspace-header {
            padding: 20px;
          }

          .mc-upload-panel,
          .mc-controls {
            padding: 20px;
          }

          .mc-instruments {
            flex-direction: column;
          }

          .mc-arrow-between {
            transform: rotate(90deg);
            margin: -2px auto;
          }

          .mc-instrument-button {
            min-height: 84px;
          }

          .mc-picker {
            width: 100%;
          }

          .mc-progress {
            padding: 32px 20px 35px;
          }

          .mc-progress-heading h2 {
            font-size: 34px;
          }

          .mc-stage-list {
            grid-template-columns: 1fr;
          }

          .mc-result {
            padding: 45px 20px;
          }

          .mc-result h2 {
            font-size: 39px;
          }

          .mc-result-actions {
            flex-direction: column;
          }

          .mc-download,
          .mc-again {
            width: 100%;
            justify-content: center;
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
          {/* NAVIGATION */}
          <nav className="mc-nav">
            <div className="mc-brand">
              <div className="mc-brand-mark">♫</div>
              <div className="mc-brand-name">MuseConvert</div>
            </div>

            <div className="mc-nav-right">
              <div className="mc-nav-link">
                Sheet Music, Reimagined
              </div>

              <div className="mc-nav-pill">PDF → PDF</div>
            </div>
          </nav>

          {/* HERO */}
          <section className="mc-hero">
            <div className="mc-eyebrow">The Score Studio</div>

            <h1>
              Your music.
              <br />
              <em>Any instrument.</em>
            </h1>

            <p className="mc-hero-copy">
              Transform sheet-music PDFs into clean, transposed scores.
              Upload a score, choose where it is going, and let
              MuseConvert handle the notation.
            </p>

            <div className="mc-staff-wrap">
              <MusicStaff />
            </div>
          </section>

          {/* WORKSPACE */}
          <main className="mc-workspace">
            <div className="mc-workspace-card">
              {!isProcessing && stage !== "done" && stage !== "error" && (
                <>
                  <div className="mc-workspace-header">
                    <div>
                      <div className="mc-workspace-title">
                        Convert your score
                      </div>

                      <div className="mc-workspace-subtitle">
                        A few seconds from the instrument you have to the
                        one you need.
                      </div>
                    </div>

                    <div className="mc-step">01 / 01</div>
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
                          onClick={() => fileRef.current?.click()}
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

                            <h2>Drop your score here</h2>

                            <p>
                              Bring in a PDF of the sheet music you
                              want to transpose.
                            </p>

                            <span className="mc-browse">
                              Browse your files →
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="mc-file-card">
                          <div>
                            <div className="mc-file-top">
                              <div className="mc-file-icon">PDF</div>

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
                              {(file.size / 1024 / 1024).toFixed(2)} MB ·
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
                              <InstrumentIcon />
                              <ArrowIcon direction="down" />
                            </div>

                            <div className="mc-instrument-name">
                              {originalInst || "Choose instrument"}
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

                        <div className="mc-arrow-between">
                          <ArrowIcon />
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
                              <InstrumentIcon />
                              <ArrowIcon direction="down" />
                            </div>

                            <div className="mc-instrument-name">
                              {finalInst || "Choose instrument"}
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
                          <div className="mc-error">{errorMsg}</div>
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
                            } ${active ? "active" : ""}`}
                          >
                            <div className="mc-stage-number">
                              {complete ? "✓" : `0${index + 1}`}
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

                  <h2>Your score is ready.</h2>

                  <p className="mc-result-copy">
                    The music has been transposed from{" "}
                    <strong>{originalInst}</strong> to{" "}
                    <strong>{finalInst}</strong>. Your new PDF is ready
                    to download.
                  </p>

                  <div className="mc-result-card">
                    <div className="mc-result-card-icon">
                      <span
                        style={{
                          fontFamily: "Georgia",
                          fontSize: 24,
                        }}
                      >
                        ♫
                      </span>
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div className="mc-result-file">
                        {file?.name || "Converted score.pdf"}
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
                      <DownloadIcon />
                      Download PDF
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
                      borderColor: "rgba(201,130,114,0.35)",
                      background: "rgba(201,130,114,0.05)",
                    }}
                  >
                    <XIcon />
                  </div>

                  <h2>Something went wrong.</h2>

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
            <span>© {new Date().getFullYear()} MuseConvert</span>

            <span className="mc-footer-gold">
              Built for musicians, by musicians
            </span>
          </footer>
        </div>
      </div>
    </>
  );
}

/* ---------------------------------- */
/* Instrument picker                  */
/* ---------------------------------- */

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
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search instruments..."
        />
      </div>

      <div className="mc-picker-list">
        {groups.map((group) => (
          <div className="mc-group" key={group.name}>
            <div className="mc-group-name">{group.name}</div>

            {group.instruments.map((instrument) => (
              <button
                type="button"
                key={instrument}
                className={`mc-option ${
                  activeInstrument === instrument ? "current" : ""
                }`}
                onClick={() => onChoose(instrument)}
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
              fontSize: "12px",
            }}
          >
            No instruments found.
          </div>
        )}
      </div>
    </div>
  );
}
