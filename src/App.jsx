import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";

// ─── BONUS TIEMPO (Test) ────────────────────────────────────────────────────
// Si el tiempo total del test <= 7s → 500 pts extra
// Por cada segundo adicional desde 7 → resta 25 pts
// A partir de 31s → 0 pts extra
function timeBonus(totalSeconds) {
  if (totalSeconds <= 7) return 500;
  if (totalSeconds >= 31) return 0;
  return 500 - (totalSeconds - 7) * 25;
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { background: linear-gradient(135deg, #05080f 0%, #0a1020 50%, #050d1a 100%); background-attachment: fixed; color: #e8f0ff; font-family: 'Inter', sans-serif; min-height: 100vh; }
.app { min-height: 100vh; display: flex; flex-direction: column; }

/* HEADER */
.hdr { background: #05080f; border-bottom: 1px solid #1a2a45; padding: 0 20px; height: 56px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 200; }
.hdr-logo { font-family: 'Bebas Neue', sans-serif; font-size: 26px; letter-spacing: 2px; color: #4a9eff; }
.hdr-logo span { color: #e8f0ff; }
.hdr-right { display: flex; align-items: center; gap: 10px; }
.hdr-user { font-size: 13px; color: #4a6080; }
.hdr-pts { font-family: 'Bebas Neue', sans-serif; font-size: 18px; color: #f5c518; }
.btn-out { background: none; border: 1px solid #1a2a45; color: #4a6080; border-radius: 6px; padding: 3px 10px; font-size: 12px; cursor: pointer; }
.btn-out:hover { color: #e8f0ff; }

/* NAV */
.nav { background: #0a1020; border-bottom: 1px solid #1a2a45; display: flex; overflow-x: auto; }
.nav::-webkit-scrollbar { display: none; }
.nav-btn { background: none; border: none; color: #4a6080; padding: 13px 14px; font-size: 11px; font-weight: 600; cursor: pointer; white-space: nowrap; border-bottom: 2px solid transparent; font-family: 'Inter', sans-serif; text-transform: uppercase; transition: all 0.15s; letter-spacing: 0.5px; }
.nav-btn:hover { color: #e8f0ff; }
.nav-btn.on { color: #4a9eff; border-bottom-color: #4a9eff; }

/* MAIN */
.main { flex: 1; padding: 20px 16px; max-width: 680px; margin: 0 auto; width: 100%; }

/* LOGIN */
.login-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #05080f; padding: 20px; }
.login-box { width: 100%; max-width: 380px; }
.login-logo { font-family: 'Bebas Neue', sans-serif; font-size: 52px; letter-spacing: 4px; color: #4a9eff; text-align: center; line-height: 1; }
.login-logo em { color: #e8f0ff; font-style: normal; }
.login-tag { text-align: center; color: #7a9abf; font-size: 16px; line-height: 1.6; margin: 14px 0 32px; }
.inp-lbl { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #4a6080; margin-bottom: 6px; display: block; }
.inp { width: 100%; background: #0a1020; border: 1px solid #1a2a45; border-radius: 8px; padding: 11px 14px; color: #e8f0ff; font-size: 14px; font-family: 'Inter', sans-serif; outline: none; margin-bottom: 14px; transition: border-color 0.15s; }
.inp:focus { border-color: #4a9eff; }
.btn-main { width: 100%; background: #4a9eff; color: #0a0a0f; border: none; border-radius: 8px; padding: 13px; font-family: 'Bebas Neue', sans-serif; font-size: 20px; letter-spacing: 1px; cursor: pointer; }
.btn-main:hover { background: #c0ff70; }
.btn-sub { width: 100%; background: none; border: 1px solid #1a2a45; color: #4a6080; border-radius: 8px; padding: 10px; font-size: 13px; cursor: pointer; margin-top: 10px; font-family: 'Inter', sans-serif; }
.btn-sub:hover { color: #e8f0ff; }

/* CARD */
.card { background: #0d1525; border: 1px solid #1a2a45; border-radius: 14px; padding: 22px; margin-bottom: 16px; }
.card-title { font-family: 'Bebas Neue', sans-serif; font-size: 22px; letter-spacing: 1px; color: #4a9eff; margin-bottom: 4px; }
.card-sub { font-size: 12px; color: #4a6080; margin-bottom: 18px; }

/* INTRO OVERLAY */
.overlay { position: fixed; inset: 0; background: #05080fdd; display: flex; align-items: center; justify-content: center; z-index: 300; padding: 20px; }
.intro-box { background: #0d1525; border: 1px solid #1a2a45; border-radius: 16px; padding: 32px; max-width: 420px; width: 100%; text-align: center; }
.intro-icon { font-size: 56px; margin-bottom: 16px; }
.intro-title { font-family: 'Bebas Neue', sans-serif; font-size: 30px; color: #4a9eff; letter-spacing: 2px; margin-bottom: 12px; }
.intro-text { font-size: 14px; color: #7a9abf; line-height: 1.7; margin-bottom: 24px; }
.btn-green { background: #1a3a6b; color: #e8f0ff; border: none; border-radius: 8px; padding: 12px 32px; font-family: 'Bebas Neue', sans-serif; font-size: 20px; letter-spacing: 1px; cursor: pointer; }
.btn-green:hover { background: #2260c0; }
.btn-rojo { background: #2a101044; color: #e74c3c; border: 1px solid #e74c3c55; border-radius: 8px; padding: 8px 16px; font-size: 13px; cursor: pointer; font-family: 'Inter', sans-serif; }
.btn-rojo:hover { background: #e74c3c22; }

/* COUNTDOWN */
.countdown { font-family: 'Bebas Neue', sans-serif; font-size: 120px; color: #4a9eff; text-align: center; padding: 60px 0; text-shadow: 0 0 40px #a8ff3e88; }

/* RESULT OVERLAY */
.result-overlay-pts { font-family: 'Bebas Neue', sans-serif; font-size: 80px; color: #4a9eff; text-align: center; letter-spacing: 2px; text-shadow: 0 0 30px #a8ff3e55; line-height: 1; }
.result-overlay-lbl { text-align: center; color: #4a6080; font-size: 13px; margin: 6px 0 20px; }
.result-mini-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
.rms { background: #05080f; border: 1px solid #1a2a45; border-radius: 10px; padding: 12px; text-align: center; }
.rms-val { font-family: 'Bebas Neue', sans-serif; font-size: 22px; color: #e8f0ff; }
.rms-lbl { font-size: 11px; color: #4a6080; margin-top: 2px; }
.result-overlay-btns { display: flex; flex-direction: column; gap: 8px; }

/* TEST */
.nivel-badge { display: inline-block; border-radius: 4px; padding: 2px 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
.nivel-facil    { background: #2260c022; color: #22a050; border: 1px solid #22a05044; }
.nivel-medio    { background: #f5c51822; color: #f5c518; border: 1px solid #f5c51844; }
.nivel-dificil  { background: #e74c3c22; color: #e74c3c; border: 1px solid #e74c3c44; }
.nivel-muyDificil { background: #9b59b622; color: #9b59b6; border: 1px solid #9b59b644; }
.q-num { font-size: 12px; color: #4a6080; margin-bottom: 6px; }
.q-text { font-family: 'Bebas Neue', sans-serif; font-size: 26px; line-height: 1.2; color: #e8f0ff; margin-bottom: 22px; }
.opts { display: flex; flex-direction: column; gap: 9px; }
.opt { background: #05080f; border: 1.5px solid #1a2a45; border-radius: 10px; padding: 13px 16px; color: #b0c8e8; font-size: 14px; cursor: pointer; text-align: left; font-family: 'Inter', sans-serif; transition: all 0.12s; display: flex; align-items: center; gap: 12px; }
.opt:hover:not(:disabled) { border-color: #4a9eff; color: #e8f0ff; }
.opt.ok { background: #1a2a4a; border-color: #22a050; color: #4a9eff; }
.opt.ko { background: #2a1010; border-color: #e74c3c; color: #e74c3c; }
.opt:disabled { cursor: default; }
.opt-letra { font-family: 'Bebas Neue', sans-serif; font-size: 16px; color: #4a6080; min-width: 18px; }
.progress-row { display: flex; gap: 4px; margin-bottom: 18px; }
.progress-dot { height: 4px; flex: 1; border-radius: 2px; background: #1a2a45; }
.progress-dot.done { background: #2260c0; }
.progress-dot.current { background: #4a9eff; }
.racha-badge { display: inline-flex; align-items: center; gap: 6px; background: #f5c51815; border: 1px solid #f5c51840; border-radius: 20px; padding: 4px 12px; font-size: 13px; color: #f5c518; font-weight: 700; margin-bottom: 14px; }
.score-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.score-live { font-family: 'Bebas Neue', sans-serif; font-size: 28px; color: #4a9eff; }

/* RESULT FINAL TEST */
.result-pts-big { font-family: 'Bebas Neue', sans-serif; font-size: 72px; color: #4a9eff; text-align: center; text-shadow: 0 0 30px #a8ff3e55; }
.result-sub { text-align: center; color: #4a6080; font-size: 13px; margin-bottom: 6px; }
.result-grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin: 18px 0; }
.rs { background: #05080f; border: 1px solid #1a2a45; border-radius: 10px; padding: 14px; text-align: center; }
.rs-val { font-family: 'Bebas Neue', sans-serif; font-size: 28px; color: #e8f0ff; }
.rs-lbl { font-size: 11px; color: #4a6080; margin-top: 2px; }
.answer-review { display: flex; flex-direction: column; gap: 6px; margin-bottom: 20px; }
.ar { padding: 10px 14px; border-radius: 8px; font-size: 13px; display: flex; align-items: flex-start; gap: 8px; }
.ar-ok { background: #1a2a4a44; border: 1px solid #22a05033; color: #a8d8b0; }
.ar-ko { background: #2a101044; border: 1px solid #e74c3c33; color: #e8a0a0; }
.rank-summary { background: #05080f; border: 1px solid #f5c51833; border-radius: 10px; padding: 14px; margin-bottom: 16px; }
.rank-summary-title { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #4a6080; margin-bottom: 10px; }
.rank-summary-row { display: flex; justify-content: space-between; font-size: 13px; padding: 5px 0; border-bottom: 1px solid #1a2a4533; }
.rank-summary-row:last-child { border-bottom: none; }

/* ALINEACION */
.campo { background: linear-gradient(180deg, #05080f 0%, #080d1a 40%, #05080f 100%); border: 1px solid #1a2a45; border-radius: 12px; padding: 16px 12px; margin-bottom: 16px; position: relative; }
.campo::after { content: ''; position: absolute; top: 50%; left: 8%; right: 8%; height: 1px; background: #ffffff15; }
.campo-row { display: flex; justify-content: space-around; margin-bottom: 14px; }
.camp-player { display: flex; flex-direction: column; align-items: center; gap: 5px; }
.camp-circle { width: 44px; height: 44px; border-radius: 50%; border: 2px solid #1a2a45; background: #05080f; display: flex; align-items: center; justify-content: center; font-size: 20px; transition: all 0.2s; }
.camp-circle.found { background: #1a3a6b; border-color: #4a9eff; box-shadow: 0 0 12px #a8ff3e44; }
.camp-name { font-size: 10px; color: #4a6080; text-align: center; max-width: 56px; }
.camp-name.found { color: #4a9eff; font-weight: 700; }
.ali-info { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 12px; }
.ali-form { color: #4a9eff; font-family: 'Bebas Neue', sans-serif; font-size: 18px; }
.ali-partido { text-align: right; color: #4a6080; line-height: 1.6; }
.ali-partido strong { color: #e8f0ff; }
.guess-row { display: flex; gap: 8px; margin-bottom: 12px; }
.guess-inp { flex: 1; background: #05080f; border: 1px solid #1a2a45; border-radius: 8px; padding: 10px 14px; color: #e8f0ff; font-size: 14px; font-family: 'Inter', sans-serif; outline: none; }
.guess-inp:focus { border-color: #4a9eff; }
.btn-send { background: #1a3a6b; color: #e8f0ff; border: none; border-radius: 8px; padding: 10px 18px; font-weight: 700; cursor: pointer; font-family: 'Inter', sans-serif; }
.btn-send:hover { background: #2260c0; }
.tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
.tag-ok { background: #1a2a4a44; border: 1px solid #22a05044; border-radius: 14px; padding: 3px 10px; font-size: 12px; color: #4a9eff; }
.tag-ko { background: #2a101044; border: 1px solid #e74c3c44; border-radius: 14px; padding: 3px 10px; font-size: 12px; color: #e74c3c; }
.timer-bar-wrap { height: 6px; background: #1a2a45; border-radius: 3px; margin-bottom: 14px; overflow: hidden; }
.timer-bar { height: 6px; border-radius: 3px; background: #4a9eff; transition: width 1s linear, background 0.5s; }
.timer-bar.warn { background: #f5c518; }
.timer-bar.danger { background: #e74c3c; }
.timer-txt { font-family: 'Bebas Neue', sans-serif; font-size: 22px; color: #e8f0ff; margin-bottom: 6px; }

/* JUGADOR */
.sil-wrap { display: flex; flex-direction: column; align-items: center; margin-bottom: 16px; }
.sil { font-size: 80px; filter: brightness(0) invert(0.15); }
.pista-gen { background: #0a1020; border: 1px solid #1a2a45; border-radius: 8px; padding: 10px 16px; font-size: 13px; color: #7a9abf; margin-bottom: 14px; text-align: center; }
.pistas { display: flex; flex-direction: column; gap: 8px; margin-bottom: 18px; }
.pista { background: #05080f; border-left: 3px solid #1a6b3a; border-radius: 6px; padding: 10px 14px; font-size: 13px; color: #b0c8e8; animation: fadeIn 0.3s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: none; } }
.pista-num { font-size: 10px; color: #4a6080; margin-bottom: 2px; text-transform: uppercase; letter-spacing: 1px; }
.tries-dots { display: flex; gap: 6px; margin-bottom: 14px; align-items: center; }
.dot { width: 12px; height: 12px; border-radius: 50%; background: #1a2a45; border: 1px solid #2d5a35; }
.dot.used { background: #e74c3c; border-color: #e74c3c; }
.dot.won { background: #4a9eff; border-color: #4a9eff; }

/* COMBINA */
.comb-reto { background: #05080f; border: 2px solid #a8ff3e44; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 18px; }
.comb-reto-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #4a6080; margin-bottom: 8px; }
.comb-reto-txt { font-family: 'Bebas Neue', sans-serif; font-size: 32px; color: #4a9eff; letter-spacing: 1px; }
.comb-pts-row { display: flex; justify-content: center; gap: 24px; margin-bottom: 18px; }
.comb-stat { text-align: center; }
.comb-val { font-family: 'Bebas Neue', sans-serif; font-size: 32px; }
.comb-lbl { font-size: 11px; color: #4a6080; }
.float-anim { animation: floatUp 0.6s ease forwards; position: fixed; pointer-events: none; font-family: 'Bebas Neue', sans-serif; font-size: 26px; z-index: 999; }
@keyframes floatUp { 0% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(-60px); } }
.btn-salto { background: #2a101044; color: #e74c3c; border: 1px solid #e74c3c44; border-radius: 8px; padding: 10px 16px; font-size: 14px; cursor: pointer; font-family: 'Inter', sans-serif; font-weight: 600; }
.comb-history { display: flex; flex-direction: column; gap: 5px; margin-bottom: 14px; max-height: 150px; overflow-y: auto; }
.ch-row { padding: 7px 12px; border-radius: 6px; font-size: 13px; display: flex; justify-content: space-between; }
.ch-ok { background: #1a2a4a44; color: #4a9eff; }
.ch-ko { background: #2a101044; color: #e74c3c; }

/* RANKING */
.rank-tabs { display: flex; border-radius: 8px; overflow: hidden; border: 1px solid #1a2a45; margin-bottom: 18px; }
.rank-tab { flex: 1; background: none; border: none; color: #4a6080; padding: 10px; font-size: 13px; cursor: pointer; font-family: 'Inter', sans-serif; font-weight: 600; text-transform: uppercase; }
.rank-tab.on { background: #1a3a6b; color: #e8f0ff; }
.rank-row { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 10px; margin-bottom: 8px; background: #05080f; border: 1px solid #1a2a4522; cursor: pointer; transition: all 0.15s; }
.rank-row:hover { background: #0d1525; }
.rank-row.top3 { border-color: #f5c51833; }
.rank-row.me { border-color: #4a9eff44; background: #4a9eff08; }
.rank-pos { font-family: 'Bebas Neue', sans-serif; font-size: 22px; width: 30px; text-align: center; }
.pos-1 { color: #f5c518; } .pos-2 { color: #c0c0c0; } .pos-3 { color: #cd7f32; }
.rank-name { flex: 1; font-size: 14px; font-weight: 500; }
.rank-pts { font-family: 'Bebas Neue', sans-serif; font-size: 20px; color: #4a9eff; }
.rank-prize { font-size: 11px; color: #f5c518; }
.desglose { background: #0a1020; border: 1px solid #1a2a45; border-radius: 10px; padding: 16px; margin-top: 4px; margin-bottom: 10px; }
.des-row { display: flex; justify-content: space-between; font-size: 13px; padding: 6px 0; border-bottom: 1px solid #1a2a4533; }
.des-row:last-child { border-bottom: none; }
.des-lbl { color: #4a6080; }
.des-val { font-family: 'Bebas Neue', sans-serif; font-size: 16px; color: #e8f0ff; }

/* INICIO */
.home-hero { background: linear-gradient(135deg, #05080f, #0a1020); border: 1px solid #1a2a45; border-radius: 16px; padding: 28px; margin-bottom: 18px; text-align: center; }
.home-pts { font-family: 'Bebas Neue', sans-serif; font-size: 64px; color: #4a9eff; line-height: 1; text-shadow: 0 0 30px #a8ff3e44; }
.home-pts-lbl { font-size: 13px; color: #4a6080; margin-top: 4px; }
.mode-list { display: flex; flex-direction: column; gap: 10px; }
.mode-item { background: #0a1020; border: 1px solid #1a2a45; border-radius: 12px; padding: 16px 18px; display: flex; align-items: center; gap: 14px; cursor: pointer; transition: all 0.15s; }
.mode-item:hover { border-color: #4a9eff44; background: #0d1525; }
.mode-icon { font-size: 30px; }
.mode-name { font-family: 'Bebas Neue', sans-serif; font-size: 18px; color: #e8f0ff; }
.mode-desc { font-size: 12px; color: #4a6080; margin-top: 2px; }
.mode-pts { font-family: 'Bebas Neue', sans-serif; font-size: 18px; color: #4a9eff; margin-left: auto; }
.mode-done { font-size: 20px; margin-left: auto; }

/* PRÓXIMAMENTE */
.prox-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; text-align: center; }
.prox-icon { font-size: 72px; margin-bottom: 20px; }
.prox-title { font-family: 'Bebas Neue', sans-serif; font-size: 28px; color: #4a9eff; letter-spacing: 2px; margin-bottom: 10px; }
.prox-text { font-size: 15px; color: #4a6080; line-height: 1.6; }

.alert { border-radius: 8px; padding: 10px 14px; font-size: 13px; margin-bottom: 12px; }
.alert-ok  { background: #1a2a4a44; border: 1px solid #22a05044; color: #4a9eff; }
.alert-ko  { background: #2a101044; border: 1px solid #e74c3c44; color: #e74c3c; }
.alert-inf { background: #1a2a4a44; border: 1px solid #4a7aaf44; color: #88b8e8; }
.divider { border: none; border-top: 1px solid #1a2a45; margin: 18px 0; }
.dia-badge { font-size: 11px; background: #1a2a45; color: #4a6080; border-radius: 4px; padding: 2px 8px; margin-left: 8px; }

@media (max-width: 480px) {
  .result-grid3 { grid-template-columns: 1fr 1fr; }
  .q-text { font-size: 20px; }
  .home-pts { font-size: 48px; }
  .main { padding: 14px 12px; }
}
`;

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function nivelLabel(n) {
  return { facil: "Fácil", medio: "Medio", dificil: "Difícil", muyDificil: "Muy Difícil" }[n] || n;
}

// ─── INTRO MODAL ──────────────────────────────────────────────────────────────
function IntroModal({ icon, title, text, onStart }) {
  return (
    <div className="overlay">
      <div className="intro-box">
        <div className="intro-icon">{icon}</div>
        <div className="intro-title">{title}</div>
        <div className="intro-text">{text}</div>
        <button className="btn-green" onClick={onStart}>¡EMPEZAR!</button>
      </div>
    </div>
  );
}

// ─── COUNTDOWN ────────────────────────────────────────────────────────────────
function Countdown({ onDone }) {
  const [n, setN] = useState(3);
  useEffect(() => {
    if (n === 0) { onDone(); return; }
    const t = setTimeout(() => setN(v => v - 1), 1000);
    return () => clearTimeout(t);
  }, [n]);
  return <div className="countdown">{n === 0 ? "¡YA!" : n}</div>;
}

// ─── FINISH OVERLAY ──────────────────────────────────────────────────────────
function FinishOverlay({ icon, juego, pts, ptsBreakdown, scores, onContinue }) {
  const total = Object.values(scores).reduce((a, b) => a + b, 0) + pts;
  return (
    <div className="overlay">
      <div className="intro-box" style={{ maxWidth: 360 }}>
        <div style={{ fontSize: 48, marginBottom: 10 }}>{icon}</div>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: "#4a6080", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" }}>{juego} · Resultado</div>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 90, color: "#4a9eff", lineHeight: 1, textShadow: "0 0 30px #4a9eff55", marginBottom: 4 }}>{pts}</div>
        <div style={{ fontSize: 13, color: "#4a6080", marginBottom: 20 }}>puntos conseguidos</div>
        {ptsBreakdown && (
          <div style={{ background: "#05080f", border: "1px solid #1a2a45", borderRadius: 10, padding: "12px 16px", marginBottom: 16, width: "100%" }}>
            {ptsBreakdown}
          </div>
        )}
        <div style={{ background: "#05080f", border: "1px solid #f5c51833", borderRadius: 10, padding: "12px 16px", marginBottom: 20, width: "100%" }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "#4a6080", marginBottom: 10 }}>Tu acumulado de hoy</div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6 }}>
            <span style={{ color: "#7a9abf" }}>Este juego</span>
            <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: "#4a9eff" }}>{pts} pts</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
            <span style={{ color: "#7a9abf" }}>Total ranking hoy</span>
            <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: "#f5c518" }}>{total} pts</span>
          </div>
        </div>
        <button className="btn-green" style={{ width: "100%", background: "#1a3a6b" }} onClick={onContinue}>VER RANKING →</button>
      </div>
    </div>
  );
}

// ─── RESULT OVERLAY (puntuación + ranking acumulado) ─────────────────────────
function ResultOverlay({ pts, juego, scores, onVerRanking, onClose, extras }) {
  const totalDiario = Object.values(scores).reduce((a, b) => a + b, 0) + pts;
  return (
    <div className="overlay">
      <div className="intro-box">
        <div style={{ fontSize: 13, color: "#6b8f71", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>{juego}</div>
        <div className="result-overlay-pts">{pts}</div>
        <div className="result-overlay-lbl">puntos conseguidos</div>
        {extras}
        <div className="rank-summary">
          <div className="rank-summary-title">Tu acumulado de hoy</div>
          <div className="rank-summary-row"><span style={{ color: "#9ab09e" }}>Puntos totales hoy</span><span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: "#a8ff3e" }}>{totalDiario}</span></div>
          <div className="rank-summary-row"><span style={{ color: "#9ab09e" }}>Posición estimada</span><span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: "#f5c518" }}>#4</span></div>
        </div>
        <div className="result-overlay-btns">
          <button className="btn-green" onClick={onVerRanking}>VER RANKING</button>
          {onClose && <button className="btn-sub" onClick={onClose} style={{ marginTop: 8 }}>Volver al inicio</button>}
        </div>
      </div>
    </div>
  );
}

// ─── PRÓXIMAMENTE (modo mantenimiento) ───────────────────────────────────────
function Proximamente({ icon, nombre }) {
  return (
    <div className="card">
      <div className="prox-wrap">
        <div className="prox-icon">{icon}</div>
        <div className="prox-title">{nombre}</div>
        <div style={{ background: "#0a1020", border: "1px solid #1a2a45", borderRadius: 12, padding: "20px 24px", margin: "16px 0", textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🔧</div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: "#4a9eff", letterSpacing: 1, marginBottom: 8 }}>ESTAMOS PREPARANDO EL JUEGO</div>
          <div style={{ fontSize: 14, color: "#7a9abf", lineHeight: 1.7 }}>Estamos trabajando para ofrecerte la mejor experiencia.<br />Vuelve pronto, ¡no te lo pierdas!</div>
        </div>
        <div style={{ fontSize: 12, color: "#4a6080", textAlign: "center" }}>
          Síguenos para estar al tanto del lanzamiento 🚀
        </div>
      </div>
    </div>
  );
}


function TestDiario({ onFinish, done, scores, preguntas }) {
  const [phase, setPhase] = useState("intro");
  const [idx, setIdx] = useState(0);
  const [sel, setSel] = useState(null);
  const [baseScore, setBaseScore] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [racha, setRacha] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [testStartTime, setTestStartTime] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [finalPts, setFinalPts] = useState(0);
  const [showOverlay, setShowOverlay] = useState(false);
  const questions = useRef(preguntas);

  const q = questions.current[idx];

  const finishTest = (answersArr, base, started) => {
    const allCorrect = answersArr.length === 10 && answersArr.every(a => a.correct);
    const totalSeconds = Math.round((Date.now() - started) / 1000);
    const bonus = allCorrect ? timeBonus(totalSeconds) : 0;
    const total = base + bonus;
    setFinalPts(total);
    setShowOverlay(true);
  };

  const handleAnswer = (i) => {
    if (sel !== null) return;
    const correct = i === q.ans;
    const pts = correct ? q.pts : 0;
    setSel(i);
    const newBase = baseScore + pts;
    setBaseScore(newBase);
    setRacha(r => correct ? r + 1 : 0);
    const newAnswers = [...answers, { q: q.q, sel: i, ans: q.ans, opts: q.opts, correct, pts }];
    setAnswers(newAnswers);
    setTimeout(() => {
      if (idx + 1 >= questions.current.length) {
        finishTest(newAnswers, newBase, testStartTime);
      } else {
        setIdx(i2 => i2 + 1);
        setSel(null);
      }
    }, 900);
  };

  const handleRendirse = () => {
    finishTest(answers, baseScore, testStartTime);
  };

  const totalSeconds = testStartTime ? Math.round((Date.now() - testStartTime) / 1000) : 0;
  const bonus = timeBonus(totalSeconds);

  if (!preguntas || preguntas.length < 10) return (
    <div className="card">
      <div className="card-title">✔ TEST DIARIO</div>
      <div className="alert alert-inf">⚠️ Aún no hay suficientes preguntas cargadas para hoy. Vuelve más tarde.</div>
    </div>
  );

  if (done) return (
    <div className="card">
      <div className="card-title">✔ TEST DIARIO</div>
      <div className="alert alert-ok">✅ Ya completaste el test de hoy. ¡Vuelve mañana!</div>
    </div>
  );

  if (phase === "intro") return (
    <IntroModal icon="✔" title="TEST DIARIO"
      text="Contesta 10 preguntas con 4 opciones lo más rápido posible. El nivel aumenta en cada bloque. ¡Más velocidad, más puntos extra!"
      onStart={() => setPhase("countdown")} />
  );

  if (phase === "countdown") return (
    <div className="card" style={{ textAlign: "center" }}>
      <Countdown onDone={() => { setPhase("playing"); setTestStartTime(Date.now()); setStartTime(Date.now()); }} />
    </div>
  );

  if (showOverlay) return (
    <FinishOverlay icon="✔" juego="Test Diario" pts={finalPts} scores={scores}
      ptsBreakdown={
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
            <span style={{ color: "#7a9abf" }}>Puntos base</span>
            <span style={{ color: "#e8f0ff" }}>{baseScore} pts</span>
          </div>
          {finalPts > baseScore && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "#7a9abf" }}>Bonus tiempo (¡10/10!)</span>
              <span style={{ color: "#f5c518" }}>+{finalPts - baseScore} pts</span>
            </div>
          )}
          {finalPts === baseScore && (
            <div style={{ fontSize: 12, color: "#4a6080", marginTop: 4 }}>
              Bonus tiempo solo si aciertas las 10
            </div>
          )}
        </div>
      }
      onContinue={() => { setShowOverlay(false); setShowResult(true); onFinish && onFinish(finalPts); }} />
  );

  if (showResult) return (
    <div className="card">
      <div className="card-title">🏁 RESULTADO FINAL</div>
      <div className="result-pts-big">{finalPts}</div>
      <div className="result-sub">
        {answers.filter(a => a.correct).length === 10
          ? `Base: 600 pts + Bonus tiempo: +${finalPts - 600} pts`
          : `${answers.filter(a => a.correct).length}/10 correctas · Sin bonus de tiempo`}
      </div>
      <div className="result-grid3">
        <div className="rs"><div className="rs-val">{answers.filter(a => a.correct).length}/10</div><div className="rs-lbl">Correctas</div></div>
        <div className="rs"><div className="rs-val">{baseScore}</div><div className="rs-lbl">Pts base</div></div>
        <div className="rs"><div className="rs-val">+{finalPts - baseScore}</div><div className="rs-lbl">Bonus</div></div>
      </div>
      <div className="rank-summary">
        <div className="rank-summary-title">Acumulado ranking de hoy</div>
        <div className="rank-summary-row"><span style={{ color: "#7a9abf" }}>✔ Test Diario</span><span style={{ color: "#4a9eff", fontFamily: "'Bebas Neue',sans-serif", fontSize: 16 }}>{finalPts} pts</span></div>
        <div className="rank-summary-row"><span style={{ color: "#7a9abf" }}>Total acumulado hoy</span><span style={{ color: "#f5c518", fontFamily: "'Bebas Neue',sans-serif", fontSize: 16 }}>{Object.values(scores).reduce((a,b)=>a+b,0) + finalPts} pts</span></div>
      </div>
      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: "#4a6080", letterSpacing: 1, marginBottom: 10 }}>REVISIÓN DE RESPUESTAS</div>
      <div className="answer-review">
        {answers.map((a, i) => (
          <div key={i} className={`ar ${a.correct ? "ar-ok" : "ar-ko"}`}>
            <span>{a.correct ? "✔" : "❌"}</span>
            <span><strong>{a.q}</strong><br />Correcta: {a.opts[a.ans]}{!a.correct && ` · Tu respuesta: ${a.opts[a.sel] || "—"}`}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="card">
      <div className="score-row">
        <div className="score-live">⚡ {baseScore} pts</div>
        <button className="btn-rojo" onClick={handleRendirse}>ME RINDO</button>
      </div>
      <div className="progress-row">
        {questions.current.map((_, i) => (
          <div key={i} className={`progress-dot ${i < idx ? "done" : i === idx ? "current" : ""}`} />
        ))}
      </div>
      {racha >= 2 && <div className="racha-badge">🔥 Racha x{racha}</div>}
      <div className={`nivel-badge nivel-${q.nivel}`}>{nivelLabel(q.nivel)} · {q.pts} pts</div>
      <div className="q-num">Pregunta {idx + 1} de {questions.current.length}</div>
      <div className="q-text">{q.q}</div>
      <div className="opts">
        {q.opts.map((o, i) => {
          let cls = "opt";
          if (sel !== null) { if (i === q.ans) cls += " ok"; else if (i === sel) cls += " ko"; }
          return (
            <button key={i} className={cls} disabled={sel !== null} onClick={() => handleAnswer(i)}>
              <span className="opt-letra">{["A","B","C","D"][i]}</span> {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── JUEGO 2: ALINEACIÓN ─────────────────────────────────────────────────────
function AdivinaAlineacion({ onFinish, done, scores, partido: ALINEACION }) {
  const [phase, setPhase] = useState("intro");
  const [timeLeft, setTimeLeft] = useState(120);
  const [found, setFound] = useState([]);
  const [wrong, setWrong] = useState([]);
  const [guess, setGuess] = useState("");
  const [msg, setMsg] = useState(null);
  const [finished, setFinished] = useState(false);
  const [finalPts, setFinalPts] = useState(0);
  const [showOverlay, setShowOverlay] = useState(false);
  const timerRef = useRef(null);

  const calcPts = (f) => {
    if (f.length === 11) return 200;
    if (f.length >= 5)   return 150;
    if (f.length >= 2)   return 50;
    if (f.length === 1)  return 25;
    return 0;
  };

  const endGame = (foundList) => {
    clearInterval(timerRef.current);
    const f = foundList !== undefined ? foundList : found;
    const pts = calcPts(f);
    setFinalPts(pts);
    setFinished(true);
    setShowOverlay(true);
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); endGame(); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  const handleGuess = () => {
    const g = guess.trim().toLowerCase();
    if (!g || finished) return;
    const match = ALINEACION.jugadores.find(j =>
      j.nombre.toLowerCase().includes(g) && !found.find(f => f.nombre === j.nombre)
    );
    if (match) {
      const newFound = [...found, match];
      setFound(newFound);
      setMsg({ type: "ok", text: `✔ ¡${match.nombre}!` });
      if (newFound.length === 11) endGame(newFound);
    } else {
      setWrong(w => [...w, guess.trim()]);
      setMsg({ type: "ko", text: `❌ No está en la alineación` });
    }
    setGuess("");
    setTimeout(() => setMsg(null), 1500);
  };

  if (!ALINEACION) return (
    <div className="card">
      <div className="card-title">🏟 ADIVINA LA ALINEACIÓN</div>
      <div className="alert alert-inf">⚠️ Aún no hay alineación cargada para hoy. Vuelve más tarde.</div>
    </div>
  );

  const pct = (timeLeft / 120) * 100;
  const barCls = pct > 50 ? "" : pct > 25 ? " warn" : " danger";
  const lineas = [
    [ALINEACION.jugadores[0]],
    ALINEACION.jugadores.slice(1, 5),
    ALINEACION.jugadores.slice(5, 8),
    ALINEACION.jugadores.slice(8, 11),
  ];

  if (done) return (
    <div className="card">
      <div className="card-title">🏟 ADIVINA LA ALINEACIÓN</div>
      <div className="alert alert-ok">✅ Ya jugaste la alineación de hoy. ¡Vuelve mañana!</div>
    </div>
  );

  if (phase === "intro") return (
    <IntroModal icon="🏟" title="ADIVINA LA ALINEACIÓN"
      text="¡Pon a prueba tus conocimientos de partidos y equipos y conquista los 200 puntos! Tienes 2 minutos para adivinar los 11 jugadores."
      onStart={() => setPhase("countdown")} />
  );

  if (phase === "countdown") return (
    <div className="card" style={{ textAlign: "center" }}>
      <Countdown onDone={() => { setPhase("playing"); startTimer(); }} />
    </div>
  );

  if (showOverlay) return (
    <FinishOverlay icon="🏟" juego="Adivina la Alineación" pts={finalPts} scores={scores}
      ptsBreakdown={
        <div style={{ fontSize: 13, color: "#7a9abf" }}>
          {found.length === 11 ? "¡Alineación completa! 200 pts" :
           found.length >= 5  ? `${found.length}/11 jugadores · 150 pts` :
           found.length >= 2  ? `${found.length}/11 jugadores · 50 pts` :
           found.length === 1 ? "1/11 jugadores · 25 pts" : "0 jugadores · 0 pts"}
        </div>
      }
      onContinue={() => { setShowOverlay(false); onFinish && onFinish(finalPts); }} />
  );

  if (finished) return (
    <div className="card">
      <div className="card-title">🏟 RESULTADO</div>
      <div className="result-pts-big">{finalPts}</div>
      <div className="result-sub">
        {found.length === 11 ? "¡Alineación completa! 🎉" :
         found.length >= 5  ? `${found.length} jugadores — 150 pts` :
         found.length >= 2  ? `${found.length} jugadores — 50 pts` :
         found.length === 1 ? "1 jugador — 25 pts" : "0 jugadores — sin puntos"}
      </div>
      <div className="result-grid3" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="rs"><div className="rs-val">{found.length}/11</div><div className="rs-lbl">Encontrados</div></div>
        <div className="rs"><div className="rs-val">{wrong.length}</div><div className="rs-lbl">Fallos</div></div>
      </div>
      <div className="rank-summary">
        <div className="rank-summary-title">Acumulado ranking de hoy</div>
        <div className="rank-summary-row"><span style={{ color: "#7a9abf" }}>🏟 Alineación</span><span style={{ color: "#4a9eff", fontFamily: "'Bebas Neue',sans-serif", fontSize: 16 }}>{finalPts} pts</span></div>
        <div className="rank-summary-row"><span style={{ color: "#7a9abf" }}>Total acumulado hoy</span><span style={{ color: "#f5c518", fontFamily: "'Bebas Neue',sans-serif", fontSize: 16 }}>{Object.values(scores).reduce((a,b)=>a+b,0) + finalPts} pts</span></div>
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: "#4a6080", marginBottom: 8 }}>Alineación completa:</div>
        <div className="tags">{ALINEACION.jugadores.map((j, i) => (
          <span key={i} className={found.find(f => f.nombre === j.nombre) ? "tag-ok" : "tag-ko"}>{j.nombre}</span>
        ))}</div>
      </div>
    </div>
  );

  return (
    <div className="card">
      <div className="ali-info">
        <div className="ali-form">{ALINEACION.formacion}</div>
        <div className="ali-partido">
          <strong>{ALINEACION.equipo}</strong> vs {ALINEACION.rival}<br />
          {ALINEACION.competicion} · {ALINEACION.temporada}
        </div>
      </div>
      <div className="timer-txt">{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}</div>
      <div className="timer-bar-wrap"><div className={`timer-bar${barCls}`} style={{ width: `${pct}%` }} /></div>
      {msg && <div className={`alert alert-${msg.type === "ok" ? "ok" : "ko"}`}>{msg.text}</div>}
      <div className="campo">
        {lineas.map((linea, li) => (
          <div key={li} className="campo-row">
            {linea.map((j, ji) => {
              const isFound = found.find(f => f.nombre === j.nombre);
              return (
                <div key={ji} className="camp-player">
                  <div className={`camp-circle ${isFound ? "found" : ""}`}>{isFound ? "⚽" : "👤"}</div>
                  <div className={`camp-name ${isFound ? "found" : ""}`}>{isFound ? j.nombre : j.pos}</div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 12, color: "#6b8f71", marginBottom: 10 }}>{found.length}/11 encontrados · {calcPts(found)} pts actuales</div>
      <div className="guess-row">
        <input className="guess-inp" placeholder="Apellido del jugador..." value={guess}
          onChange={e => setGuess(e.target.value)} onKeyDown={e => e.key === "Enter" && handleGuess()} />
        <button className="btn-send" onClick={handleGuess}>Enviar</button>
        <button className="btn-rojo" onClick={() => endGame()}>ME RINDO</button>
      </div>
      {wrong.length > 0 && <div className="tags">{wrong.map((w, i) => <span key={i} className="tag-ko">{w}</span>)}</div>}
      {found.length > 0 && <div className="tags">{found.map((f, i) => <span key={i} className="tag-ok">{f.nombre}</span>)}</div>}
    </div>
  );
}

// ─── JUEGO 3: ADIVINA EL JUGADOR ─────────────────────────────────────────────
function AdivinaJugador({ onFinish, done, scores, jugador: JUGADOR }) {
  const [phase, setPhase] = useState("intro");
  const [pistasShown, setPistasShown] = useState(1);
  const [guess, setGuess] = useState("");
  const [tries, setTries] = useState([]);
  const [finished, setFinished] = useState(false);
  const [won, setWon] = useState(false);
  const [lastChance, setLastChance] = useState(false);
  const [finalPts, setFinalPts] = useState(0);
  const PTS = [300, 200, 150, 100, 50];

  const [showOverlay, setShowOverlay] = useState(false);

  const finishJugador = (pts, didWin) => {
    setFinalPts(pts);
    setFinished(true);
    setWon(didWin);
    setShowOverlay(true);
    onFinish && onFinish(pts);
  };

  const handleGuess = () => {
    const g = guess.trim().toLowerCase();
    if (!g || finished) return;
    const correct = JUGADOR.nombre.toLowerCase().split(" ").some(p => g.includes(p)) ||
      g.includes(JUGADOR.nombre.toLowerCase());
    const newTries = [...tries, { texto: guess.trim(), correct }];
    setTries(newTries);
    setGuess("");

    if (correct) {
      const pts = lastChance ? 25 : PTS[Math.min(pistasShown - 1, 4)];
      finishJugador(pts, true);
    } else if (lastChance) {
      finishJugador(0, false);
    } else if (pistasShown >= 5) {
      setLastChance(true);
    } else {
      setPistasShown(p => p + 1);
    }
  };

  if (showOverlay) return (
    <FinishOverlay icon="⚽" juego="Adivina el Jugador" pts={finalPts} scores={scores}
      ptsBreakdown={
        <div style={{ fontSize: 13, color: "#7a9abf" }}>
          {won ? `¡Adivinado en pista ${pistasShown}! · ${finalPts} pts` : `No adivinado · 0 pts`}
        </div>
      }
      onContinue={() => setShowOverlay(false)} />
  );

  if (!JUGADOR) return (
    <div className="card">
      <div className="card-title">⚽ ADIVINA EL JUGADOR</div>
      <div className="alert alert-inf">⚠️ Aún no hay jugador cargado para hoy. Vuelve más tarde.</div>
    </div>
  );

  if (done) return (
    <div className="card">
      <div className="card-title">⚽ ADIVINA EL JUGADOR</div>
      <div className="alert alert-ok">✅ Ya jugaste el jugador de hoy. ¡Vuelve mañana!</div>
    </div>
  );

  if (phase === "intro") return (
    <IntroModal icon="⚽" title="ADIVINA EL JUGADOR"
      text="¡Adivina el jugador que se esconde detrás de la silueta y llévate 300 puntos! Cuantas menos pistas uses, más puntos ganas."
      onStart={() => setPhase("playing")} />
  );

  if (finished) return (
    <div className="card">
      <div className="card-title">⚽ RESULTADO</div>
      <div className="result-pts-big">{finalPts}</div>
      <div className="result-sub">{won ? `¡Era ${JUGADOR.nombre}! 🎉` : `Era ${JUGADOR.nombre}. ¡Suerte la próxima!`}</div>
      <div className="result-grid3" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="rs"><div className="rs-val">{pistasShown}</div><div className="rs-lbl">Pistas usadas</div></div>
        <div className="rs"><div className="rs-val">{tries.length}</div><div className="rs-lbl">Intentos</div></div>
      </div>
      <div className="rank-summary">
        <div className="rank-summary-title">Acumulado ranking de hoy</div>
        <div className="rank-summary-row"><span style={{ color: "#9ab09e" }}>⚽ Jugador</span><span style={{ color: "#a8ff3e", fontFamily: "'Bebas Neue',sans-serif", fontSize: 16 }}>{finalPts} pts</span></div>
        <div className="rank-summary-row"><span style={{ color: "#9ab09e" }}>Total acumulado hoy</span><span style={{ color: "#f5c518", fontFamily: "'Bebas Neue',sans-serif", fontSize: 16 }}>{Object.values(scores).reduce((a,b)=>a+b,0) + finalPts} pts</span></div>
      </div>
    </div>
  );

  const currentPts = lastChance ? 25 : PTS[Math.min(pistasShown - 1, 4)];

  return (
    <div className="card">
      <div className="card-title">⚽ ADIVINA EL JUGADOR</div>
      <div className="sil-wrap"><div className="sil">🧍</div></div>
      <div className="pista-gen">🌟 {JUGADOR.pistaGeneral}</div>
      <div className="tries-dots">
        {[0,1,2,3,4].map(i => (
          <div key={i} className={`dot ${i < tries.length ? (tries[i]?.correct ? "won" : "used") : ""}`} />
        ))}
        <span style={{ fontSize: 12, color: "#6b8f71", marginLeft: 6 }}>{tries.length}/5 intentos · {currentPts} pts si aciertas</span>
      </div>
      <div className="pistas">
        {JUGADOR.pistas.slice(0, pistasShown).map((p, i) => (
          <div key={i} className="pista">
            <div className="pista-num">Pista {i+1} · {PTS[i]} pts</div>
            {p}
          </div>
        ))}
      </div>
      {lastChance && <div className="alert alert-inf">⚠️ Último intento — 25 puntos si aciertas ahora</div>}
      <div className="guess-row">
        <input className="guess-inp" placeholder="Nombre del jugador..." value={guess}
          onChange={e => setGuess(e.target.value)} onKeyDown={e => e.key === "Enter" && handleGuess()} />
        <button className="btn-send" onClick={handleGuess}>Adivinar</button>
        <button className="btn-rojo" onClick={() => finishJugador(0, false)}>ME RINDO</button>
      </div>
      {tries.length > 0 && (
        <div className="tags">{tries.map((t, i) => <span key={i} className={t.correct ? "tag-ok" : "tag-ko"}>{t.texto}</span>)}</div>
      )}
    </div>
  );
}

// ─── JUEGO 4: COMBINA ────────────────────────────────────────────────────────
function Combina({ onFinish, done, scores, combinas: COMBINAS }) {
  const [phase, setPhase] = useState("intro");
  const [timeLeft, setTimeLeft] = useState(120);
  const [combIdx, setCombIdx] = useState(0);
  const [guess, setGuess] = useState("");
  const [aciertos, setAciertos] = useState(0);
  const [saltos, setSaltos] = useState(0);
  const [history, setHistory] = useState([]);
  const [finished, setFinished] = useState(false);
  const [finalPts, setFinalPts] = useState(0);
  const [floats, setFloats] = useState([]);
  const [showOverlay, setShowOverlay] = useState(false);
  const timerRef = useRef(null);

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); endGame(true); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  const addFloat = (txt, color) => {
    const id = Date.now();
    setFloats(f => [...f, { id, txt, color }]);
    setTimeout(() => setFloats(f => f.filter(fl => fl.id !== id)), 700);
  };

  const endGame = (fromTimer = false) => {
    clearInterval(timerRef.current);
    setFinished(true);
  };

  useEffect(() => {
    if (finished) {
      const pts = Math.max(0, Math.min(aciertos, 20) * 20 - saltos * 10);
      setFinalPts(pts);
      setShowOverlay(true);
      onFinish && onFinish(pts);
    }
  }, [finished]);

  const handleGuess = () => {
    const g = guess.trim().toLowerCase();
    if (!g || finished) return;
    const comb = COMBINAS[combIdx % COMBINAS.length];
    const ok = comb.validar(g);
    setHistory(h => [...h, { desc: comb.desc, respuesta: guess.trim(), ok }]);
    setGuess("");
    addFloat(ok ? "+20" : "❌", ok ? "#a8ff3e" : "#e74c3c");
    if (ok) { setAciertos(a => a + 1); setCombIdx(i => i + 1); }
  };

  const handleSalto = () => {
    const comb = COMBINAS[combIdx % COMBINAS.length];
    setHistory(h => [...h, { desc: comb.desc, respuesta: "SALTO", ok: false, salto: true }]);
    setSaltos(s => s + 1);
    setCombIdx(i => i + 1);
    addFloat("-10", "#e74c3c");
  };

  const pct = (timeLeft / 120) * 100;
  const ptsActuales = Math.max(0, Math.min(aciertos, 20) * 20 - saltos * 10);

  if (showOverlay) return (
    <FinishOverlay icon="🔍" juego="Combina" pts={finalPts} scores={scores}
      ptsBreakdown={
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
            <span style={{ color: "#7a9abf" }}>{aciertos} aciertos × 20</span>
            <span style={{ color: "#e8f0ff" }}>+{Math.min(aciertos,20)*20} pts</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: "#7a9abf" }}>{saltos} saltos × 10</span>
            <span style={{ color: "#e74c3c" }}>-{saltos*10} pts</span>
          </div>
        </div>
      }
      onContinue={() => setShowOverlay(false)} />
  );

  if (!COMBINAS || COMBINAS.length === 0) return (
    <div className="card">
      <div className="card-title">🔍 COMBINA</div>
      <div className="alert alert-inf">⚠️ Aún no hay combinaciones cargadas para hoy. Vuelve más tarde.</div>
    </div>
  );

  if (done) return (
    <div className="card">
      <div className="card-title">🔍 COMBINA</div>
      <div className="alert alert-ok">✅ Ya jugaste el Combina de hoy. ¡Vuelve mañana!</div>
    </div>
  );

  if (phase === "intro") return (
    <IntroModal icon="🔍" title="COMBINA"
      text="¡Tienes 2 minutos para combinar el máximo de jugadores posibles y llevarte 400 puntos! Cada acierto suma +20, cada salto resta -10."
      onStart={() => setPhase("countdown")} />
  );

  if (phase === "countdown") return (
    <div className="card" style={{ textAlign: "center" }}>
      <Countdown onDone={() => { setPhase("playing"); startTimer(); }} />
    </div>
  );

  if (finished) return (
    <div className="card">
      <div className="card-title">🔍 RESULTADO</div>
      <div className="result-pts-big">{finalPts}</div>
      <div className="result-sub">{aciertos} aciertos · {saltos} saltos</div>
      <div className="result-grid3">
        <div className="rs"><div className="rs-val" style={{ color: "#a8ff3e" }}>{aciertos}</div><div className="rs-lbl">Aciertos</div></div>
        <div className="rs"><div className="rs-val" style={{ color: "#e74c3c" }}>{saltos}</div><div className="rs-lbl">Saltos</div></div>
        <div className="rs"><div className="rs-val">{aciertos + saltos}</div><div className="rs-lbl">Total retos</div></div>
      </div>
      <div className="rank-summary">
        <div className="rank-summary-title">Acumulado ranking de hoy</div>
        <div className="rank-summary-row"><span style={{ color: "#9ab09e" }}>🔍 Combina</span><span style={{ color: "#a8ff3e", fontFamily: "'Bebas Neue',sans-serif", fontSize: 16 }}>{finalPts} pts</span></div>
        <div className="rank-summary-row"><span style={{ color: "#9ab09e" }}>Total acumulado hoy</span><span style={{ color: "#f5c518", fontFamily: "'Bebas Neue',sans-serif", fontSize: 16 }}>{Object.values(scores).reduce((a,b)=>a+b,0) + finalPts} pts</span></div>
      </div>
      {history.length > 0 && (
        <>
          <div style={{ fontSize: 12, color: "#6b8f71", marginBottom: 8 }}>Historial:</div>
          <div className="comb-history">
            {history.map((h, i) => (
              <div key={i} className={`ch-row ${h.ok ? "ch-ok" : "ch-ko"}`}>
                <span>{h.desc}</span>
                <span>{h.salto ? "SALTO -10" : h.ok ? `✔ ${h.respuesta} +20` : `❌ ${h.respuesta}`}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="card">
      {floats.map(f => (
        <div key={f.id} className="float-anim" style={{ color: f.color, left: "50%", top: "40%" }}>{f.txt}</div>
      ))}
      <div className="score-row">
        <div className="score-live">⚡ {ptsActuales} pts</div>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: timeLeft <= 30 ? "#e74c3c" : "#f0ede6" }}>
          {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
        </div>
      </div>
      <div className="timer-bar-wrap">
        <div className={`timer-bar${pct > 50 ? "" : pct > 25 ? " warn" : " danger"}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="comb-pts-row">
        <div className="comb-stat"><div className="comb-val" style={{ color: "#a8ff3e" }}>{aciertos}</div><div className="comb-lbl">Aciertos</div></div>
        <div className="comb-stat"><div className="comb-val" style={{ color: "#e74c3c" }}>{saltos}</div><div className="comb-lbl">Saltos</div></div>
      </div>
      <div className="comb-reto">
        <div className="comb-reto-label">Encuentra un jugador que sea:</div>
        <div className="comb-reto-txt">{COMBINAS[combIdx % COMBINAS.length].desc}</div>
      </div>
      {history.length > 0 && (
        <div className="comb-history">
          {[...history].reverse().map((h, i) => (
            <div key={i} className={`ch-row ${h.ok ? "ch-ok" : "ch-ko"}`}>
              <span>{h.desc}</span>
              <span>{h.salto ? "SALTO -10" : h.ok ? `✔ ${h.respuesta}` : `❌ ${h.respuesta}`}</span>
            </div>
          ))}
        </div>
      )}
      <div className="guess-row">
        <input className="guess-inp" placeholder="Nombre del jugador..." value={guess}
          onChange={e => setGuess(e.target.value)} onKeyDown={e => e.key === "Enter" && handleGuess()} />
        <button className="btn-send" onClick={handleGuess}>Enviar</button>
        <button className="btn-salto" onClick={handleSalto}>SALTO</button>
      </div>
      <div style={{ marginTop: 8 }}>
        <button className="btn-rojo" onClick={() => endGame()}>ME RINDO</button>
      </div>
    </div>
  );
}

// ─── JUEGO 5: GOL (PRÓXIMAMENTE) ─────────────────────────────────────────────
function AdivinaGol() {
  return (
    <div className="card">
      <div className="prox-wrap">
        <div className="prox-icon">📹</div>
        <div className="prox-title">ADIVINA EL GOL</div>
        <div className="prox-text">
          Estamos trabajando en ello.<br />Muy pronto podrás ver un gol y adivinar<br />el jugador, el equipo y el rival. ¡No te lo pierdas!
        </div>
      </div>
    </div>
  );
}

// ─── RANKING ──────────────────────────────────────────────────────────────────
function Ranking({ user, scores }) {
  const [tab, setTab] = useState("diario");
  const [expanded, setExpanded] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const hoy = new Date().getDay();
  const diaIdx = hoy === 0 ? 6 : hoy - 1;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const orderCol = tab === "diario" ? "puntos_totales" : "puntos_semana";
      const { data } = await supabase
        .from("perfiles")
        .select("*")
        .order(orderCol, { ascending: false })
        .limit(50);
      setUsuarios(data || []);
      setLoading(false);
    };
    load();
  }, [tab]);

  const myTotal = Object.values(scores).reduce((a, b) => a + b, 0);

  const allRanking = usuarios.map((u, i) => ({
    pos: i + 1,
    nombre: u.nombre,
    pts: tab === "diario" ? u.puntos_totales : u.puntos_semana,
    me: u.nombre === user.nombre,
    desglose: tab === "diario"
      ? { test: scores.test || 0, alineacion: scores.alineacion || 0, jugador: scores.jugador || 0, combina: scores.combina || 0, gol: 0 }
      : null,
  }));

  return (
    <div className="card">
      <div className="card-title">🏆 RANKING</div>
      <div className="card-sub">¿En qué posición estás hoy?</div>
      <div className="rank-tabs">
        <button className={`rank-tab ${tab === "diario" ? "on" : ""}`} onClick={() => setTab("diario")}>
          Diario <span className="dia-badge">{diaIdx + 1}/7</span>
        </button>
        <button className={`rank-tab ${tab === "semanal" ? "on" : ""}`} onClick={() => setTab("semanal")}>Semanal</button>
      </div>
      {tab === "semanal" && (
        <div className="alert alert-inf" style={{ marginBottom: 14 }}>
          🏅 El ganador semanal se lleva una <strong>camiseta a elegir</strong>
        </div>
      )}
      {loading ? (
        <div className="empty">Cargando ranking...</div>
      ) : allRanking.length === 0 ? (
        <div className="empty">Aún no hay puntuaciones registradas.</div>
      ) : (
        allRanking.map((r, i) => (
          <div key={i}>
            <div className={`rank-row ${r.pos <= 3 ? "top3" : ""} ${r.me ? "me" : ""}`}
              onClick={() => setExpanded(expanded === i ? null : i)}>
              <div className={`rank-pos ${r.pos === 1 ? "pos-1" : r.pos === 2 ? "pos-2" : r.pos === 3 ? "pos-3" : ""}`}>
                {r.pos === 1 ? "🥇" : r.pos === 2 ? "🥈" : r.pos === 3 ? "🥉" : `#${r.pos}`}
              </div>
              <div className="rank-name">{r.nombre}{r.me ? " (tú)" : ""}</div>
              <div style={{ textAlign: "right" }}>
                <div className="rank-pts">{r.pts.toLocaleString()}</div>
                {tab === "semanal" && r.pos === 1 && <div className="rank-prize">👕 Camiseta</div>}
              </div>
            </div>
            {expanded === i && tab === "diario" && (
              <div className="desglose">
                <div className="des-row"><span className="des-lbl">✔ Test Diario</span><span className="des-val">{r.desglose?.test || 0} pts</span></div>
                <div className="des-row"><span className="des-lbl">🏟 Alineación</span><span className="des-val">{r.desglose?.alineacion || 0} pts</span></div>
                <div className="des-row"><span className="des-lbl">⚽ Jugador</span><span className="des-val">{r.desglose?.jugador || 0} pts</span></div>
                <div className="des-row"><span className="des-lbl">🔍 Combina</span><span className="des-val">{r.desglose?.combina || 0} pts</span></div>
                <div className="des-row"><span className="des-lbl">📹 Gol</span><span className="des-val">{r.desglose?.gol || 0} pts</span></div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

// ─── APP ROOT ────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ email: "", password: "", nombre: "" });
  const [authErr, setAuthErr] = useState("");
  const [authMsg, setAuthMsg] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [tab, setTab] = useState("inicio");
  const [scores, setScores] = useState({ test: 0, alineacion: 0, jugador: 0, combina: 0 });
  const [done, setDone] = useState({ test: false, alineacion: false, jugador: false, combina: false });

  // Contenido cargado desde Supabase
  const [juegosActivos, setJuegosActivos] = useState({ test: false, alineacion: false, jugador: false, combina: false, gol: false });
  const [preguntasHoy, setPreguntasHoy] = useState([]);
  const [partidoHoy, setPartidoHoy] = useState(null);
  const [jugadorHoy, setJugadorHoy] = useState(null);
  const [combinasHoy, setCombinasHoy] = useState([]);
  const [loadingContent, setLoadingContent] = useState(true);

  const totalPts = Object.values(scores).reduce((a, b) => a + b, 0);

  // Carga el contenido del juego (preguntas, alineación, jugador, combinas) y qué juegos están activos
  useEffect(() => {
    const loadContent = async () => {
      setLoadingContent(true);

      const { data: ja } = await supabase.from("juegos_activos").select("*");
      if (ja) {
        const activos = {};
        ja.forEach(j => { activos[j.id] = j.activo; });
        setJuegosActivos(activos);
      }

      // 10 preguntas aleatorias: 4 fácil, 3 medio, 2 difícil, 1 muy difícil
      const { data: pr } = await supabase.from("preguntas").select("*");
      if (pr) {
        const porNivel = (n) => pr.filter(p => p.nivel === n).sort(() => Math.random() - 0.5);
        const elegidas = [
          ...porNivel("facil").slice(0, 4),
          ...porNivel("medio").slice(0, 3),
          ...porNivel("dificil").slice(0, 2),
          ...porNivel("muyDificil").slice(0, 1),
        ].map(p => ({
          q: p.texto, opts: p.opts, ans: p.ans, nivel: p.nivel,
          pts: p.nivel === "facil" ? 25 : p.nivel === "medio" ? 50 : p.nivel === "dificil" ? 100 : 150,
        }));
        setPreguntasHoy(elegidas);
      }

      // Alineación aleatoria del banco
      const { data: al } = await supabase.from("alineaciones").select("*");
      if (al && al.length > 0) {
        const elegida = al[Math.floor(Math.random() * al.length)];
        setPartidoHoy({
          equipo: elegida.equipo, rival: elegida.rival, competicion: elegida.competicion,
          temporada: elegida.temporada, formacion: elegida.formacion, jugadores: elegida.jugadores,
        });
      }

      // Jugador aleatorio del banco
      const { data: ju } = await supabase.from("jugadores_adivina").select("*");
      if (ju && ju.length > 0) {
        const elegido = ju[Math.floor(Math.random() * ju.length)];
        setJugadorHoy({
          nombre: elegido.nombre, alias: elegido.alias || [],
          pistaGeneral: elegido.pista_general, pistas: elegido.pistas,
        });
      }

      // Combinaciones del banco
      const { data: co } = await supabase.from("combinas").select("*");
      if (co) {
        setCombinasHoy(co.map(c => ({
          desc: c.descripcion,
          validar: (r) => c.validos.some(v => r.includes(v.toLowerCase())),
        })));
      }

      setLoadingContent(false);
    };
    loadContent();
  }, []);

  // Comprueba si ya hay una sesión activa al cargar la web
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          email: session.user.email,
          nombre: session.user.user_metadata?.nombre || session.user.email.split("@")[0],
        });
      }
      setCheckingSession(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          email: session.user.email,
          nombre: session.user.user_metadata?.nombre || session.user.email.split("@")[0],
        });
      } else {
        setUser(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleFinish = async (game, pts) => {
    const newScores = { ...scores, [game]: pts };
    setScores(newScores);
    setDone(d => ({ ...d, [game]: true }));

    const newTotal = Object.values(newScores).reduce((a, b) => a + b, 0);

    // Guarda el acumulado en Supabase (puntos de hoy y suma a la semana)
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: perfil } = await supabase.from("perfiles").select("*").eq("id", session.user.id).single();
      if (perfil) {
        await supabase.from("perfiles").update({
          puntos_totales: newTotal,
          puntos_semana: (perfil.puntos_semana || 0) + pts,
        }).eq("id", session.user.id);
      }
    }
  };

  const handleAuth = async () => {
    setAuthErr("");
    setAuthMsg("");
    if (!authForm.email || !authForm.password) { setAuthErr("Completa todos los campos."); return; }
    if (authMode === "register" && !authForm.nombre) { setAuthErr("Introduce un apodo."); return; }
    if (authForm.password.length < 6) { setAuthErr("La contraseña debe tener al menos 6 caracteres."); return; }

    setAuthLoading(true);

    if (authMode === "register") {
      const { data, error } = await supabase.auth.signUp({
        email: authForm.email,
        password: authForm.password,
        options: { data: { nombre: authForm.nombre } },
      });
      setAuthLoading(false);
      if (error) { setAuthErr(error.message); return; }
      setAuthMsg("¡Cuenta creada! Revisa tu email para confirmar tu cuenta antes de iniciar sesión.");
      setAuthMode("login");
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authForm.email,
        password: authForm.password,
      });
      setAuthLoading(false);
      if (error) {
        if (error.message.includes("Email not confirmed")) {
          setAuthErr("Debes confirmar tu email antes de entrar. Revisa tu correo.");
        } else if (error.message.includes("Invalid login")) {
          setAuthErr("Email o contraseña incorrectos.");
        } else {
          setAuthErr(error.message);
        }
        return;
      }
      // El listener de onAuthStateChange se encarga de meter al usuario
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (checkingSession) return (
    <div style={{ background: "#0a0a0f", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{css}</style>
      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, color: "#4a9eff", letterSpacing: 2 }}>CARGANDO...</div>
    </div>
  );

  if (!user) return (
    <div style={{ background: "#0a0a0f", minHeight: "100vh" }}>
      <style>{css}</style>
      <div className="login-wrap">
        <div className="login-box">
          <div className="login-logo">GOAL <em>WIN</em></div>
          <div className="login-tag">Pon a prueba tu conocimiento del deporte rey. Sé constante cada día para conseguir premios exclusivos cada semana.</div>
          {authErr && <div className="alert alert-ko">{authErr}</div>}
          {authMsg && <div className="alert alert-ok">{authMsg}</div>}
          {authMode === "register" && (
            <><label className="inp-lbl">Apodo</label>
            <input className="inp" placeholder="Tu nombre en el ranking"
              value={authForm.nombre} onChange={e => setAuthForm(f => ({ ...f, nombre: e.target.value }))} /></>
          )}
          <label className="inp-lbl">Email</label>
          <input className="inp" type="email" placeholder="tu@email.com"
            value={authForm.email} onChange={e => setAuthForm(f => ({ ...f, email: e.target.value }))} />
          <label className="inp-lbl">Contraseña</label>
          <input className="inp" type="password" placeholder="•••••••• (mínimo 6 caracteres)"
            value={authForm.password} onChange={e => setAuthForm(f => ({ ...f, password: e.target.value }))}
            onKeyDown={e => e.key === "Enter" && handleAuth()} />
          <button className="btn-main" onClick={handleAuth} disabled={authLoading}>
            {authLoading ? "CARGANDO..." : authMode === "login" ? "ENTRAR AL CAMPO" : "CREAR CUENTA"}
          </button>
          <button className="btn-sub" onClick={() => { setAuthMode(m => m === "login" ? "register" : "login"); setAuthErr(""); setAuthMsg(""); }}>
            {authMode === "login" ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
          </button>
        </div>
      </div>
    </div>
  );

  if (loadingContent) return (
    <div style={{ background: "#0a0a0f", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{css}</style>
      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, color: "#4a9eff", letterSpacing: 2 }}>CARGANDO CONTENIDO...</div>
    </div>
  );

  const modes = [
    { id: "test",      icon: "✔",  name: "TEST DIARIO",            desc: "10 preguntas · Nivel progresivo · Bonus tiempo", maxPts: 600 },
    { id: "alineacion",icon: "🏟", name: "ADIVINA LA ALINEACIÓN",  desc: "2 minutos para los 11 jugadores",                maxPts: 200 },
    { id: "jugador",   icon: "⚽", name: "ADIVINA EL JUGADOR",     desc: "5 pistas progresivas · Sin tiempo",              maxPts: 300 },
    { id: "combina",   icon: "🔍", name: "COMBINA",                desc: "2 minutos · Máximas combinaciones",              maxPts: 400 },
    { id: "gol",       icon: "📹", name: "ADIVINA EL GOL",         desc: "Próximamente...",                                maxPts: null },
  ];

  return (
    <div className="app">
      <style>{css}</style>
      <header className="hdr">
        <div className="hdr-logo">GOAL <span>WIN</span></div>
        <div className="hdr-right">
          <span className="hdr-user">{user.nombre}</span>
          <span className="hdr-pts">⚡ {totalPts}</span>
          <button className="btn-out" onClick={handleLogout}>Salir</button>
        </div>
      </header>
      <nav className="nav">
        {[
          ["inicio",    "🏠 INICIO"],
          ["test",      "✔ TEST"],
          ["alineacion","🏟 ALINEACIÓN"],
          ["jugador",   "⚽ JUGADOR"],
          ["combina",   "🔍 COMBINA"],
          ["gol",       "📹 GOL"],
          ["ranking",   "🏆 RANKING"],
        ].map(([id, label]) => (
          <button key={id} className={`nav-btn ${tab === id ? "on" : ""}`} onClick={() => setTab(id)}>{label}</button>
        ))}
      </nav>
      <main className="main">
        {tab === "inicio" && (
          <>
            <div className="home-hero">
              <div style={{ fontSize: 12, color: "#6b8f71", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>Puntos de hoy</div>
              <div className="home-pts">{totalPts}</div>
              <div className="home-pts-lbl">¡Juega todos los modos para sumar más!</div>
            </div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: "#6b8f71", letterSpacing: 2, marginBottom: 12 }}>MODOS DE HOY</div>
            <div className="mode-list">
              {modes.map(m => (
                <div key={m.id} className="mode-item" onClick={() => setTab(m.id)}>
                  <div className="mode-icon">{m.icon}</div>
                  <div>
                    <div className="mode-name">{m.name}</div>
                    <div className="mode-desc">{m.desc}</div>
                  </div>
                  {m.maxPts === null
                    ? <div style={{ marginLeft: "auto", fontSize: 11, color: "#6b8f71" }}>PRONTO</div>
                    : done[m.id]
                      ? <div className="mode-done">✅</div>
                      : <div className="mode-pts">+{m.maxPts}</div>
                  }
                </div>
              ))}
            </div>
          </>
        )}
        {tab === "test"       && (juegosActivos.test       ? <TestDiario       done={done.test}       scores={scores} preguntas={preguntasHoy} onFinish={(pts) => handleFinish("test", pts)} />       : <Proximamente icon="✔"  nombre="TEST DIARIO" />)}
        {tab === "alineacion" && (juegosActivos.alineacion  ? <AdivinaAlineacion done={done.alineacion} scores={scores} partido={partidoHoy} onFinish={(pts) => handleFinish("alineacion", pts)} /> : <Proximamente icon="🏟" nombre="ADIVINA LA ALINEACIÓN" />)}
        {tab === "jugador"    && (juegosActivos.jugador      ? <AdivinaJugador    done={done.jugador}    scores={scores} jugador={jugadorHoy} onFinish={(pts) => handleFinish("jugador", pts)} />    : <Proximamente icon="⚽" nombre="ADIVINA EL JUGADOR" />)}
        {tab === "combina"    && (juegosActivos.combina      ? <Combina           done={done.combina}    scores={scores} combinas={combinasHoy} onFinish={(pts) => handleFinish("combina", pts)} />    : <Proximamente icon="🔍" nombre="COMBINA" />)}
        {tab === "gol"        && <AdivinaGol />}
        {tab === "ranking"    && <Ranking user={user} scores={scores} />}
      </main>
    </div>
  );
}
