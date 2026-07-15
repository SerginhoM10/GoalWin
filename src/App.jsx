import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";

// ─── BONUS TIEMPO (Test) ────────────────────────────────────────────────────
function timeBonus(totalSeconds) {
  if (totalSeconds <= 7) return 500;
  if (totalSeconds >= 31) return 0;
  // Math.max evita que el resultado se vuelva negativo entre el segundo 28 y el 30,
  // que es lo que hacía que el bonus "no se aplicara" bien (restaba puntos en vez de sumar 0).
  return Math.max(0, 500 - (totalSeconds - 7) * 25);
}

// ─── SEMILLA DIARIA ─────────────────────────────────────────────────────────
// Genera un número pseudoaleatorio basado en la fecha del día
// Así todos los usuarios ven las mismas preguntas cada día y cambian a las 00:00h
function seedRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function getTodaySeed() {
  const hoy = new Date();
  return hoy.getFullYear() * 10000 + (hoy.getMonth() + 1) * 100 + hoy.getDate();
}

// Fecha de hoy en formato YYYY-MM-DD (según el reloj del dispositivo del usuario)
// Se usa para guardar y consultar el progreso diario en Supabase
function getTodayDateStr() {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
}

function shuffleWithSeed(arr, seed) {
  const rand = seedRandom(seed);
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=Teko:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #000000; color: #f2f2f2; font-family: 'Inter', sans-serif; min-height: 100vh; }
.app { min-height: 100vh; display: flex; flex-direction: column; }

/* HEADER */
.hdr { background: #000000; border-bottom: 1px solid #2a2a2a; padding: 0 20px; height: 56px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 200; }
.hdr-logo { font-family: 'Teko', sans-serif; font-weight: 700; font-size: 28px; letter-spacing: 1px; color: #ffb400; }
.hdr-logo span { color: #f2f2f2; }
.hdr-right { display: flex; align-items: center; gap: 10px; }
.hdr-user { font-size: 13px; color: #7a7a7a; }
.hdr-pts { font-family: 'Teko', sans-serif; font-weight: 700; font-size: 17px; color: #ffb400; }
.btn-out { background: none; border: 1px solid #2a2a2a; color: #7a7a7a; border-radius: 4px; padding: 3px 10px; font-size: 12px; cursor: pointer; }
.btn-out:hover { color: #f2f2f2; }

/* NAV */
.nav { background: #0a0a0a; border-bottom: 1px solid #2a2a2a; display: flex; overflow-x: auto; }
.nav::-webkit-scrollbar { display: none; }
.nav-btn { background: none; border: none; color: #7a7a7a; padding: 13px 14px; font-size: 11px; font-weight: 600; cursor: pointer; white-space: nowrap; border-bottom: 2px solid transparent; font-family: 'Inter', sans-serif; text-transform: uppercase; transition: all 0.15s; letter-spacing: 0.5px; }
.nav-btn:hover { color: #f2f2f2; }
.nav-btn.on { color: #ffb400; border-bottom-color: #ffb400; }

/* MAIN */
.main { flex: 1; padding: 20px 16px; max-width: 680px; margin: 0 auto; width: 100%; }

/* LOGIN */
.login-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #000000; padding: 20px; }
.login-box { width: 100%; max-width: 380px; }
.login-logo { font-family: 'Teko', sans-serif; font-weight: 700; font-size: 54px; letter-spacing: 2px; color: #ffb400; text-align: center; line-height: 1; }
.login-logo em { color: #f2f2f2; font-style: normal; }
.login-tag { text-align: center; color: #9a9a9a; font-size: 16px; line-height: 1.6; margin: 14px 0 32px; }
.inp-lbl { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #7a7a7a; margin-bottom: 6px; display: block; }
.inp { width: 100%; background: #0a0a0a; border: 1px solid #2a2a2a; border-radius: 6px; padding: 11px 14px; color: #f2f2f2; font-size: 14px; font-family: 'Inter', sans-serif; outline: none; margin-bottom: 14px; transition: border-color 0.15s; }
.inp:focus { border-color: #ffb400; }
.btn-main { width: 100%; background: #ffb400; color: #1a1200; border: none; border-radius: 6px; padding: 13px; font-family: 'Teko', sans-serif; font-weight: 700; font-size: 17px; letter-spacing: 1px; cursor: pointer; }
.btn-main:hover { background: #ffc733; }
.btn-sub { width: 100%; background: none; border: 1px solid #2a2a2a; color: #7a7a7a; border-radius: 6px; padding: 10px; font-size: 13px; cursor: pointer; margin-top: 10px; font-family: 'Inter', sans-serif; }
.btn-sub:hover { color: #f2f2f2; }

/* CARD */
.card { background: #0a0a0a; border: 1px solid #2a2a2a; border-radius: 10px; padding: 22px; margin-bottom: 16px; }
.card-title { font-family: 'Teko', sans-serif; font-weight: 700; font-size: 24px; letter-spacing: 0.5px; color: #ffb400; margin-bottom: 4px; }
.card-sub { font-size: 12px; color: #7a7a7a; margin-bottom: 18px; }

/* INTRO OVERLAY */
.overlay { position: fixed; inset: 0; background: #000000dd; display: flex; align-items: center; justify-content: center; z-index: 300; padding: 20px; }
.intro-box { background: #0a0a0a; border: 1px solid #2a2a2a; border-radius: 12px; padding: 32px; max-width: 420px; width: 100%; text-align: center; }
.intro-icon { font-size: 56px; margin-bottom: 16px; }
.intro-title { font-family: 'Teko', sans-serif; font-weight: 700; font-size: 32px; color: #ffb400; letter-spacing: 1px; margin-bottom: 12px; }
.intro-text { font-size: 14px; color: #9a9a9a; line-height: 1.7; margin-bottom: 24px; }
.btn-green { background: #3a2900; color: #ffb400; border: 1px solid #ffb40044; border-radius: 6px; padding: 12px 32px; font-family: 'Teko', sans-serif; font-weight: 700; font-size: 17px; letter-spacing: 1px; cursor: pointer; }
.btn-green:hover { background: #4a3400; }
.btn-rojo { background: #2a0a0a; color: #ff3b3b; border: 1px solid #ff3b3b55; border-radius: 6px; padding: 8px 16px; font-size: 13px; cursor: pointer; font-family: 'Inter', sans-serif; }
.btn-rojo:hover { background: #3a1010; }

/* COUNTDOWN */
.countdown { font-family: 'Teko', sans-serif; font-weight: 700; font-size: 130px; color: #ffb400; text-align: center; padding: 60px 0; }

/* RESULT OVERLAY */
.result-overlay-pts { font-family: 'Teko', sans-serif; font-weight: 700; font-size: 88px; color: #ffb400; text-align: center; letter-spacing: 1px; line-height: 1; }
.result-overlay-lbl { text-align: center; color: #7a7a7a; font-size: 13px; margin: 6px 0 20px; }
.result-mini-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
.rms { background: #000000; border: 1px solid #2a2a2a; border-radius: 8px; padding: 12px; text-align: center; }
.rms-val { font-family: 'Teko', sans-serif; font-weight: 700; font-size: 25px; color: #f2f2f2; }
.rms-lbl { font-size: 11px; color: #7a7a7a; margin-top: 2px; }
.result-overlay-btns { display: flex; flex-direction: column; gap: 8px; }

/* TEST */
.nivel-badge { display: inline-block; border-radius: 4px; padding: 2px 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
.nivel-facil    { background: #ffb40015; color: #ffb400; border: 1px solid #ffb40044; }
.nivel-medio    { background: #ffb40022; color: #ffb400; border: 1px solid #ffb40055; }
.nivel-dificil  { background: #ff3b3b1a; color: #ff3b3b; border: 1px solid #ff3b3b44; }
.nivel-muyDificil { background: #ff3b3b30; color: #ff3b3b; border: 1px solid #ff3b3b66; }
.q-num { font-size: 12px; color: #7a7a7a; margin-bottom: 6px; }
.q-text { font-family: 'Teko', sans-serif; font-weight: 700; font-size: 28px; line-height: 1.3; color: #f2f2f2; margin-bottom: 22px; }
.opts { display: flex; flex-direction: column; gap: 9px; }
.opt { background: #000000; border: 1.5px solid #2a2a2a; border-radius: 8px; padding: 13px 16px; color: #c8c8c8; font-size: 14px; cursor: pointer; text-align: left; font-family: 'Inter', sans-serif; transition: all 0.12s; display: flex; align-items: center; gap: 12px; }
.opt:hover:not(:disabled) { border-color: #ffb400; color: #f2f2f2; }
.opt.ok { background: #2ecc7118; border-color: #2ecc71; color: #2ecc71; }
.opt.pending { border-color: #ffb400; color: #ffb400; }
.opt.ko { background: #ff3b3b15; border-color: #ff3b3b; color: #ff3b3b; }
.opt:disabled { cursor: default; }
.opt-letra { font-family: 'Teko', sans-serif; font-weight: 700; font-size: 14px; color: #7a7a7a; min-width: 18px; }
.progress-row { display: flex; gap: 4px; margin-bottom: 18px; }
.progress-dot { height: 4px; flex: 1; border-radius: 2px; background: #2a2a2a; }
.progress-dot.done { background: #7a5200; }
.progress-dot.current { background: #ffb400; }
.racha-badge { display: inline-flex; align-items: center; gap: 6px; background: #ffb40015; border: 1px solid #ffb40040; border-radius: 20px; padding: 4px 12px; font-size: 13px; color: #ffb400; font-weight: 700; margin-bottom: 14px; }
.score-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.score-live { font-family: 'Teko', sans-serif; font-weight: 700; font-size: 30px; color: #ffb400; }

/* RESULT FINAL TEST */
.result-pts-big { font-family: 'Teko', sans-serif; font-weight: 700; font-size: 78px; color: #ffb400; text-align: center; }
.result-sub { text-align: center; color: #7a7a7a; font-size: 13px; margin-bottom: 6px; }
.result-grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin: 18px 0; }
.rs { background: #000000; border: 1px solid #2a2a2a; border-radius: 8px; padding: 14px; text-align: center; }
.rs-val { font-family: 'Teko', sans-serif; font-weight: 700; font-size: 30px; color: #f2f2f2; }
.rs-lbl { font-size: 11px; color: #7a7a7a; margin-top: 2px; }
.answer-review { display: flex; flex-direction: column; gap: 6px; margin-bottom: 20px; }
.ar { padding: 10px 14px; border-radius: 8px; font-size: 13px; display: flex; align-items: flex-start; gap: 8px; }
.ar-ok { background: #ffb40012; border: 1px solid #ffb40033; color: #e8c98a; }
.ar-ko { background: #ff3b3b12; border: 1px solid #ff3b3b33; color: #e8a0a0; }
.rank-summary { background: #000000; border: 1px solid #ffb40033; border-radius: 8px; padding: 14px; margin-bottom: 16px; }
.rank-summary-title { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #7a7a7a; margin-bottom: 10px; }
.rank-summary-row { display: flex; justify-content: space-between; font-size: 13px; padding: 5px 0; border-bottom: 1px solid #2a2a2a33; }
.rank-summary-row:last-child { border-bottom: none; }

/* ALINEACION */
.campo { background: #050505; border: 1px solid #2a2a2a; border-radius: 10px; padding: 16px 12px; margin-bottom: 16px; position: relative; }
.campo::after { content: ''; position: absolute; top: 50%; left: 8%; right: 8%; height: 1px; background: #ffffff12; }
.campo-row { display: flex; justify-content: space-around; margin-bottom: 14px; }
.camp-player { display: flex; flex-direction: column; align-items: center; gap: 5px; }
.camp-circle { width: 44px; height: 44px; border-radius: 50%; border: 2px solid #2a2a2a; background: #000000; display: flex; align-items: center; justify-content: center; font-size: 20px; transition: all 0.2s; }
.camp-circle.found { background: #3a2900; border-color: #ffb400; }
.camp-name { font-size: 10px; color: #7a7a7a; text-align: center; max-width: 56px; }
.camp-name.found { color: #ffb400; font-weight: 700; }
.ali-info { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 12px; }
.ali-form { color: #ffb400; font-family: 'Teko', sans-serif; font-weight: 700; font-size: 20px; }
.ali-partido { text-align: right; color: #7a7a7a; line-height: 1.6; }
.ali-partido strong { color: #f2f2f2; }
.guess-row { display: flex; gap: 8px; margin-bottom: 12px; }
.guess-inp { flex: 1; background: #000000; border: 1px solid #2a2a2a; border-radius: 6px; padding: 10px 14px; color: #f2f2f2; font-size: 14px; font-family: 'Inter', sans-serif; outline: none; }
.guess-inp:focus { border-color: #ffb400; }
.btn-send { background: #3a2900; color: #ffb400; border: 1px solid #ffb40044; border-radius: 6px; padding: 10px 18px; font-weight: 700; cursor: pointer; font-family: 'Inter', sans-serif; }
.btn-send:hover { background: #4a3400; }
.tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
.tag-ok { background: #ffb40015; border: 1px solid #ffb40044; border-radius: 14px; padding: 3px 10px; font-size: 12px; color: #ffb400; }
.tag-ko { background: #ff3b3b15; border: 1px solid #ff3b3b44; border-radius: 14px; padding: 3px 10px; font-size: 12px; color: #ff3b3b; }
.timer-bar-wrap { height: 6px; background: #2a2a2a; border-radius: 3px; margin-bottom: 14px; overflow: hidden; }
.timer-bar { height: 6px; border-radius: 3px; background: #ffb400; transition: width 1s linear, background 0.5s; }
.timer-bar.warn { background: #ff8a00; }
.timer-bar.danger { background: #ff3b3b; }
.timer-txt { font-family: 'Teko', sans-serif; font-weight: 700; font-size: 25px; color: #f2f2f2; margin-bottom: 6px; }

/* JUGADOR */
.sil-wrap { display: flex; flex-direction: column; align-items: center; margin-bottom: 16px; }
.sil { font-size: 80px; filter: brightness(0) invert(0.15); }
.pista-gen { background: #0a0a0a; border: 1px solid #2a2a2a; border-radius: 6px; padding: 10px 16px; font-size: 13px; color: #9a9a9a; margin-bottom: 14px; text-align: center; }
.pistas { display: flex; flex-direction: column; gap: 8px; margin-bottom: 18px; }
.pista { background: #000000; border-left: 3px solid #ffb400; border-radius: 4px; padding: 10px 14px; font-size: 13px; color: #c8c8c8; animation: fadeIn 0.3s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: none; } }
.pista-num { font-size: 10px; color: #7a7a7a; margin-bottom: 2px; text-transform: uppercase; letter-spacing: 1px; }
.tries-dots { display: flex; gap: 6px; margin-bottom: 14px; align-items: center; }
.dot { width: 12px; height: 12px; border-radius: 50%; background: #2a2a2a; border: 1px solid #3a3a3a; }
.dot.used { background: #ff3b3b; border-color: #ff3b3b; }
.dot.won { background: #ffb400; border-color: #ffb400; }

/* COMBINA */
.comb-reto { background: #000000; border: 2px solid #ff3b3b44; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 18px; }
.comb-reto-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #7a7a7a; margin-bottom: 8px; }
.comb-reto-txt { font-family: 'Teko', sans-serif; font-weight: 700; font-size: 36px; color: #ffb400; letter-spacing: 1px; }
.comb-pts-row { display: flex; justify-content: center; gap: 24px; margin-bottom: 18px; }
.comb-stat { text-align: center; }
.comb-val { font-family: 'Teko', sans-serif; font-weight: 700; font-size: 36px; }
.comb-lbl { font-size: 11px; color: #7a7a7a; }
.float-anim { animation: floatUp 0.6s ease forwards; position: fixed; pointer-events: none; font-family: 'Teko', sans-serif; font-weight: 700; font-size: 24px; z-index: 999; }
@keyframes floatUp { 0% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(-60px); } }
.btn-salto { background: #2a0a0a; color: #ff3b3b; border: 1px solid #ff3b3b44; border-radius: 6px; padding: 10px 16px; font-size: 14px; cursor: pointer; font-family: 'Inter', sans-serif; font-weight: 600; }
.comb-history { display: flex; flex-direction: column; gap: 5px; margin-bottom: 14px; max-height: 150px; overflow-y: auto; }
.ch-row { padding: 7px 12px; border-radius: 6px; font-size: 13px; display: flex; justify-content: space-between; }
.ch-ok { background: #ffb40015; color: #ffb400; }
.ch-ko { background: #ff3b3b15; color: #ff3b3b; }

/* RANKING */
.rank-tabs { display: flex; border-radius: 6px; overflow: hidden; border: 1px solid #2a2a2a; margin-bottom: 18px; }
.rank-tab { flex: 1; background: none; border: none; color: #7a7a7a; padding: 10px; font-size: 13px; cursor: pointer; font-family: 'Inter', sans-serif; font-weight: 600; text-transform: uppercase; }
.rank-tab.on { background: #3a2900; color: #ffb400; }
.rank-row { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 8px; margin-bottom: 8px; background: #000000; border: 1px solid #2a2a2a22; cursor: pointer; transition: all 0.15s; }
.rank-row:hover { background: #0a0a0a; }
.rank-row.top3 { border-color: #ffd70033; }
.rank-row.me { border-color: #ffb40044; background: #ffb40008; }
.rank-pos { font-family: 'Teko', sans-serif; font-weight: 700; font-size: 25px; width: 30px; text-align: center; }
.pos-1 { color: #ffd700; } .pos-2 { color: #c0c0c0; } .pos-3 { color: #cd7f32; }
.rank-name { flex: 1; font-size: 14px; font-weight: 500; }
.rank-pts { font-family: 'Teko', sans-serif; font-weight: 700; font-size: 23px; color: #ffb400; }
.rank-prize { font-size: 11px; color: #ffd700; }
.desglose { background: #0a0a0a; border: 1px solid #2a2a2a; border-radius: 8px; padding: 16px; margin-top: 4px; margin-bottom: 10px; }
.des-row { display: flex; justify-content: space-between; font-size: 13px; padding: 6px 0; border-bottom: 1px solid #2a2a2a33; }
.des-row:last-child { border-bottom: none; }
.des-lbl { color: #7a7a7a; }
.des-val { font-family: 'Teko', sans-serif; font-weight: 700; font-size: 19px; color: #f2f2f2; }

/* INICIO */
.home-hero { background: #0a0a0a; border: 1px solid #2a2a2a; border-radius: 12px; padding: 28px; margin-bottom: 18px; text-align: center; }
.home-pts { font-family: 'Teko', sans-serif; font-weight: 700; font-size: 70px; color: #ffb400; line-height: 1; }
.home-pts-lbl { font-size: 13px; color: #7a7a7a; margin-top: 4px; }
.mode-list { display: flex; flex-direction: column; gap: 10px; }
.mode-item { background: #0a0a0a; border: 1px solid #2a2a2a; border-radius: 10px; padding: 16px 18px; display: flex; align-items: center; gap: 14px; cursor: pointer; transition: all 0.15s; }
.mode-item:hover { border-color: #ffb40044; background: #111111; }
.mode-icon { font-size: 30px; }
.mode-name { font-family: 'Teko', sans-serif; font-weight: 700; font-size: 20px; color: #f2f2f2; }
.mode-desc { font-size: 12px; color: #7a7a7a; margin-top: 2px; }
.mode-pts { font-family: 'Teko', sans-serif; font-weight: 700; font-size: 20px; color: #ffb400; margin-left: auto; }
.mode-done { font-size: 20px; margin-left: auto; }

/* PRÓXIMAMENTE */
.prox-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; text-align: center; }
.prox-icon { font-size: 72px; margin-bottom: 20px; }
.prox-title { font-family: 'Teko', sans-serif; font-weight: 700; font-size: 30px; color: #ffb400; letter-spacing: 1px; margin-bottom: 10px; }
.prox-text { font-size: 15px; color: #7a7a7a; line-height: 1.6; }

.alert { border-radius: 6px; padding: 10px 14px; font-size: 13px; margin-bottom: 12px; }
.alert-ok  { background: #ffb40015; border: 1px solid #ffb40044; color: #ffb400; }
.alert-ko  { background: #ff3b3b15; border: 1px solid #ff3b3b44; color: #ff3b3b; }
.alert-inf { background: #ffffff0a; border: 1px solid #ffffff22; color: #c8c8c8; }
.divider { border: none; border-top: 1px solid #2a2a2a; margin: 18px 0; }
.dia-badge { font-size: 11px; background: #2a2a2a; color: #9a9a9a; border-radius: 4px; padding: 2px 8px; margin-left: 8px; }

@media (max-width: 480px) {
  .result-grid3 { grid-template-columns: 1fr 1fr; }
  .q-text { font-size: 19px; }
  .home-pts { font-size: 44px; }
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
        <div style={{ fontFamily: "'Teko',sans-serif", fontSize: 13, color: "#7a7a7a", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" }}>{juego} · Resultado</div>
        <div style={{ fontFamily: "'Teko',sans-serif", fontSize: 90, color: "#ffb400", lineHeight: 1, textShadow: "0 0 30px #ffb40055", marginBottom: 4 }}>{pts}</div>
        <div style={{ fontSize: 13, color: "#7a7a7a", marginBottom: 20 }}>puntos conseguidos</div>
        {ptsBreakdown && (
          <div style={{ background: "#000000", border: "1px solid #2a2a2a", borderRadius: 10, padding: "12px 16px", marginBottom: 16, width: "100%" }}>
            {ptsBreakdown}
          </div>
        )}
        <div style={{ background: "#000000", border: "1px solid #ffd70033", borderRadius: 10, padding: "12px 16px", marginBottom: 20, width: "100%" }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "#7a7a7a", marginBottom: 10 }}>Tu acumulado de hoy</div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6 }}>
            <span style={{ color: "#9a9a9a" }}>Este juego</span>
            <span style={{ fontFamily: "'Teko',sans-serif", fontSize: 18, color: "#ffb400" }}>{pts} pts</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
            <span style={{ color: "#9a9a9a" }}>Total ranking hoy</span>
            <span style={{ fontFamily: "'Teko',sans-serif", fontSize: 18, color: "#ffd700" }}>{total} pts</span>
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
        <div style={{ fontSize: 13, color: "#7a7a7a", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>{juego}</div>
        <div className="result-overlay-pts">{pts}</div>
        <div className="result-overlay-lbl">puntos conseguidos</div>
        {extras}
        <div className="rank-summary">
          <div className="rank-summary-title">Tu acumulado de hoy</div>
          <div className="rank-summary-row"><span style={{ color: "#7a7a7a" }}>Puntos totales hoy</span><span style={{ fontFamily: "'Teko',sans-serif", fontSize: 18, color: "#ffb400" }}>{totalDiario}</span></div>
          <div className="rank-summary-row"><span style={{ color: "#7a7a7a" }}>Posición estimada</span><span style={{ fontFamily: "'Teko',sans-serif", fontSize: 18, color: "#ffd700" }}>#4</span></div>
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
        <div style={{ background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 12, padding: "20px 24px", margin: "16px 0", textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🔧</div>
          <div style={{ fontFamily: "'Teko',sans-serif", fontSize: 22, color: "#ffb400", letterSpacing: 1, marginBottom: 8 }}>PRÓXIMAMENTE...</div>
          <div style={{ fontSize: 14, color: "#9a9a9a", lineHeight: 1.7 }}>Estamos trabajando para ofrecerte la mejor experiencia.<br />Vuelve pronto, ¡no te lo pierdas!</div>
        </div>
        <div style={{ fontSize: 12, color: "#7a7a7a", textAlign: "center" }}>
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
  const [showResult, setShowResult] = useState(false);
  const [finalPts, setFinalPts] = useState(0);
  const [showOverlay, setShowOverlay] = useState(false);
  const questions = useRef(preguntas);
  const testStartRef = useRef(null); // Ref para evitar problema de closure con el tiempo
  const [correctIdx, setCorrectIdx] = useState(null); // Se rellena con la respuesta del servidor, tras contestar

  const q = questions.current[idx];

  const finishTest = (answersArr, base) => {
    const allCorrect = answersArr.length === 10 && answersArr.every(a => a.correct);
    const totalSeconds = testStartRef.current
      ? Math.round((Date.now() - testStartRef.current) / 1000)
      : 99;
    // Según el PDF: <= 7s = 500 pts, cada segundo extra resta 25, >= 31s = 0 pts
    // Solo se aplica si has acertado las 10
    const bonus = allCorrect ? timeBonus(totalSeconds) : 0;
    const total = base + bonus;
    console.log("Test acabado:", { totalSeconds, base, bonus, total, allCorrect });
    setFinalPts(total);
    setShowOverlay(true);
  };

  const handleAnswer = async (i) => {
    if (sel !== null) return;
    setSel(i); // bloquea los botones mientras esperamos la respuesta del servidor

    // La respuesta correcta NO viaja al navegador hasta ahora, ya contestada.
    // Se comprueba en Supabase, para que no se pueda ver "haciendo trampa".
    const { data } = await supabase.rpc("comprobar_respuesta_test", {
      p_pregunta_id: q.id,
      p_respuesta: i,
    }).maybeSingle();

    const correct = data?.correcta ?? false;
    const ansIdx = data?.respuesta_correcta ?? i;
    setCorrectIdx(ansIdx);

    const pts = correct ? q.pts : 0;
    const newBase = baseScore + pts;
    setBaseScore(newBase);
    setRacha(r => correct ? r + 1 : 0);
    const newAnswers = [...answers, { q: q.q, sel: i, ans: ansIdx, opts: q.opts, correct, pts }];
    setAnswers(newAnswers);
    setTimeout(() => {
      if (idx + 1 >= questions.current.length) {
        finishTest(newAnswers, newBase);
      } else {
        setIdx(i2 => i2 + 1);
        setSel(null);
        setCorrectIdx(null);
      }
    }, 900);
  };

  const handleRendirse = () => {
    finishTest(answers, baseScore);
  };

  if (!preguntas || preguntas.length < 10) return (
    <div className="card">
      <div className="card-title">✔ TEST DIARIO</div>
      <div className="alert alert-inf">⚠️ Aún no hay suficientes preguntas cargadas para hoy. Vuelve más tarde.</div>
    </div>
  );

  if (done && !showResult) return (
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
      <Countdown onDone={() => { setPhase("playing"); testStartRef.current = Date.now(); }} />
    </div>
  );

  if (showOverlay) return (
    <FinishOverlay icon="✔" juego="Test Diario" pts={finalPts} scores={scores}
      ptsBreakdown={
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
            <span style={{ color: "#9a9a9a" }}>Puntos base</span>
            <span style={{ color: "#e8f0ff" }}>{baseScore} pts</span>
          </div>
          {finalPts > baseScore && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "#9a9a9a" }}>Bonus tiempo (¡10/10!)</span>
              <span style={{ color: "#ffd700" }}>+{finalPts - baseScore} pts</span>
            </div>
          )}
          {finalPts === baseScore && (
            <div style={{ fontSize: 12, color: "#7a7a7a", marginTop: 4 }}>
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
        <div className="rank-summary-row"><span style={{ color: "#9a9a9a" }}>✔ Test Diario</span><span style={{ color: "#ffb400", fontFamily: "'Teko',sans-serif", fontSize: 16 }}>{finalPts} pts</span></div>
        <div className="rank-summary-row"><span style={{ color: "#9a9a9a" }}>Total acumulado hoy</span><span style={{ color: "#ffd700", fontFamily: "'Teko',sans-serif", fontSize: 16 }}>{Object.values(scores).reduce((a,b)=>a+b,0) + finalPts} pts</span></div>
      </div>
      <div style={{ fontFamily: "'Teko',sans-serif", fontSize: 14, color: "#7a7a7a", letterSpacing: 1, marginBottom: 10 }}>REVISIÓN DE RESPUESTAS</div>
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
          if (sel !== null && correctIdx !== null) { if (i === correctIdx) cls += " ok"; else if (i === sel) cls += " ko"; }
          else if (sel !== null && i === sel) cls += " pending";
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

  // Genera las líneas del campo según la formación
  // .filter(Boolean) evita que la app se rompa si algún jugador falta en los datos
  // (por ejemplo, un partido antiguo guardado con menos de 11 jugadores)
  const getLineas = () => {
    const j = ALINEACION.jugadores || [];
    const f = ALINEACION.formacion;
    let raw;
    if (f === "4-3-3") raw = [[j[0]], j.slice(1,5), j.slice(5,8), j.slice(8,11)];
    else if (f === "4-4-2") raw = [[j[0]], j.slice(1,5), j.slice(5,9), j.slice(9,11)];
    else if (f === "4-2-3-1") raw = [[j[0]], j.slice(1,5), j.slice(5,7), j.slice(7,10), [j[10]]];
    else if (f === "3-5-2") raw = [[j[0]], j.slice(1,4), j.slice(4,9), j.slice(9,11)];
    else if (f === "5-3-2") raw = [[j[0]], j.slice(1,6), j.slice(6,9), j.slice(9,11)];
    else if (f === "4-1-4-1") raw = [[j[0]], j.slice(1,5), [j[5]], j.slice(6,10), [j[10]]];
    else raw = [[j[0]], j.slice(1,5), j.slice(5,8), j.slice(8,11)]; // Fallback genérico
    return raw.map(linea => linea.filter(Boolean));
  };
  const lineas = getLineas();

  if (done && !finished) return (
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
        <div style={{ fontSize: 13, color: "#9a9a9a" }}>
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
        <div className="rank-summary-row"><span style={{ color: "#9a9a9a" }}>🏟 Alineación</span><span style={{ color: "#ffb400", fontFamily: "'Teko',sans-serif", fontSize: 16 }}>{finalPts} pts</span></div>
        <div className="rank-summary-row"><span style={{ color: "#9a9a9a" }}>Total acumulado hoy</span><span style={{ color: "#ffd700", fontFamily: "'Teko',sans-serif", fontSize: 16 }}>{Object.values(scores).reduce((a,b)=>a+b,0) + finalPts} pts</span></div>
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: "#7a7a7a", marginBottom: 8 }}>Alineación completa:</div>
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
      {ALINEACION.foto_url && (
        <div style={{ marginBottom: 12, borderRadius: 10, overflow: "hidden", border: "1px solid #2a2a2a", aspectRatio: "16 / 9", width: "100%" }}>
          <img src={ALINEACION.foto_url} alt="Foto del partido" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        </div>
      )}
      <div className="campo">
        {lineas.map((linea, li) => (
          <div key={li} className="campo-row">
            {linea.map((j, ji) => {
              const isFound = found.find(f => f.nombre === j.nombre);
              return (
                <div key={ji} className="camp-player">
                  <div className={`camp-circle ${isFound ? "found" : ""}`}>
                    {isFound
                      ? (j.foto_url ? <img src={j.foto_url} alt={j.nombre} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} /> : "⚽")
                      : "👤"}
                  </div>
                  <div className={`camp-name ${isFound ? "found" : ""}`}>{isFound ? j.nombre : j.pos}</div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 12, color: "#7a7a7a", marginBottom: 10 }}>{found.length}/11 encontrados · {calcPts(found)} pts actuales</div>
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
        <div style={{ fontSize: 13, color: "#9a9a9a" }}>
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

  if (done && !finished) return (
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
      {JUGADOR.foto_url && (
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <img src={JUGADOR.foto_url} alt={JUGADOR.nombre}
            style={{ width: 140, height: 140, objectFit: "cover", borderRadius: "50%", border: "3px solid #ffb400", boxShadow: "0 0 20px #ffb40044" }} />
        </div>
      )}
      <div className="result-pts-big">{finalPts}</div>
      <div className="result-sub">{won ? `¡Era ${JUGADOR.nombre}! 🎉` : `Era ${JUGADOR.nombre}. ¡Suerte la próxima!`}</div>
      <div className="result-grid3" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="rs"><div className="rs-val">{pistasShown}</div><div className="rs-lbl">Pistas usadas</div></div>
        <div className="rs"><div className="rs-val">{tries.length}</div><div className="rs-lbl">Intentos</div></div>
      </div>
      <div className="rank-summary">
        <div className="rank-summary-title">Acumulado ranking de hoy</div>
        <div className="rank-summary-row"><span style={{ color: "#9a9a9a" }}>⚽ Jugador</span><span style={{ color: "#ffb400", fontFamily: "'Teko',sans-serif", fontSize: 16 }}>{finalPts} pts</span></div>
        <div className="rank-summary-row"><span style={{ color: "#9a9a9a" }}>Total acumulado hoy</span><span style={{ color: "#ffd700", fontFamily: "'Teko',sans-serif", fontSize: 16 }}>{Object.values(scores).reduce((a,b)=>a+b,0) + finalPts} pts</span></div>
      </div>
    </div>
  );

  const currentPts = lastChance ? 25 : PTS[Math.min(pistasShown - 1, 4)];

  return (
    <div className="card">
      <div className="card-title">⚽ ADIVINA EL JUGADOR</div>
      <div className="sil-wrap">
        {JUGADOR.foto_url ? (
          <img src={JUGADOR.foto_url} alt="Jugador"
            style={{ width: 120, height: 120, objectFit: "cover", borderRadius: "50%", filter: "brightness(0)", border: "3px solid #2a2a2a" }} />
        ) : (
          <div className="sil">🧍</div>
        )}
      </div>
      <div className="pista-gen">🌟 {JUGADOR.pistaGeneral}</div>
      <div className="tries-dots">
        {[0,1,2,3,4].map(i => (
          <div key={i} className={`dot ${i < tries.length ? (tries[i]?.correct ? "won" : "used") : ""}`} />
        ))}
        <span style={{ fontSize: 12, color: "#7a7a7a", marginLeft: 6 }}>{tries.length}/5 intentos · {currentPts} pts si aciertas</span>
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
  const [timeLeft, setTimeLeft] = useState(60);
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
    addFloat(ok ? "+20" : "❌", ok ? "#ffb400" : "#ff3b3b");
    if (ok) { setAciertos(a => a + 1); setCombIdx(i => i + 1); }
  };

  const handleSalto = () => {
    const comb = COMBINAS[combIdx % COMBINAS.length];
    setHistory(h => [...h, { desc: comb.desc, respuesta: "SALTO", ok: false, salto: true }]);
    setSaltos(s => s + 1);
    setCombIdx(i => i + 1);
    addFloat("-10", "#ff3b3b");
  };

  const pct = (timeLeft / 60) * 100;
  const ptsActuales = Math.max(0, Math.min(aciertos, 20) * 20 - saltos * 10);

  if (showOverlay) return (
    <FinishOverlay icon="🔍" juego="Combina" pts={finalPts} scores={scores}
      ptsBreakdown={
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
            <span style={{ color: "#9a9a9a" }}>{aciertos} aciertos × 20</span>
            <span style={{ color: "#e8f0ff" }}>+{Math.min(aciertos,20)*20} pts</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: "#9a9a9a" }}>{saltos} saltos × 10</span>
            <span style={{ color: "#ff3b3b" }}>-{saltos*10} pts</span>
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

  if (done && !finished) return (
    <div className="card">
      <div className="card-title">🔍 COMBINA</div>
      <div className="alert alert-ok">✅ Ya jugaste el Combina de hoy. ¡Vuelve mañana!</div>
    </div>
  );

  if (phase === "intro") return (
    <IntroModal icon="🔍" title="COMBINA"
      text="¡Tienes 1 minuto para combinar el máximo de jugadores posibles y llevarte 400 puntos! Cada acierto suma +20, cada salto resta -10."
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
        <div className="rs"><div className="rs-val" style={{ color: "#ffb400" }}>{aciertos}</div><div className="rs-lbl">Aciertos</div></div>
        <div className="rs"><div className="rs-val" style={{ color: "#ff3b3b" }}>{saltos}</div><div className="rs-lbl">Saltos</div></div>
        <div className="rs"><div className="rs-val">{aciertos + saltos}</div><div className="rs-lbl">Total retos</div></div>
      </div>
      <div className="rank-summary">
        <div className="rank-summary-title">Acumulado ranking de hoy</div>
        <div className="rank-summary-row"><span style={{ color: "#7a7a7a" }}>🔍 Combina</span><span style={{ color: "#ffb400", fontFamily: "'Teko',sans-serif", fontSize: 16 }}>{finalPts} pts</span></div>
        <div className="rank-summary-row"><span style={{ color: "#7a7a7a" }}>Total acumulado hoy</span><span style={{ color: "#ffd700", fontFamily: "'Teko',sans-serif", fontSize: 16 }}>{Object.values(scores).reduce((a,b)=>a+b,0) + finalPts} pts</span></div>
      </div>
      {history.length > 0 && (
        <>
          <div style={{ fontSize: 12, color: "#7a7a7a", marginBottom: 8 }}>Historial:</div>
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
        <div style={{ fontFamily: "'Teko',sans-serif", fontSize: 22, color: timeLeft <= 30 ? "#ff3b3b" : "#f2f2f2" }}>
          {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
        </div>
      </div>
      <div className="timer-bar-wrap">
        <div className={`timer-bar${pct > 50 ? "" : pct > 25 ? " warn" : " danger"}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="comb-pts-row">
        <div className="comb-stat"><div className="comb-val" style={{ color: "#ffb400" }}>{aciertos}</div><div className="comb-lbl">Aciertos</div></div>
        <div className="comb-stat"><div className="comb-val" style={{ color: "#ff3b3b" }}>{saltos}</div><div className="comb-lbl">Saltos</div></div>
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

// ─── PRECIO JUSTO ─────────────────────────────────────────────────────────────
function PrecioJusto({ onFinish, done, scores, reto: RETO }) {
  const [phase, setPhase] = useState("intro");
  const [respuestas, setRespuestas] = useState({});
  const [pistas, setPistas] = useState({});
  const [pidiendoPista, setPidiendoPista] = useState(null);
  const [finished, setFinished] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [resultado, setResultado] = useState([]);
  const [finalPts, setFinalPts] = useState(0);
  const [enviando, setEnviando] = useState(false);

  if (!RETO || !RETO.jugadores || RETO.jugadores.length === 0) return (
    <div className="card">
      <div className="card-title">💰 EL PRECIO JUSTO</div>
      <div className="alert alert-inf">Todavía no hay ningún reto configurado para hoy.</div>
    </div>
  );

  if (done && !finished) return (
    <div className="card">
      <div className="card-title">💰 EL PRECIO JUSTO</div>
      <div className="alert alert-ok">✅ Ya jugaste El Precio Justo de hoy. ¡Vuelve mañana!</div>
    </div>
  );

  if (phase === "intro") return (
    <IntroModal icon="💰" title="EL PRECIO JUSTO"
      text={`Reparte un presupuesto de ${RETO.presupuesto}M entre los ${RETO.jugadores.length} jugadores, acertando el precio real de cada uno. El total gastado debe cuadrar exactamente con el presupuesto para poder enviar. ¡Cuidado, no te pases!`}
      onStart={() => setPhase("playing")} />
  );

  const gastado = RETO.jugadores.reduce((sum, j) => sum + (parseInt(respuestas[j.id]) || 0), 0);
  const restante = RETO.presupuesto - gastado;
  const todosRellenos = RETO.jugadores.every(j => respuestas[j.id] !== undefined && respuestas[j.id] !== "");
  const puedeEnviar = todosRellenos && restante === 0;

  const pedirPista = async (jugadorId) => {
    if (pistas[jugadorId] || pidiendoPista) return;
    if (!window.confirm("Esta pista te restará 100 puntos de tu puntuación final. ¿Quieres pedirla?")) return;
    setPidiendoPista(jugadorId);
    const { data } = await supabase.rpc("precio_pedir_pista", { p_jugador_id: jugadorId }).maybeSingle();
    if (data) setPistas(p => ({ ...p, [jugadorId]: data }));
    setPidiendoPista(null);
  };

  const enviar = async () => {
    if (!puedeEnviar || enviando) return;
    setEnviando(true);
    const p_respuestas = RETO.jugadores.map(j => ({ jugador_id: j.id, valor: parseInt(respuestas[j.id]) || 0 }));
    const { data } = await supabase.rpc("precio_comprobar", { p_reto_id: RETO.id, p_respuestas });
    const filas = data || [];
    const penalizacion = Object.keys(pistas).length * 100;
    const pts = Math.max(0, filas.reduce((s, f) => s + f.pts, 0) - penalizacion);
    setResultado(filas);
    setFinalPts(pts);
    setFinished(true);
    setShowOverlay(true);
    setEnviando(false);
  };

  if (showOverlay) return (
    <FinishOverlay icon="💰" juego="El Precio Justo" pts={finalPts} scores={scores}
      onContinue={() => { setShowOverlay(false); onFinish && onFinish(finalPts); }} />
  );

  if (finished) return (
    <div className="card">
      <div className="card-title">💰 EL PRECIO JUSTO</div>
      <div className="result-pts-big">{finalPts}</div>
      <div className="result-sub">puntos conseguidos</div>
      <div className="answer-review">
        {resultado.map(f => (
          <div key={f.jugador_id} className={`ar ${f.resultado === "fallo" ? "ar-ko" : "ar-ok"}`}>
            <span>{f.resultado === "exacto" ? "✔" : f.resultado === "cerca" ? "🟡" : "❌"}</span>
            <span><strong>{f.nombre}</strong> · Real: {f.valor_real}M · Tu apuesta: {f.valor_usuario}M · {f.pts} pts</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="card">
      <div className="card-title">💰 EL PRECIO JUSTO</div>
      <div className="card-sub">Reparte el presupuesto entre los {RETO.jugadores.length} jugadores</div>

      <div className="result-mini-grid" style={{ marginBottom: 18 }}>
        <div className="rms"><div className="rms-val">{RETO.presupuesto}M</div><div className="rms-lbl">Presupuesto</div></div>
        <div className="rms"><div className="rms-val" style={{ color: restante < 0 ? "#ff3b3b" : restante === 0 ? "#ffb400" : "#f2f2f2" }}>{restante}M</div><div className="rms-lbl">Restante</div></div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 18 }}>
        {RETO.jugadores.map(j => (
          <div key={j.id} style={{ background: "#000000", border: "1px solid #2a2a2a", borderRadius: 8, padding: 12, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            {j.foto_url ? (
              <img src={j.foto_url} alt={j.nombre} style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>⚽</div>
            )}
            <div style={{ flex: 1, minWidth: 120 }}>
              <div style={{ fontFamily: "'Teko',sans-serif", fontWeight: 700, fontSize: 18, color: "#f2f2f2" }}>{j.nombre}</div>
              {pistas[j.id] && <div style={{ fontSize: 12, color: "#ffb400", marginTop: 2 }}>💡 {pistas[j.id].pista}</div>}
            </div>
            <input className="inp" type="number" placeholder="0" style={{ width: 90, marginBottom: 0, textAlign: "right" }}
              value={respuestas[j.id] || ""} onChange={e => setRespuestas(r => ({ ...r, [j.id]: e.target.value }))} />
            <button className="btn-send" style={{ padding: "10px 12px", opacity: pistas[j.id] ? 0.4 : 1 }}
              disabled={!!pistas[j.id] || pidiendoPista === j.id} onClick={() => pedirPista(j.id)}>
              {pidiendoPista === j.id ? "..." : "💡 -100"}
            </button>
          </div>
        ))}
      </div>

      <button className="btn-main" disabled={!puedeEnviar || enviando} style={{ opacity: puedeEnviar ? 1 : 0.4 }} onClick={enviar}>
        {enviando ? "ENVIANDO..." : "ENVIAR"}
      </button>
    </div>
  );
}

// ─── ORDENA ───────────────────────────────────────────────────────────────────
function Ordena({ onFinish, done, scores, reto: RETO }) {
  const [phase, setPhase] = useState("intro");
  const [rondaIdx, setRondaIdx] = useState(0);
  const [orden, setOrden] = useState([]);
  const [dragIdx, setDragIdx] = useState(null);
  const [dragX, setDragX] = useState(0);
  const itemRefs = useRef([]);
  const containerRef = useRef(null);
  const dragInfo = useRef(null);

  const [totalPts, setTotalPts] = useState(0);
  const [resultadosRondas, setResultadosRondas] = useState([]);
  const [rondaResultado, setRondaResultado] = useState(null);
  const [showRondaResult, setShowRondaResult] = useState(false);
  const [finished, setFinished] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const criterios = RETO?.criterios || [];
  const jugadoresBase = RETO?.jugadores || [];
  const criterioActual = criterios[rondaIdx];

  useEffect(() => {
    if (jugadoresBase.length) {
      // Baraja el orden inicial de cada ronda (solo afecta al punto de partida, no a la puntuación)
      const copia = [...jugadoresBase];
      for (let i = copia.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copia[i], copia[j]] = [copia[j], copia[i]];
      }
      setOrden(copia);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rondaIdx, RETO]);

  if (!RETO || jugadoresBase.length === 0 || criterios.length === 0) return (
    <div className="card">
      <div className="card-title">🔀 ORDENA</div>
      <div className="alert alert-inf">Todavía no hay ningún reto configurado para hoy.</div>
    </div>
  );

  if (done && !finished) return (
    <div className="card">
      <div className="card-title">🔀 ORDENA</div>
      <div className="alert alert-ok">✅ Ya jugaste Ordena hoy. ¡Vuelve mañana!</div>
    </div>
  );

  if (phase === "intro") return (
    <IntroModal icon="🔀" title="ORDENA"
      text={`Los mismos ${jugadoresBase.length} jugadores se ordenan de ${criterios.length} formas distintas. En cada ronda, arrastra las tarjetas: el valor más ALTO va a la IZQUIERDA (verde), el más BAJO a la DERECHA (rojo). Primera ronda: ${criterios[0]?.criterio}.`}
      onStart={() => setPhase("playing")} />
  );

  const onPointerDown = (e, idx) => {
    if (!itemRefs.current[idx]) return;
    const rect = itemRefs.current[idx].getBoundingClientRect();
    dragInfo.current = { startX: e.clientX, offsetInItem: e.clientX - rect.left };
    setDragIdx(idx);
    try { e.target.setPointerCapture(e.pointerId); } catch (err) {}
  };

  const onPointerMove = (e) => {
    if (dragIdx === null || !dragInfo.current || !containerRef.current) return;
    const deltaX = e.clientX - dragInfo.current.startX;
    setDragX(deltaX);

    const containerRect = containerRef.current.getBoundingClientRect();
    const pointerXInContainer = e.clientX - containerRect.left + containerRef.current.scrollLeft;
    let newIndex = dragIdx;
    for (let i = 0; i < orden.length; i++) {
      const el = itemRefs.current[i];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      const mid = r.left + r.width / 2 - containerRect.left + containerRef.current.scrollLeft;
      if (pointerXInContainer > mid) newIndex = i;
    }
    if (newIndex !== dragIdx) {
      setOrden(o => {
        const copy = [...o];
        const [moved] = copy.splice(dragIdx, 1);
        copy.splice(newIndex, 0, moved);
        return copy;
      });
      dragInfo.current.startX = e.clientX;
      setDragIdx(newIndex);
      setDragX(0);
    }
  };

  const onPointerUp = () => { setDragIdx(null); setDragX(0); dragInfo.current = null; };

  const enviarRonda = async () => {
    if (enviando) return;
    setEnviando(true);
    const p_orden_usuario = orden.map(j => j.id);
    const { data } = await supabase.rpc("orden_comprobar", { p_criterio_id: criterioActual.id, p_orden_usuario });
    const filas = data || [];
    const pts = filas.reduce((s, f) => s + (f.pts || 0), 0);
    setResultadosRondas(r => [...r, { criterio: criterioActual.criterio, unidad: criterioActual.unidad, filas, pts }]);
    setTotalPts(t => t + pts);
    setRondaResultado({ criterio: criterioActual.criterio, unidad: criterioActual.unidad, filas, pts });
    setShowRondaResult(true);
    setEnviando(false);
  };

  const siguienteRonda = () => {
    setShowRondaResult(false);
    if (rondaIdx + 1 < criterios.length) {
      setRondaIdx(i => i + 1);
    } else {
      setFinished(true);
      setShowOverlay(true);
    }
  };

  if (showOverlay) return (
    <FinishOverlay icon="🔀" juego="Ordena" pts={totalPts} scores={scores}
      onContinue={() => { setShowOverlay(false); onFinish && onFinish(totalPts); }} />
  );

  if (finished) return (
    <div className="card">
      <div className="card-title">🔀 ORDENA</div>
      <div className="result-pts-big">{totalPts}</div>
      <div className="result-sub">puntos totales · {criterios.length} rondas</div>
      {resultadosRondas.map((r, ri) => (
        <div key={ri} style={{ marginBottom: 14 }}>
          <div className="lbl" style={{ marginBottom: 6 }}>{r.criterio} — {r.pts} pts</div>
          <div className="answer-review">
            {r.filas.map(f => (
              <div key={f.posicion} className={`ar ${f.correcto ? "ar-ok" : "ar-ko"}`}>
                <span>{f.correcto ? "✔" : "❌"}</span>
                <span>
                  <strong>#{f.posicion}</strong> pusiste a <strong>{f.nombre}</strong> ({f.valor_real}{r.unidad ? ` ${r.unidad}` : ""})
                  {!f.correcto && <> · iba <strong>{f.correcto_nombre}</strong> ({f.correcto_valor}{r.unidad ? ` ${r.unidad}` : ""})</>}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  if (showRondaResult) return (
    <div className="card">
      <div className="card-title">🔀 RONDA {rondaIdx + 1}/{criterios.length}</div>
      <div className="card-sub">{rondaResultado.criterio}</div>
      <div className="result-pts-big" style={{ fontSize: 44 }}>{rondaResultado.pts} pts</div>
      <div className="answer-review" style={{ margin: "16px 0" }}>
        {rondaResultado.filas.map(f => (
          <div key={f.posicion} className={`ar ${f.correcto ? "ar-ok" : "ar-ko"}`}>
            <span>{f.correcto ? "✔" : "❌"}</span>
            <span>
              <strong>#{f.posicion}</strong> pusiste a <strong>{f.nombre}</strong> ({f.valor_real}{rondaResultado.unidad ? ` ${rondaResultado.unidad}` : ""})
              {!f.correcto && <> · iba <strong>{f.correcto_nombre}</strong> ({f.correcto_valor}{rondaResultado.unidad ? ` ${rondaResultado.unidad}` : ""})</>}
            </span>
          </div>
        ))}
      </div>
      <button className="btn-main" onClick={siguienteRonda}>
        {rondaIdx + 1 < criterios.length ? "SIGUIENTE RONDA" : "VER RESULTADO FINAL"}
      </button>
    </div>
  );

  return (
    <div className="card">
      <div className="card-title">🔀 ORDENA — Ronda {rondaIdx + 1}/{criterios.length}</div>
      <div className="card-sub">{criterioActual.criterio} · de mayor (izquierda) a menor (derecha)</div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>
        <span style={{ color: "#3ddc72" }}>⬅ Mayor</span><span style={{ color: "#ff3b3b" }}>Menor ➡</span>
      </div>

      <div ref={containerRef} style={{
        position: "relative", borderRadius: 10, padding: 10, overflowX: "auto",
        display: "flex", gap: 10,
        background: "linear-gradient(90deg, #3ddc7233 0%, #00000000 20%, #00000000 80%, #ff3b3b33 100%)",
        border: "1px solid #2a2a2a",
      }} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
        {orden.map((j, i) => (
          <div key={j.id} ref={el => itemRefs.current[i] = el}
            onPointerDown={(e) => onPointerDown(e, i)}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
              background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 8, padding: "12px 10px",
              minWidth: 96, flexShrink: 0,
              touchAction: "none", cursor: "grab", userSelect: "none",
              transform: dragIdx === i ? `translateX(${dragX}px) scale(1.04)` : "none",
              zIndex: dragIdx === i ? 10 : 1,
              boxShadow: dragIdx === i ? "0 8px 20px #000000aa" : "none",
              transition: dragIdx === i ? "none" : "transform 0.15s",
            }}>
            <span style={{ fontFamily: "'Teko',sans-serif", fontSize: 18, color: "#7a7a7a" }}>{i + 1}</span>
            {j.foto_url ? (
              <img src={j.foto_url} alt={j.nombre} style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#111111", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>⚽</div>
            )}
            <div style={{ fontFamily: "'Teko',sans-serif", fontWeight: 700, fontSize: 15, color: "#f2f2f2", textAlign: "center", lineHeight: 1.1 }}>{j.nombre}</div>
            <span style={{ fontSize: 16, color: "#7a7a7a" }}>⠿</span>
          </div>
        ))}
      </div>

      <button className="btn-main" style={{ marginTop: 16 }} disabled={enviando} onClick={enviarRonda}>
        {enviando ? "ENVIANDO..." : `ENVIAR RONDA ${rondaIdx + 1}`}
      </button>
    </div>
  );
}

// ─── RANKING ──────────────────────────────────────────────────────────────────
function Ranking({ user, scores }) {
  const [tab, setTab] = useState("diario");
  const [expanded, setExpanded] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detalle, setDetalle] = useState({}); // cache: { "userId-tab": [ {fecha, test_pts, ...}, ... ] }
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
    setExpanded(null); // al cambiar de pestaña, cierra cualquier detalle abierto
  }, [tab]);

  const allRanking = usuarios.map((u, i) => ({
    pos: i + 1,
    id: u.id,
    nombre: u.nombre,
    pts: tab === "diario" ? u.puntos_totales : u.puntos_semana,
    me: u.nombre === user.nombre,
  }));

  const toggleExpand = async (i, userId) => {
    if (expanded === i) { setExpanded(null); return; }
    setExpanded(i);
    const cacheKey = `${userId}-${tab}`;
    if (!detalle[cacheKey]) {
      const dias = tab === "diario" ? 1 : 7;
      const { data } = await supabase.rpc("progreso_diario_de", { p_user_id: userId, p_dias: dias });
      setDetalle(d => ({ ...d, [cacheKey]: data || [] }));
    }
  };

  const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  const nombreDia = (fechaStr) => {
    const d = new Date(fechaStr + "T00:00:00");
    return DIAS_SEMANA[d.getDay() === 0 ? 6 : d.getDay() - 1];
  };
  const totalDia = (row) => (row?.test_pts || 0) + (row?.alineacion_pts || 0) + (row?.jugador_pts || 0) + (row?.combina_pts || 0) + (row?.precio_pts || 0) + (row?.orden_pts || 0);

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
        allRanking.map((r, i) => {
          const cacheKey = `${r.id}-${tab}`;
          const filas = detalle[cacheKey];
          return (
            <div key={i}>
              <div className={`rank-row ${r.pos <= 3 ? "top3" : ""} ${r.me ? "me" : ""}`}
                onClick={() => toggleExpand(i, r.id)}>
                <div className={`rank-pos ${r.pos === 1 ? "pos-1" : r.pos === 2 ? "pos-2" : r.pos === 3 ? "pos-3" : ""}`}>
                  {r.pos === 1 ? "🥇" : r.pos === 2 ? "🥈" : r.pos === 3 ? "🥉" : `#${r.pos}`}
                </div>
                <div className="rank-name">{r.nombre}{r.me ? " (tú)" : ""}</div>
                <div style={{ textAlign: "right" }}>
                  <div className="rank-pts">{r.pts.toLocaleString()}</div>
                  {tab === "semanal" && r.pos === 1 && <div className="rank-prize">👕 Camiseta</div>}
                </div>
              </div>
              {expanded === i && (
                <div className="desglose">
                  {!filas ? (
                    <div style={{ fontSize: 13, color: "#7a7a7a", textAlign: "center", padding: "6px 0" }}>Cargando...</div>
                  ) : tab === "diario" ? (
                    <>
                      <div className="des-row"><span className="des-lbl">✔ Test Diario</span><span className="des-val">{filas[0]?.test_pts || 0} pts</span></div>
                      <div className="des-row"><span className="des-lbl">🏟 Alineación</span><span className="des-val">{filas[0]?.alineacion_pts || 0} pts</span></div>
                      <div className="des-row"><span className="des-lbl">⚽ Jugador</span><span className="des-val">{filas[0]?.jugador_pts || 0} pts</span></div>
                      <div className="des-row"><span className="des-lbl">🔍 Combina</span><span className="des-val">{filas[0]?.combina_pts || 0} pts</span></div>
                      <div className="des-row"><span className="des-lbl">💰 Precio Justo</span><span className="des-val">{filas[0]?.precio_pts || 0} pts</span></div>
                      <div className="des-row"><span className="des-lbl">🔀 Ordena</span><span className="des-val">{filas[0]?.orden_pts || 0} pts</span></div>
                    </>
                  ) : filas.length === 0 ? (
                    <div style={{ fontSize: 13, color: "#7a7a7a", textAlign: "center", padding: "6px 0" }}>Sin puntos esta semana todavía.</div>
                  ) : (
                    filas.map(f => (
                      <div className="des-row" key={f.fecha}>
                        <span className="des-lbl">{nombreDia(f.fecha)}</span>
                        <span className="des-val">{totalDia(f)} pts</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })
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
  // Mapa entre pestaña y URL. Así la barra de direcciones muestra goalwin.pro/test-diario
  // en vez de quedarse siempre en goalwin.pro, y el botón "atrás" del navegador
  // vuelve a la pantalla anterior de la app en vez de salir de la web.
  const TAB_PATHS = {
    inicio: "/", test: "/test-diario", alineacion: "/alineacion",
    jugador: "/jugador-misterio", combina: "/combina", precio: "/precio-justo", orden: "/ordena", ranking: "/ranking",
  };
  const pathToTab = (path) => Object.keys(TAB_PATHS).find(k => TAB_PATHS[k] === path) || "inicio";

  const [tab, setTabState] = useState(() => pathToTab(window.location.pathname));
  const goTo = (id, replace = false) => {
    setTabState(id);
    const path = TAB_PATHS[id] || "/";
    if (window.location.pathname !== path) {
      if (replace) window.history.replaceState({ tab: id }, "", path);
      else window.history.pushState({ tab: id }, "", path);
    }
  };
  useEffect(() => {
    // Deja la URL inicial bien puesta (por si se entró directo por goalwin.pro/test-diario)
    window.history.replaceState({ tab }, "", TAB_PATHS[tab] || "/");
    const onPopState = () => setTabState(pathToTab(window.location.pathname));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
  const setTab = goTo;
  const [scores, setScores] = useState({ test: 0, alineacion: 0, jugador: 0, combina: 0, precio: 0, orden: 0 });
  const [done, setDone] = useState({ test: false, alineacion: false, jugador: false, combina: false, precio: false, orden: false });

  // Contenido cargado desde Supabase
  const [juegosActivos, setJuegosActivos] = useState({ test: false, alineacion: false, jugador: false, combina: false, precio: false, orden: false });
  const [preguntasHoy, setPreguntasHoy] = useState([]);
  const [partidoHoy, setPartidoHoy] = useState(null);
  const [jugadorHoy, setJugadorHoy] = useState(null);
  const [combinasHoy, setCombinasHoy] = useState([]);
  const [precioHoy, setPrecioHoy] = useState(null);
  const [ordenHoy, setOrdenHoy] = useState(null);
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

      // ── Semilla basada en la fecha de hoy (cambia a las 00:00h) ──────────
      // Todos los usuarios ven el mismo contenido el mismo día
      const hoy = new Date();
      const semilla = hoy.getFullYear() * 10000 + (hoy.getMonth() + 1) * 100 + hoy.getDate();

      // Generador de números pseudoaleatorios determinista (seeded)
      const seededRand = (seed) => {
        let s = seed;
        return () => {
          s = (s * 1664525 + 1013904223) & 0xffffffff;
          return (s >>> 0) / 0xffffffff;
        };
      };

      const sortSeeded = (arr, seed) => {
        const rand = seededRand(seed);
        return [...arr].sort(() => rand() - 0.5);
      };

      // 10 preguntas del día: 4 fácil, 3 medio, 2 difícil, 1 muy difícil
      const { data: pr } = await supabase.from("preguntas_publicas").select("*");
      if (pr) {
        const porNivel = (n, offset) =>
          sortSeeded(pr.filter(p => p.nivel === n), semilla + offset);
        const elegidas = [
          ...porNivel("facil", 1).slice(0, 4),
          ...porNivel("medio", 2).slice(0, 3),
          ...porNivel("dificil", 3).slice(0, 2),
          ...porNivel("muyDificil", 4).slice(0, 1),
        ].map(p => ({
          id: p.id, q: p.texto, opts: p.opts, nivel: p.nivel,
          pts: p.nivel === "facil" ? 25 : p.nivel === "medio" ? 50 : p.nivel === "dificil" ? 100 : 150,
        }));
        setPreguntasHoy(elegidas);
      }

      // Alineación del día
      const { data: al } = await supabase.from("alineaciones").select("*");
      if (al && al.length > 0) {
        const rand = seededRand(semilla + 10);
        const idx = Math.floor(rand() * al.length);
        const elegida = al[idx];
        setPartidoHoy({
          equipo: elegida.equipo, rival: elegida.rival, competicion: elegida.competicion,
          temporada: elegida.temporada, formacion: elegida.formacion, jugadores: elegida.jugadores,
          foto_url: elegida.foto_url || null,
        });
      }

      // Jugador del día
      const { data: ju } = await supabase.from("jugadores_adivina").select("*");
      if (ju && ju.length > 0) {
        const rand = seededRand(semilla + 20);
        const idx = Math.floor(rand() * ju.length);
        const elegido = ju[idx];
        setJugadorHoy({
          nombre: elegido.nombre, alias: elegido.alias || [],
          pistaGeneral: elegido.pista_general, pistas: elegido.pistas,
          foto_url: elegido.foto_url || null,
        });
      }

      // Combinaciones del banco (todas disponibles, el orden cambia cada día)
      const { data: co } = await supabase.from("combinas").select("*");
      if (co) {
        const ordenadas = sortSeeded(co, semilla + 30);
        setCombinasHoy(ordenadas.map(c => ({
          desc: c.descripcion,
          validar: (r) => c.validos.some(v => r.includes(v.toLowerCase())),
        })));
      }

      // Precio Justo del día (el valor real de cada jugador NO viaja aquí,
      // solo se pide al servidor al pedir una pista o al enviar la solución)
      const { data: pr2 } = await supabase.from("precios_retos").select("*");
      if (pr2 && pr2.length > 0) {
        const rand = seededRand(semilla + 40);
        const idx = Math.floor(rand() * pr2.length);
        const reto = pr2[idx];
        const { data: jugs } = await supabase
          .from("precios_jugadores_publicos")
          .select("*")
          .eq("reto_id", reto.id)
          .order("orden");
        setPrecioHoy({ id: reto.id, presupuesto: reto.presupuesto, jugadores: jugs || [] });
      }

      // Ordena del día (el valor real de cada jugador no viaja aquí,
      // solo se revela ronda a ronda al enviar la solución)
      const { data: or2 } = await supabase.from("orden_retos").select("*");
      if (or2 && or2.length > 0) {
        const rand = seededRand(semilla + 50);
        const idx = Math.floor(rand() * or2.length);
        const reto = or2[idx];
        const [{ data: jugs }, { data: crits }] = await Promise.all([
          supabase.from("orden_jugadores_publicos").select("*").eq("reto_id", reto.id),
          supabase.from("orden_criterios").select("*").eq("reto_id", reto.id).order("orden"),
        ]);
        setOrdenHoy({ id: reto.id, jugadores: jugs || [], criterios: crits || [] });
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
          id: session.user.id,
          email: session.user.email,
          nombre: session.user.user_metadata?.nombre || session.user.email.split("@")[0],
        });
      }
      setCheckingSession(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          nombre: session.user.user_metadata?.nombre || session.user.email.split("@")[0],
        });
      } else {
        setUser(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Carga el progreso de HOY del usuario (qué juegos completó y con cuántos puntos).
  // Esto es lo que hace que "ya jugaste hoy" sobreviva a un refresco de página.
  // Usa una función de Supabase (progreso_diario_hoy) que calcula "hoy" con el
  // reloj del SERVIDOR, no con el del dispositivo, para que no se pueda hacer
  // trampa adelantando la fecha del móvil/ordenador.
  useEffect(() => {
    const loadProgresoHoy = async () => {
      if (!user?.id) return;
      const { data } = await supabase.rpc("progreso_diario_hoy").maybeSingle();

      if (data) {
        setScores({
          test: data.test_pts ?? 0,
          alineacion: data.alineacion_pts ?? 0,
          jugador: data.jugador_pts ?? 0,
          combina: data.combina_pts ?? 0,
          precio: data.precio_pts ?? 0,
          orden: data.orden_pts ?? 0,
        });
        setDone({
          test: data.test_pts !== null,
          alineacion: data.alineacion_pts !== null,
          jugador: data.jugador_pts !== null,
          combina: data.combina_pts !== null,
          precio: data.precio_pts !== null,
          orden: data.orden_pts !== null,
        });
      } else {
        // No hay fila para hoy todavía: es un día nuevo, nada jugado aún
        setScores({ test: 0, alineacion: 0, jugador: 0, combina: 0, precio: 0, orden: 0 });
        setDone({ test: false, alineacion: false, jugador: false, combina: false, precio: false, orden: false });
      }
    };
    loadProgresoHoy();
  }, [user]);

  const handleFinish = async (game, pts) => {
    const newScores = { ...scores, [game]: pts };
    const newDone = { ...done, [game]: true };
    setScores(newScores);
    setDone(newDone);

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

      // Guarda el progreso de HOY llamando a la función de Supabase, que calcula
      // la fecha en el servidor (no confía en la fecha que mande el navegador).
      await supabase.rpc("guardar_progreso_diario", {
        p_test: newDone.test ? newScores.test : null,
        p_alineacion: newDone.alineacion ? newScores.alineacion : null,
        p_jugador: newDone.jugador ? newScores.jugador : null,
        p_combina: newDone.combina ? newScores.combina : null,
        p_precio: newDone.precio ? newScores.precio : null,
        p_orden: newDone.orden ? newScores.orden : null,
      });
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
      <div style={{ fontFamily: "'Teko',sans-serif", fontSize: 24, color: "#ffb400", letterSpacing: 2 }}>CARGANDO...</div>
    </div>
  );

  if (!user) return (
    <div style={{ background: "#0a0a0f", minHeight: "100vh" }}>
      <style>{css}</style>
      <div className="login-wrap">
        <div className="login-box">
          <div className="login-logo">GOAL <em>WIN</em></div>
          <div className="login-tag">Goal Win: el juego diario de fútbol para poner a prueba tu conocimiento del deporte rey. Sé constante cada día para conseguir premios exclusivos cada semana.</div>
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
      <div style={{ fontFamily: "'Teko',sans-serif", fontSize: 24, color: "#ffb400", letterSpacing: 2 }}>CARGANDO CONTENIDO...</div>
    </div>
  );

  const modes = [
    { id: "test",      icon: "✔",  name: "TEST DIARIO",            desc: "10 preguntas · Nivel progresivo · Bonus tiempo", maxPts: 600 },
    { id: "alineacion",icon: "🏟", name: "ADIVINA LA ALINEACIÓN",  desc: "2 minutos para los 11 jugadores",                maxPts: 200 },
    { id: "jugador",   icon: "⚽", name: "ADIVINA EL JUGADOR",     desc: "5 pistas progresivas · Sin tiempo",              maxPts: 300 },
    { id: "combina",   icon: "🔍", name: "COMBINA",                desc: "1 minuto · Máximas combinaciones",              maxPts: 400 },
    { id: "precio",    icon: "💰", name: "EL PRECIO JUSTO",         desc: "Reparte el presupuesto entre los jugadores",    maxPts: 1000 },
    { id: "orden",     icon: "🔀", name: "ORDENA",                  desc: "Arrastra a los jugadores en el orden correcto", maxPts: 300 },
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
          ["precio",    "💰 PRECIO"],
          ["orden",     "🔀 ORDENA"],
          ["ranking",   "🏆 RANKING"],
        ].map(([id, label]) => (
          <button key={id} className={`nav-btn ${tab === id ? "on" : ""}`} onClick={() => setTab(id)}>{label}</button>
        ))}
      </nav>
      <main className="main">
        {tab === "inicio" && (
          <>
            <div className="home-hero">
              <div style={{ fontSize: 12, color: "#7a7a7a", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>Puntos de hoy</div>
              <div className="home-pts">{totalPts}</div>
              <div className="home-pts-lbl">¡Juega todos los modos para sumar más!</div>
            </div>
            <div style={{ fontFamily: "'Teko',sans-serif", fontSize: 14, color: "#7a7a7a", letterSpacing: 2, marginBottom: 12 }}>MODOS DE HOY</div>
            <div className="mode-list">
              {modes.map(m => (
                <div key={m.id} className="mode-item" onClick={() => setTab(m.id)}>
                  <div className="mode-icon">{m.icon}</div>
                  <div>
                    <div className="mode-name">{m.name}</div>
                    <div className="mode-desc">{m.desc}</div>
                  </div>
                  {m.maxPts === null
                    ? <div style={{ marginLeft: "auto", fontSize: 11, color: "#7a7a7a" }}>PRONTO</div>
                    : done[m.id]
                      ? <div className="mode-pts">✓ {scores[m.id] || 0}</div>
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
        {tab === "precio"     && (juegosActivos.precio       ? <PrecioJusto       done={done.precio}     scores={scores} reto={precioHoy}       onFinish={(pts) => handleFinish("precio", pts)} />      : <Proximamente icon="💰" nombre="EL PRECIO JUSTO" />)}
        {tab === "orden"      && (juegosActivos.orden        ? <Ordena            done={done.orden}      scores={scores} reto={ordenHoy}        onFinish={(pts) => handleFinish("orden", pts)} />       : <Proximamente icon="🔀" nombre="ORDENA" />)}
        {tab === "ranking"    && <Ranking user={user} scores={scores} />}
      </main>
    </div>
  );
}