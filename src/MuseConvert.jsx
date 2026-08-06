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


const INSTRUMENTS = [
  "Piccolo", "Flute", "Alto Flute",
  "Oboe", "Oboe d'amore", "English Horn", "Heckelphone", "Bass Oboe",
  "Clarinet in Bb", "Clarinet in A", "Clarinet in Eb", "Basset Horn", "Bass Clarinet",
  "Bassoon", "Contrabassoon",
  "Saxophone Bb Soprano", "Saxophone Eb Alto", "Saxophone Bb Tenor",
  "Saxophone Eb Baritone", "Saxophone Bb Bass", "Saxophone Eb Contrabass",
  "Horn in F",
  "Tuba Bb", "Tuba Eb",
  "Trumpet in C", "Trumpet in Bb", "Trumpet in A",
  "Piccolo Trumpet Bb", "Piccolo Trumpet A",
  "Cornet in Bb", "Flugelhorn", "Posthorn", "Pocket Trumpet",
  "Alto Trombone", "Tenor Trombone", "Bass Trombone", "Contrabass Trombone",
  "Euphonium", "Tenor Tuba",
  "Timpani", "Xylophone", "Marimba", "Orchestra Bells", "Glockenspiel", "Vibraphone", "Chimes",
  "Guitar", "Violin", "Viola", "Cello", "Double Bass",
];


const BACKEND_URL = "https://museconvertmxl-production-ae99.up.railway.app"; // replace with actual URL


const StaffLines = () => (
  <svg viewBox="0 0 800 60" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.06 }}>
    {[10, 20, 30, 40, 50].map((y) => (
      <line key={y} x1="0" y1={y} x2="800" y2={y} stroke="#e8dcc8" strokeWidth="1" />
    ))}
  </svg>
);


const NoteIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <ellipse cx="7" cy="18" rx="4" ry="2.5" fill={color} transform="rotate(-15 7 18)" />
    <line x1="11" y1="17" x2="11" y2="4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M11 4 Q18 2 20 8" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
  </svg>
);


const ArrowIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M5 12h14M13 6l6 6-6 6" stroke="#c8a96e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);


const UploadIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
    <path d="M12 15V3M8 7l4-4 4 4" stroke="#c8a96e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 15v4a2 2 0 002 2h14a2 2 0 002-2v-4" stroke="#6b6452" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);


const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M5 12l5 5L20 7" stroke="#4caf82" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);


export default function MuseConvert() {
  const [file, setFile] = useState(null);
  const [originalInst, setOriginalInst] = useState("");
  const [finalInst, setFinalInst] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [errorMsg, setErrorMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();


  const handleFile = (f) => {
    if (!f) return;
    const ok = f.name.match(/\.(pdf)$/i);
    if (!ok) { setErrorMsg("Please upload a .pdf file."); setStatus("error"); return; }
    setFile(f);
    setStatus("idle");
    setErrorMsg("");
  };


  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }, []);


  const handleConvert = async () => {
    if (!file || !originalInst || !finalInst) return;
    if (originalInst === finalInst) {
      setErrorMsg("Source and target instruments must differ.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setErrorMsg("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("original_instrument", originalInst);
      form.append("final_instrument", finalInst);


      const res = await fetch(`${BACKEND_URL}/convert-pdf`, { method: "POST", body: form });


      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Server error ${res.status}`);
      }


      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `converted_${file.name.replace(/\.[^.]+$/, "")}_${finalInst.replace(/ /g, "_")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus("done");
    } catch (e) {
      setErrorMsg(e.message);
      setStatus("error");
    }
  };


  const ready = file && originalInst && finalInst && originalInst !== finalInst;


  return (
    <div style={{
      minHeight: "100vh",
      background: "#0f0e0b",
      color: "#e8dcc8",
      fontFamily: "'Georgia', 'Times New Roman', serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "0 24px 60px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background texture */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0,
        backgroundImage: `
          radial-gradient(ellipse 80% 40% at 50% 0%, #1a1710 0%, transparent 70%),
          repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(232,220,200,0.025) 29px)
        `,
        pointerEvents: "none",
      }} />


      {/* Header */}
      <header style={{ width: "100%", maxWidth: 780, position: "relative", zIndex: 1, paddingTop: 52, paddingBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
          <NoteIcon size={28} color="#c8a96e" />
          <span style={{
            fontSize: 13, letterSpacing: "0.25em", textTransform: "uppercase",
            color: "#c8a96e", fontFamily: "'Georgia', serif", fontStyle: "italic",
          }}>
            MuseConvert
          </span>
        </div>
        <h1 style={{
          fontSize: "clamp(36px, 6vw, 62px)",
          fontWeight: 400,
          lineHeight: 1.1,
          margin: 0,
          color: "#f0e8d4",
          letterSpacing: "-0.02em",
        }}>
          Transpose.<br />
          <span style={{ color: "#c8a96e", fontStyle: "italic" }}>Transcribe.</span>
        </h1>
        <p style={{
          marginTop: 16, fontSize: 15, color: "#9e9280", lineHeight: 1.7,
          maxWidth: 460, fontFamily: "'Georgia', serif",
        }}>
          Upload a PDF score, select instruments, and download a print-ready PDF — transposed to concert pitch automatically.
        </p>
        <div style={{ marginTop: 20, width: 48, height: 1, background: "#c8a96e", opacity: 0.5 }} />
      </header>


      {/* Card */}
      <main style={{
        width: "100%", maxWidth: 780, position: "relative", zIndex: 1,
        marginTop: 36,
        background: "#161410",
        border: "1px solid #2e2b24",
        borderRadius: 4,
        overflow: "hidden",
      }}>
        {/* Staff line decoration */}
        <div style={{ position: "relative", height: 60, overflow: "hidden", borderBottom: "1px solid #2e2b24" }}>
          <StaffLines />
          <div style={{ position: "absolute", left: 20, top: "50%", transform: "translateY(-50%)", opacity: 0.35, fontSize: 48, lineHeight: 1, color: "#e8dcc8" }}>𝄞</div>
          <div style={{ position: "absolute", right: 24, top: "50%", transform: "translateY(-50%)", fontSize: 11, letterSpacing: "0.2em", color: "#6b6452", textTransform: "uppercase" }}>
            PDF → PDF
          </div>
        </div>


        <div style={{ padding: "36px 40px 40px" }}>
          {/* Upload zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current.click()}
            style={{
              border: `1.5px dashed ${dragOver ? "#c8a96e" : file ? "#4caf82" : "#3a3628"}`,
              borderRadius: 3,
              padding: "32px 24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
              cursor: "pointer",
              transition: "all 0.2s",
              background: dragOver ? "rgba(200,169,110,0.04)" : file ? "rgba(76,175,130,0.04)" : "transparent",
              marginBottom: 32,
            }}
          >
            <input
              ref={fileRef} type="file" accept=".pdf"
              style={{ display: "none" }}
              onChange={(e) => handleFile(e.target.files[0])}
            />
            {file ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <CheckIcon />
                  <span style={{ fontSize: 15, color: "#4caf82" }}>{file.name}</span>
                </div>
                <span style={{ fontSize: 12, color: "#6b6452" }}>Click to change file</span>
              </>
            ) : (
              <>
                <UploadIcon />
                <span style={{ fontSize: 15, color: "#9e9280" }}>Drop your score here</span>
                <span style={{ fontSize: 12, color: "#504b42", letterSpacing: "0.1em" }}>
                  .PDF
                </span>
              </>
            )}
          </div>


          {/* Instrument selectors */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 16, alignItems: "end" }}>
            <div>
              <label style={{ display: "block", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "#6b6452", marginBottom: 8 }}>
                Original Instrument
              </label>
              <Select value={originalInst} onChange={setOriginalInst} placeholder="Written for…" />
            </div>


            <div style={{ paddingBottom: 10, opacity: 0.7 }}>
              <ArrowIcon />
            </div>


            <div>
              <label style={{ display: "block", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "#6b6452", marginBottom: 8 }}>
                Target Instrument
              </label>
              <Select value={finalInst} onChange={setFinalInst} placeholder="Transpose to…" />
            </div>
          </div>


          {/* Convert button */}
          <button
            onClick={handleConvert}
            disabled={!ready || status === "loading"}
            style={{
              marginTop: 32,
              width: "100%",
              padding: "15px 24px",
              background: ready && status !== "loading" ? "#c8a96e" : "#1e1c17",
              border: `1px solid ${ready && status !== "loading" ? "#c8a96e" : "#2e2b24"}`,
              borderRadius: 3,
              color: ready && status !== "loading" ? "#0f0e0b" : "#3a3628",
              fontSize: 13,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              fontFamily: "'Georgia', serif",
              cursor: ready && status !== "loading" ? "pointer" : "not-allowed",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            {status === "loading" ? (
              <>
                <Spinner />
                Transposing score…
              </>
            ) : status === "done" ? (
              <><CheckIcon /> Downloaded — convert another?</>
            ) : (
              "Convert & Download PDF"
            )}
          </button>


          {/* Error */}
          {status === "error" && errorMsg && (
            <div style={{
              marginTop: 16, padding: "12px 16px",
              background: "rgba(220,80,80,0.07)",
              border: "1px solid rgba(220,80,80,0.2)",
              borderRadius: 3, fontSize: 13, color: "#e07070", lineHeight: 1.5,
            }}>
              {errorMsg}
            </div>
          )}
        </div>
      </main>


      {/* Footer */}
      <footer style={{ marginTop: 40, fontSize: 12, color: "#3a3628", letterSpacing: "0.12em", zIndex: 1 }}>
        MUSECONVERT · MUSICXML TRANSPOSITION ENGINE
      </footer>
    </div>
  );
}


function Select({ value, onChange, placeholder }) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "11px 36px 11px 14px",
          background: "#0f0e0b",
          border: "1px solid #2e2b24",
          borderRadius: 3,
          color: value ? "#e8dcc8" : "#504b42",
          fontSize: 14,
          fontFamily: "'Georgia', serif",
          appearance: "none",
          cursor: "pointer",
          outline: "none",
        }}
        onFocus={(e) => e.target.style.borderColor = "#c8a96e"}
        onBlur={(e) => e.target.style.borderColor = "#2e2b24"}
      >
        <option value="" disabled>{placeholder}</option>
        {INSTRUMENTS.map((i) => (
          <option key={i} value={i}>{i}</option>
        ))}
      </select>
      <div style={{
        position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
        pointerEvents: "none", color: "#6b6452",
      }}>
        ▾
      </div>
    </div>
  );
}


function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 1s linear infinite" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="12" cy="12" r="9" stroke="#0f0e0b" strokeWidth="2.5" strokeLinecap="round"
        strokeDasharray="28 56" />
    </svg>
  );
}