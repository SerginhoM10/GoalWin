import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

// ─── STYLES ───────────────────────────────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #0a0a0f; color: #f0ede6; font-family: 'Inter', sans-serif; min-height: 100vh; }

.admin { display: flex; min-height: 100vh; }

/* SIDEBAR */
.sidebar {
  width: 220px; background: #0f1a12; border-right: 1px solid #1e3d25;
  display: flex; flex-direction: column; position: fixed; top: 0; left: 0; bottom: 0; z-index: 100;
}
.sb-logo { font-family: 'Bebas Neue', sans-serif; font-size: 22px; color: #a8ff3e; padding: 20px 18px 16px; border-bottom: 1px solid #1e3d25; letter-spacing: 2px; }
.sb-logo span { color: #f0ede6; }
.sb-tag { font-size: 10px; color: #6b8f71; letter-spacing: 1px; text-transform: uppercase; padding: 10px 18px 6px; }
.sb-btn {
  background: none; border: none; color: #6b8f71; text-align: left;
  padding: 11px 18px; font-size: 13px; cursor: pointer; font-family: 'Inter', sans-serif;
  display: flex; align-items: center; gap: 10px; transition: all 0.15s; width: 100%;
}
.sb-btn:hover { color: #f0ede6; background: #1a3a1a22; }
.sb-btn.on { color: #a8ff3e; background: #a8ff3e11; border-left: 2px solid #a8ff3e; }
.sb-stats { margin-top: auto; padding: 16px 18px; border-top: 1px solid #1e3d25; }
.sb-stat { display: flex; justify-content: space-between; font-size: 12px; color: #6b8f71; margin-bottom: 6px; }
.sb-stat span { color: #f0ede6; font-weight: 600; }

/* MAIN */
.content { margin-left: 220px; flex: 1; padding: 28px 28px; max-width: 900px; }
.page-title { font-family: 'Bebas Neue', sans-serif; font-size: 32px; color: #a8ff3e; letter-spacing: 2px; margin-bottom: 4px; }
.page-sub { font-size: 13px; color: #6b8f71; margin-bottom: 24px; }

/* CARDS */
.card { background: #111d14; border: 1px solid #1e3d25; border-radius: 12px; padding: 20px; margin-bottom: 16px; }
.card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.card-title { font-family: 'Bebas Neue', sans-serif; font-size: 18px; color: #f0ede6; letter-spacing: 1px; }

/* FORM */
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-full { grid-column: 1 / -1; }
.lbl { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #6b8f71; margin-bottom: 5px; display: block; }
.inp { width: 100%; background: #0a0a0f; border: 1px solid #1e3d25; border-radius: 7px; padding: 9px 12px; color: #f0ede6; font-size: 13px; font-family: 'Inter', sans-serif; outline: none; transition: border-color 0.15s; }
.inp:focus { border-color: #a8ff3e; }
.sel { width: 100%; background: #0a0a0f; border: 1px solid #1e3d25; border-radius: 7px; padding: 9px 12px; color: #f0ede6; font-size: 13px; font-family: 'Inter', sans-serif; outline: none; cursor: pointer; }
.inp-group { margin-bottom: 12px; }
.opts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.opt-row { display: flex; align-items: center; gap: 8px; }
.opt-letter { font-family: 'Bebas Neue', sans-serif; font-size: 16px; color: #6b8f71; min-width: 16px; }
.radio-correct { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #6b8f71; cursor: pointer; }
.radio-correct input { accent-color: #a8ff3e; }

/* BUTTONS */
.btn-add { background: #a8ff3e; color: #0a0a0f; border: none; border-radius: 7px; padding: 9px 18px; font-family: 'Bebas Neue', sans-serif; font-size: 16px; letter-spacing: 1px; cursor: pointer; transition: background 0.15s; }
.btn-add:hover { background: #c0ff70; }
.btn-del { background: #e74c3c22; color: #e74c3c; border: 1px solid #e74c3c44; border-radius: 6px; padding: 4px 10px; font-size: 12px; cursor: pointer; transition: all 0.15s; }
.btn-del:hover { background: #e74c3c44; }
.btn-edit { background: #f5c51822; color: #f5c518; border: 1px solid #f5c51844; border-radius: 6px; padding: 4px 10px; font-size: 12px; cursor: pointer; }
.btn-ghost { background: none; border: 1px solid #1e3d25; color: #6b8f71; border-radius: 6px; padding: 7px 14px; font-size: 13px; cursor: pointer; }
.btn-ghost:hover { color: #f0ede6; }
.btn-row { display: flex; gap: 8px; margin-top: 16px; justify-content: flex-end; }

/* TABLE */
.tbl { width: 100%; border-collapse: collapse; }
.tbl th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #6b8f71; padding: 8px 10px; border-bottom: 1px solid #1e3d25; }
.tbl td { padding: 10px 10px; font-size: 13px; border-bottom: 1px solid #1e3d2533; vertical-align: middle; }
.tbl tr:last-child td { border-bottom: none; }
.tbl tr:hover td { background: #1a3a1a11; }
.nivel-badge { display: inline-block; border-radius: 4px; padding: 2px 8px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
.nv-facil { background: #22a05022; color: #22a050; }
.nv-medio { background: #f5c51822; color: #f5c518; }
.nv-dificil { background: #e74c3c22; color: #e74c3c; }
.nv-muyDificil { background: #9b59b622; color: #9b59b6; }

/* ALIAS TAGS */
.alias-wrap { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 6px; }
.alias-tag { background: #1a6b3a22; border: 1px solid #1a6b3a44; border-radius: 12px; padding: 2px 8px; font-size: 11px; color: #6b8f71; display: flex; align-items: center; gap: 4px; }
.alias-tag button { background: none; border: none; color: #6b8f71; cursor: pointer; font-size: 14px; line-height: 1; padding: 0; }
.alias-tag button:hover { color: #e74c3c; }
.alias-add-row { display: flex; gap: 6px; margin-top: 6px; }
.alias-inp { flex: 1; background: #0a0a0f; border: 1px solid #1e3d25; border-radius: 6px; padding: 6px 10px; color: #f0ede6; font-size: 12px; font-family: 'Inter', sans-serif; outline: none; }
.alias-inp:focus { border-color: #a8ff3e; }
.btn-alias { background: #1a6b3a; color: #f0ede6; border: none; border-radius: 6px; padding: 6px 12px; font-size: 12px; cursor: pointer; }

/* PISTAS */
.pista-row { display: flex; align-items: center; gap: 8px; margin-bottom: 7px; }
.pista-num { font-family: 'Bebas Neue', sans-serif; font-size: 14px; color: #6b8f71; min-width: 20px; }

/* ALERT */
.alert { border-radius: 8px; padding: 10px 14px; font-size: 13px; margin-bottom: 14px; }
.alert-ok { background: #1a4a2a44; border: 1px solid #22a05044; color: #a8ff3e; }
.alert-ko { background: #2a101044; border: 1px solid #e74c3c44; color: #e74c3c; }

/* TABS */
.sec-tabs { display: flex; gap: 0; border-radius: 8px; overflow: hidden; border: 1px solid #1e3d25; margin-bottom: 20px; width: fit-content; }
.sec-tab { background: none; border: none; color: #6b8f71; padding: 8px 18px; font-size: 13px; cursor: pointer; font-family: 'Inter', sans-serif; font-weight: 600; transition: all 0.15s; }
.sec-tab.on { background: #1a6b3a; color: #f0ede6; }

/* DIVIDER */
.divider { border: none; border-top: 1px solid #1e3d25; margin: 18px 0; }

.empty { text-align: center; color: #6b8f71; font-size: 13px; padding: 24px; }

@media (max-width: 700px) {
  .sidebar { display: none; }
  .content { margin-left: 0; padding: 16px; }
  .form-grid { grid-template-columns: 1fr; }
  .opts-grid { grid-template-columns: 1fr; }
}
`;

// ─── HELPERS ─────────────────────────────────────────────────────────────────
let nextId = 100;
const uid = () => ++nextId;

function AliasEditor({ alias, onChange }) {
  const [inp, setInp] = useState("");
  const add = () => {
    if (!inp.trim()) return;
    onChange([...alias, inp.trim().toLowerCase()]);
    setInp("");
  };
  return (
    <div>
      <div className="alias-wrap">
        {alias.map((a, i) => (
          <span key={i} className="alias-tag">
            {a}
            <button onClick={() => onChange(alias.filter((_, j) => j !== i))}>×</button>
          </span>
        ))}
        {alias.length === 0 && <span style={{ fontSize: 12, color: "#6b8f71" }}>Sin alias añadidos</span>}
      </div>
      <div className="alias-add-row">
        <input className="alias-inp" placeholder="Añadir alias..." value={inp}
          onChange={e => setInp(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} />
        <button className="btn-alias" onClick={add}>+ Añadir</button>
      </div>
    </div>
  );
}

// ─── SECCIONES ────────────────────────────────────────────────────────────────

// PREGUNTAS
function SecPreguntas({ data, setData }) {
  const [view, setView] = useState("lista"); // lista | nueva | editar
  const [editing, setEditing] = useState(null);
  const [alert, setAlert] = useState(null);
  const empty = { texto: "", opts: ["", "", "", ""], ans: 0, nivel: "facil" };
  const [form, setForm] = useState(empty);

  const showAlert = (msg, type = "ok") => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 2500);
  };

  const openNew = () => { setForm(empty); setEditing(null); setView("nueva"); };
  const openEdit = (p) => { setForm({ ...p, opts: [...p.opts] }); setEditing(p.id); setView("nueva"); };

  const save = async () => {
    if (!form.texto || form.opts.some(o => !o)) { showAlert("Completa todos los campos.", "ko"); return; }
    if (editing) {
      const { error } = await supabase.from("preguntas").update({
        texto: form.texto, opts: form.opts, ans: form.ans, nivel: form.nivel,
      }).eq("id", editing);
      if (error) { showAlert("Error: " + error.message, "ko"); return; }
      setData(d => d.map(p => p.id === editing ? { ...form, id: editing } : p));
      showAlert("Pregunta actualizada.");
    } else {
      const { data: inserted, error } = await supabase.from("preguntas").insert({
        texto: form.texto, opts: form.opts, ans: form.ans, nivel: form.nivel,
      }).select().single();
      if (error) { showAlert("Error: " + error.message, "ko"); return; }
      setData(d => [...d, inserted]);
      showAlert("Pregunta añadida.");
    }
    setView("lista"); setForm(empty); setEditing(null);
  };

  const del = async (id) => {
    if (!confirm("¿Eliminar esta pregunta?")) return;
    const { error } = await supabase.from("preguntas").delete().eq("id", id);
    if (error) { showAlert("Error: " + error.message, "ko"); return; }
    setData(d => d.filter(p => p.id !== id));
  };

  const nivelCount = (n) => data.filter(p => p.nivel === n).length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div className="page-title">📋 TEST DIARIO</div>
          <div className="page-sub">Banco de preguntas · {data.length} preguntas en total</div>
        </div>
        {view === "lista" && <button className="btn-add" onClick={openNew}>+ NUEVA PREGUNTA</button>}
      </div>

      {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

      {view === "lista" && (
        <>
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            {[["facil","Fácil","nv-facil"], ["medio","Medio","nv-medio"], ["dificil","Difícil","nv-dificil"], ["muyDificil","Muy Difícil","nv-muyDificil"]].map(([n, label, cls]) => (
              <div key={n} style={{ background: "#0a0a0f", border: "1px solid #1e3d25", borderRadius: 8, padding: "10px 16px", textAlign: "center" }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: "#f0ede6" }}>{nivelCount(n)}</div>
                <div className={`nivel-badge nv-${n}`}>{label}</div>
              </div>
            ))}
          </div>
          <div className="card">
            {data.length === 0 ? <div className="empty">No hay preguntas aún. ¡Añade la primera!</div> : (
              <table className="tbl">
                <thead><tr>
                  <th>Pregunta</th><th>Nivel</th><th>Puntos</th><th>Respuesta</th><th></th>
                </tr></thead>
                <tbody>
                  {data.map(p => (
                    <tr key={p.id}>
                      <td style={{ maxWidth: 280 }}>{p.texto}</td>
                      <td><span className={`nivel-badge nv-${p.nivel}`}>{p.nivel === "muyDificil" ? "Muy Difícil" : p.nivel.charAt(0).toUpperCase() + p.nivel.slice(1)}</span></td>
                      <td style={{ color: "#a8ff3e", fontFamily: "'Bebas Neue',sans-serif", fontSize: 16 }}>
                        {p.nivel === "facil" ? 25 : p.nivel === "medio" ? 50 : p.nivel === "dificil" ? 100 : 150}
                      </td>
                      <td style={{ color: "#22a050" }}>{p.opts[p.ans]}</td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="btn-edit" onClick={() => openEdit(p)}>Editar</button>
                          <button className="btn-del" onClick={() => del(p.id)}>Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {view === "nueva" && (
        <div className="card">
          <div className="card-title">{editing ? "EDITAR PREGUNTA" : "NUEVA PREGUNTA"}</div>
          <hr className="divider" />
          <div className="inp-group">
            <label className="lbl">Texto de la pregunta</label>
            <input className="inp" placeholder="¿Quién...?" value={form.texto}
              onChange={e => setForm(f => ({ ...f, texto: e.target.value }))} />
          </div>
          <div className="inp-group">
            <label className="lbl">Nivel</label>
            <select className="sel" value={form.nivel} onChange={e => setForm(f => ({ ...f, nivel: e.target.value }))}>
              <option value="facil">Fácil (25 pts) — Preguntas 1-4</option>
              <option value="medio">Medio (50 pts) — Preguntas 5-7</option>
              <option value="dificil">Difícil (100 pts) — Preguntas 8-9</option>
              <option value="muyDificil">Muy Difícil (150 pts) — Pregunta 10</option>
            </select>
          </div>
          <div className="inp-group">
            <label className="lbl">Opciones de respuesta — marca la correcta</label>
            <div className="opts-grid">
              {["A", "B", "C", "D"].map((letra, i) => (
                <div key={i} className="opt-row">
                  <span className="opt-letter">{letra}</span>
                  <input className="inp" placeholder={`Opción ${letra}`} value={form.opts[i]}
                    onChange={e => { const o = [...form.opts]; o[i] = e.target.value; setForm(f => ({ ...f, opts: o })); }} />
                  <label className="radio-correct">
                    <input type="radio" name="ans" checked={form.ans === i} onChange={() => setForm(f => ({ ...f, ans: i }))} />
                    ✓
                  </label>
                </div>
              ))}
            </div>
          </div>
          <div className="btn-row">
            <button className="btn-ghost" onClick={() => { setView("lista"); setForm(empty); }}>Cancelar</button>
            <button className="btn-add" onClick={save}>{editing ? "GUARDAR CAMBIOS" : "AÑADIR PREGUNTA"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ALINEACIONES
function SecAlineaciones({ data, setData }) {
  const [view, setView] = useState("lista");
  const [editing, setEditing] = useState(null);
  const [alert, setAlert] = useState(null);
  const emptyJug = { pos: "", nombre: "", alias: [] };
  const emptyForm = { equipo: "", rival: "", competicion: "", temporada: "", formacion: "4-3-3", jugadores: Array(11).fill(null).map(() => ({ ...emptyJug, alias: [] })), foto_url: "" };
  const [form, setForm] = useState(emptyForm);

  const showAlert = (msg, type = "ok") => { setAlert({ msg, type }); setTimeout(() => setAlert(null), 2500); };

  const openNew = () => { setForm(emptyForm); setEditing(null); setView("nueva"); };
  const openEdit = (a) => { setForm({ ...a, jugadores: a.jugadores.map(j => ({ ...j, alias: [...j.alias] })) }); setEditing(a.id); setView("nueva"); };

  const setJug = (i, field, val) => {
    const j = form.jugadores.map((jj, idx) => idx === i ? { ...jj, [field]: val } : jj);
    setForm(f => ({ ...f, jugadores: j }));
  };

  const save = async () => {
    if (!form.equipo || !form.rival || form.jugadores.some(j => !j.nombre)) { showAlert("Completa todos los campos.", "ko"); return; }
    const payload = {
      equipo: form.equipo, rival: form.rival, competicion: form.competicion,
      temporada: form.temporada, formacion: form.formacion, jugadores: form.jugadores,
      foto_url: form.foto_url || null,
    };
    if (editing) {
      const { error } = await supabase.from("alineaciones").update(payload).eq("id", editing);
      if (error) { showAlert("Error: " + error.message, "ko"); return; }
      setData(d => d.map(a => a.id === editing ? { ...form, id: editing } : a));
      showAlert("Alineación actualizada.");
    } else {
      const { data: inserted, error } = await supabase.from("alineaciones").insert(payload).select().single();
      if (error) { showAlert("Error: " + error.message, "ko"); return; }
      setData(d => [...d, inserted]);
      showAlert("Alineación añadida.");
    }
    setView("lista");
  };

  const del = async (id) => {
    if (!confirm("¿Eliminar?")) return;
    const { error } = await supabase.from("alineaciones").delete().eq("id", id);
    if (error) { showAlert("Error: " + error.message, "ko"); return; }
    setData(d => d.filter(a => a.id !== id));
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div className="page-title">🟩 ADIVINA LA ALINEACIÓN</div>
          <div className="page-sub">Banco de partidos · {data.length} partidos en total</div>
        </div>
        {view === "lista" && <button className="btn-add" onClick={openNew}>+ NUEVO PARTIDO</button>}
      </div>
      {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

      {view === "lista" && (
        <div className="card">
          {data.length === 0 ? <div className="empty">No hay partidos aún.</div> : (
            <table className="tbl">
              <thead><tr><th>Partido</th><th>Competición</th><th>Temporada</th><th>Formación</th><th></th></tr></thead>
              <tbody>
                {data.map(a => (
                  <tr key={a.id}>
                    <td><strong>{a.equipo}</strong> vs {a.rival}</td>
                    <td style={{ color: "#6b8f71" }}>{a.competicion}</td>
                    <td style={{ color: "#6b8f71" }}>{a.temporada}</td>
                    <td><span style={{ fontFamily: "'Bebas Neue',sans-serif", color: "#a8ff3e" }}>{a.formacion}</span></td>
                    <td><div style={{ display: "flex", gap: 6 }}>
                      <button className="btn-edit" onClick={() => openEdit(a)}>Editar</button>
                      <button className="btn-del" onClick={() => del(a.id)}>Eliminar</button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {view === "nueva" && (
        <div className="card">
          <div className="card-title">{editing ? "EDITAR PARTIDO" : "NUEVO PARTIDO"}</div>
          <hr className="divider" />
          <div className="form-grid">
            <div className="inp-group">
              <label className="lbl">Equipo (en mayúsculas)</label>
              <input className="inp" placeholder="REAL MADRID" value={form.equipo} onChange={e => setForm(f => ({ ...f, equipo: e.target.value.toUpperCase() }))} />
            </div>
            <div className="inp-group">
              <label className="lbl">Rival</label>
              <input className="inp" placeholder="Atlético de Madrid" value={form.rival} onChange={e => setForm(f => ({ ...f, rival: e.target.value }))} />
            </div>
            <div className="inp-group">
              <label className="lbl">Competición</label>
              <input className="inp" placeholder="Champions League" value={form.competicion} onChange={e => setForm(f => ({ ...f, competicion: e.target.value }))} />
            </div>
            <div className="inp-group">
              <label className="lbl">Temporada</label>
              <input className="inp" placeholder="2015/16" value={form.temporada} onChange={e => setForm(f => ({ ...f, temporada: e.target.value }))} />
            </div>
            <div className="inp-group">
              <label className="lbl">Formación</label>
              <select className="sel" value={form.formacion} onChange={e => setForm(f => ({ ...f, formacion: e.target.value }))}>
                {["4-3-3","4-4-2","4-2-3-1","3-5-2","5-3-2","4-1-4-1"].map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="inp-group form-full">
              <label className="lbl">URL de la foto del partido (opcional)</label>
              <input className="inp" placeholder="https://... (enlace directo a imagen)" value={form.foto_url}
                onChange={e => setForm(f => ({ ...f, foto_url: e.target.value }))} />
              {form.foto_url && <img src={form.foto_url} alt="Preview" style={{ width: "100%", aspectRatio: "16 / 9", objectFit: "cover", borderRadius: 8, marginTop: 8, border: "2px solid #1e3d25", display: "block" }} />}
            </div>
          </div>
          <hr className="divider" />
          <div className="lbl" style={{ marginBottom: 12 }}>11 JUGADORES — añade alias / formas alternativas aceptadas</div>
          {form.jugadores.map((j, i) => (
            <div key={i} style={{ background: "#0a0a0f", border: "1px solid #1e3d25", borderRadius: 8, padding: 12, marginBottom: 10 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                <span style={{ fontFamily: "'Bebas Neue',sans-serif", color: "#6b8f71", minWidth: 24 }}>{i + 1}</span>
                <input className="inp" placeholder="Posición (POR, CB...)" value={j.pos} style={{ width: 90 }}
                  onChange={e => setJug(i, "pos", e.target.value.toUpperCase())} />
                <input className="inp" placeholder="Apellido principal" value={j.nombre}
                  onChange={e => setJug(i, "nombre", e.target.value)} />
              </div>
              <div className="lbl">Alias aceptados</div>
              <AliasEditor alias={j.alias} onChange={v => setJug(i, "alias", v)} />
            </div>
          ))}
          <div className="btn-row">
            <button className="btn-ghost" onClick={() => setView("lista")}>Cancelar</button>
            <button className="btn-add" onClick={save}>{editing ? "GUARDAR CAMBIOS" : "AÑADIR PARTIDO"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// JUGADORES
function SecJugadores({ data, setData }) {
  const [view, setView] = useState("lista");
  const [editing, setEditing] = useState(null);
  const [alert, setAlert] = useState(null);
  const emptyForm = { nombre: "", alias: [], pistaGeneral: "", pistas: ["", "", "", "", ""], foto_url: "" };
  const [form, setForm] = useState(emptyForm);

  const showAlert = (msg, type = "ok") => { setAlert({ msg, type }); setTimeout(() => setAlert(null), 2500); };
  const openNew = () => { setForm(emptyForm); setEditing(null); setView("nueva"); };
  const openEdit = (j) => { setForm({ ...j, alias: [...j.alias], pistas: [...j.pistas] }); setEditing(j.id); setView("nueva"); };

  const setPista = (i, v) => { const p = [...form.pistas]; p[i] = v; setForm(f => ({ ...f, pistas: p })); };

  const save = async () => {
    if (!form.nombre || !form.pistaGeneral || form.pistas.some(p => !p)) { showAlert("Completa todos los campos.", "ko"); return; }
    const payload = {
      nombre: form.nombre, alias: form.alias,
      pista_general: form.pistaGeneral, pistas: form.pistas,
      foto_url: form.foto_url || null,
    };
    if (editing) {
      const { error } = await supabase.from("jugadores_adivina").update(payload).eq("id", editing);
      if (error) { showAlert("Error: " + error.message, "ko"); return; }
      setData(d => d.map(j => j.id === editing ? { ...form, id: editing } : j));
      showAlert("Jugador actualizado.");
    } else {
      const { data: inserted, error } = await supabase.from("jugadores_adivina").insert(payload).select().single();
      if (error) { showAlert("Error: " + error.message, "ko"); return; }
      setData(d => [...d, { ...form, id: inserted.id }]);
      showAlert("Jugador añadido.");
    }
    setView("lista");
  };

  const del = async (id) => {
    if (!confirm("¿Eliminar?")) return;
    const { error } = await supabase.from("jugadores_adivina").delete().eq("id", id);
    if (error) { showAlert("Error: " + error.message, "ko"); return; }
    setData(d => d.filter(j => j.id !== id));
  };

  const PTS = [300, 200, 150, 100, 50];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div className="page-title">🔍 ADIVINA EL JUGADOR</div>
          <div className="page-sub">Banco de jugadores · {data.length} jugadores en total</div>
        </div>
        {view === "lista" && <button className="btn-add" onClick={openNew}>+ NUEVO JUGADOR</button>}
      </div>
      {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

      {view === "lista" && (
        <div className="card">
          {data.length === 0 ? <div className="empty">No hay jugadores aún.</div> : (
            <table className="tbl">
              <thead><tr><th>Jugador</th><th>Alias</th><th>Pista general</th><th></th></tr></thead>
              <tbody>
                {data.map(j => (
                  <tr key={j.id}>
                    <td><strong>{j.nombre}</strong></td>
                    <td><div className="alias-wrap">{j.alias.map((a, i) => <span key={i} className="alias-tag">{a}</span>)}</div></td>
                    <td style={{ color: "#6b8f71", fontSize: 12 }}>{j.pistaGeneral}</td>
                    <td><div style={{ display: "flex", gap: 6 }}>
                      <button className="btn-edit" onClick={() => openEdit(j)}>Editar</button>
                      <button className="btn-del" onClick={() => del(j.id)}>Eliminar</button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {view === "nueva" && (
        <div className="card">
          <div className="card-title">{editing ? "EDITAR JUGADOR" : "NUEVO JUGADOR"}</div>
          <hr className="divider" />
          <div className="inp-group">
            <label className="lbl">Nombre completo</label>
            <input className="inp" placeholder="Kylian Mbappé" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
          </div>
          <div className="inp-group">
            <label className="lbl">Alias y formas alternativas aceptadas</label>
            <AliasEditor alias={form.alias} onChange={v => setForm(f => ({ ...f, alias: v }))} />
          </div>
          <div className="inp-group">
            <label className="lbl">URL de la foto del jugador (opcional)</label>
            <input className="inp" placeholder="https://... (enlace directo a imagen)" value={form.foto_url}
              onChange={e => setForm(f => ({ ...f, foto_url: e.target.value }))} />
            {form.foto_url && <img src={form.foto_url} alt="Preview" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: "50%", marginTop: 8, border: "2px solid #1e3d25" }} />}
          </div>
          <div className="inp-group">
            <label className="lbl">Pista general</label>
            <input className="inp" placeholder="🌟 Delantero | Menos de 30 años" value={form.pistaGeneral} onChange={e => setForm(f => ({ ...f, pistaGeneral: e.target.value }))} />
          </div>
          <hr className="divider" />
          <div className="lbl" style={{ marginBottom: 12 }}>5 PISTAS PROGRESIVAS</div>
          {form.pistas.map((p, i) => (
            <div key={i} className="pista-row">
              <span className="pista-num">{i + 1}</span>
              <input className="inp" placeholder={`Pista ${i + 1} · vale ${PTS[i]} pts`} value={p}
                onChange={e => setPista(i, e.target.value)} />
            </div>
          ))}
          <div className="btn-row">
            <button className="btn-ghost" onClick={() => setView("lista")}>Cancelar</button>
            <button className="btn-add" onClick={save}>{editing ? "GUARDAR CAMBIOS" : "AÑADIR JUGADOR"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// COMBINAS
function SecCombinas({ data, setData }) {
  const [view, setView] = useState("lista");
  const [editing, setEditing] = useState(null);
  const [alert, setAlert] = useState(null);
  const emptyForm = { desc: "", validos: [] };
  const [form, setForm] = useState(emptyForm);

  const showAlert = (msg, type = "ok") => { setAlert({ msg, type }); setTimeout(() => setAlert(null), 2500); };
  const openNew = () => { setForm(emptyForm); setEditing(null); setView("nueva"); };
  const openEdit = (c) => { setForm({ ...c, validos: [...c.validos] }); setEditing(c.id); setView("nueva"); };

  const save = async () => {
    if (!form.desc || form.validos.length === 0) { showAlert("Añade la combinación y al menos un jugador válido.", "ko"); return; }
    const payload = { descripcion: form.desc, validos: form.validos };
    if (editing) {
      const { error } = await supabase.from("combinas").update(payload).eq("id", editing);
      if (error) { showAlert("Error: " + error.message, "ko"); return; }
      setData(d => d.map(c => c.id === editing ? { ...form, id: editing } : c));
      showAlert("Combinación actualizada.");
    } else {
      const { data: inserted, error } = await supabase.from("combinas").insert(payload).select().single();
      if (error) { showAlert("Error: " + error.message, "ko"); return; }
      setData(d => [...d, { ...form, id: inserted.id }]);
      showAlert("Combinación añadida.");
    }
    setView("lista");
  };

  const del = async (id) => {
    if (!confirm("¿Eliminar?")) return;
    const { error } = await supabase.from("combinas").delete().eq("id", id);
    if (error) { showAlert("Error: " + error.message, "ko"); return; }
    setData(d => d.filter(c => c.id !== id));
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div className="page-title">🔗 COMBINA</div>
          <div className="page-sub">Banco de combinaciones · {data.length} en total</div>
        </div>
        {view === "lista" && <button className="btn-add" onClick={openNew}>+ NUEVA COMBINACIÓN</button>}
      </div>
      {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

      {view === "lista" && (
        <div className="card">
          {data.length === 0 ? <div className="empty">No hay combinaciones aún.</div> : (
            <table className="tbl">
              <thead><tr><th>Combinación</th><th>Jugadores válidos</th><th></th></tr></thead>
              <tbody>
                {data.map(c => (
                  <tr key={c.id}>
                    <td><strong style={{ color: "#a8ff3e" }}>{c.desc}</strong></td>
                    <td><div className="alias-wrap">{c.validos.map((v, i) => <span key={i} className="alias-tag">{v}</span>)}</div></td>
                    <td><div style={{ display: "flex", gap: 6 }}>
                      <button className="btn-edit" onClick={() => openEdit(c)}>Editar</button>
                      <button className="btn-del" onClick={() => del(c.id)}>Eliminar</button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {view === "nueva" && (
        <div className="card">
          <div className="card-title">{editing ? "EDITAR COMBINACIÓN" : "NUEVA COMBINACIÓN"}</div>
          <hr className="divider" />
          <div className="inp-group">
            <label className="lbl">Descripción de la combinación</label>
            <input className="inp" placeholder="Ej: Balón de Oro + Barça" value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} />
            <div style={{ fontSize: 11, color: "#6b8f71", marginTop: 5 }}>Aparecerá tal cual en pantalla durante el juego</div>
          </div>
          <div className="inp-group">
            <label className="lbl">Jugadores válidos (escribe en minúsculas)</label>
            <AliasEditor alias={form.validos} onChange={v => setForm(f => ({ ...f, validos: v }))} />
            <div style={{ fontSize: 11, color: "#6b8f71", marginTop: 5 }}>Añade todos los jugadores que cumplan la combinación. El sistema comprobará si la respuesta del usuario coincide con alguno.</div>
          </div>
          <div className="btn-row">
            <button className="btn-ghost" onClick={() => setView("lista")}>Cancelar</button>
            <button className="btn-add" onClick={save}>{editing ? "GUARDAR CAMBIOS" : "AÑADIR COMBINACIÓN"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// USUARIOS (mock)
function SecUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("perfiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error) setUsuarios(data || []);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div>
      <div className="page-title">👥 USUARIOS</div>
      <div className="page-sub">Usuarios registrados en Goal Win · {usuarios.length} en total</div>
      <div className="card">
        {loading ? (
          <div className="empty">Cargando usuarios...</div>
        ) : usuarios.length === 0 ? (
          <div className="empty">Aún no hay usuarios registrados.</div>
        ) : (
          <table className="tbl">
            <thead><tr><th>Usuario</th><th>Puntos totales</th><th>Puntos semana</th><th>Racha</th><th>Registrado</th></tr></thead>
            <tbody>
              {usuarios.map((u, i) => (
                <tr key={i}>
                  <td><strong>{u.nombre}</strong></td>
                  <td><span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: "#a8ff3e" }}>{u.puntos_totales}</span></td>
                  <td>{u.puntos_semana}</td>
                  <td>🔥 {u.racha} días</td>
                  <td style={{ color: "#6b8f71", fontSize: 12 }}>{new Date(u.created_at).toLocaleDateString("es-ES")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function Admin() {
  const [checkingSession, setCheckingSession] = useState(true);
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(false);

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loginErr, setLoginErr] = useState("");

  const [sec, setSec] = useState("activar");
  const [juegosActivos, setJuegosActivos] = useState({ test: false, alineacion: false, jugador: false, combina: false });
  const [loadingData, setLoadingData] = useState(true);

  const [preguntas, setPreguntas] = useState([]);
  const [alineaciones, setAlineaciones] = useState([]);
  const [jugadores, setJugadores] = useState([]);
  const [combinas, setCombinas] = useState([]);

  // Comprueba si ya hay sesión activa (por ejemplo, al refrescar la página)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCheckingSession(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // Comprueba, contra la base de datos (no en el navegador), si este usuario
  // que ha iniciado sesión está en la tabla "admins". Esto es lo que impide que
  // cualquiera con una cuenta normal de Goal Win pueda entrar al panel.
  useEffect(() => {
    const checkAdmin = async () => {
      if (!session?.user) { setIsAdmin(false); return; }
      setCheckingAdmin(true);
      const { data } = await supabase.from("admins").select("user_id").eq("user_id", session.user.id).maybeSingle();
      setIsAdmin(!!data);
      setCheckingAdmin(false);
    };
    checkAdmin();
  }, [session]);

  // Carga todos los datos desde Supabase cuando se confirma que es admin
  useEffect(() => {
    if (!isAdmin) return;
    const loadAll = async () => {
      setLoadingData(true);

      const { data: pr } = await supabase.from("preguntas").select("*").order("created_at");
      setPreguntas((pr || []).map(p => ({ id: p.id, texto: p.texto, opts: p.opts, ans: p.ans, nivel: p.nivel })));

      const { data: al } = await supabase.from("alineaciones").select("*").order("created_at");
      setAlineaciones((al || []).map(a => ({
        id: a.id, equipo: a.equipo, rival: a.rival, competicion: a.competicion,
        temporada: a.temporada, formacion: a.formacion, jugadores: a.jugadores,
        foto_url: a.foto_url || "",
      })));

      const { data: ju } = await supabase.from("jugadores_adivina").select("*").order("created_at");
      setJugadores((ju || []).map(j => ({
        id: j.id, nombre: j.nombre, alias: j.alias || [], pistaGeneral: j.pista_general, pistas: j.pistas,
        foto_url: j.foto_url || "",
      })));

      const { data: co } = await supabase.from("combinas").select("*").order("created_at");
      setCombinas((co || []).map(c => ({ id: c.id, desc: c.descripcion, validos: c.validos })));

      const { data: ja } = await supabase.from("juegos_activos").select("*");
      if (ja) {
        const activos = {};
        ja.forEach(j => { activos[j.id] = j.activo; });
        setJuegosActivos(activos);
      }

      setLoadingData(false);
    };
    loadAll();
  }, [isAdmin]);

  const toggleJuego = async (id) => {
    const nuevoEstado = !juegosActivos[id];
    const { error } = await supabase.from("juegos_activos").update({ activo: nuevoEstado }).eq("id", id);
    if (!error) setJuegosActivos(a => ({ ...a, [id]: nuevoEstado }));
  };

  const handleLogin = async () => {
    setLoginErr("");
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    if (error) setLoginErr("Email o contraseña incorrectos.");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setIsAdmin(false);
  };

  // ── Pantallas de carga / login / sin permiso ──────────────────────────────
  if (checkingSession) return (
    <div style={{ background: "#0a0a0f", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{css}</style>
      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: "#a8ff3e", letterSpacing: 2 }}>CARGANDO...</div>
    </div>
  );

  if (!session) return (
    <div style={{ background: "#0a0a0f", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <style>{css}</style>
      <div style={{ width: "100%", maxWidth: 340, background: "#111d14", border: "1px solid #1e3d25", borderRadius: 14, padding: 32 }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: "#a8ff3e", letterSpacing: 2, marginBottom: 4 }}>PANEL ADMIN</div>
        <div style={{ fontSize: 12, color: "#6b8f71", marginBottom: 24 }}>Goal Win · Acceso restringido</div>
        {loginErr && <div className="alert alert-ko">{loginErr}</div>}
        <label className="lbl">Email</label>
        <input className="inp" type="email" placeholder="admin@goalwin.pro" value={email}
          onChange={e => setEmail(e.target.value)} style={{ marginBottom: 14 }} />
        <label className="lbl">Contraseña</label>
        <input className="inp" type="password" placeholder="••••••••" value={pw}
          onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()}
          style={{ marginBottom: 14 }} />
        <button className="btn-add" style={{ width: "100%" }} onClick={handleLogin}>ENTRAR</button>
      </div>
    </div>
  );

  if (checkingAdmin) return (
    <div style={{ background: "#0a0a0f", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{css}</style>
      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: "#a8ff3e", letterSpacing: 2 }}>COMPROBANDO PERMISOS...</div>
    </div>
  );

  if (!isAdmin) return (
    <div style={{ background: "#0a0a0f", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <style>{css}</style>
      <div style={{ width: "100%", maxWidth: 340, background: "#111d14", border: "1px solid #1e3d25", borderRadius: 14, padding: 32, textAlign: "center" }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, color: "#e74c3c", letterSpacing: 1, marginBottom: 10 }}>SIN PERMISO</div>
        <div style={{ fontSize: 13, color: "#6b8f71", marginBottom: 20 }}>Esta cuenta ha iniciado sesión correctamente, pero no tiene permisos de administrador.</div>
        <button className="btn-ghost" style={{ width: "100%" }} onClick={handleLogout}>Cerrar sesión</button>
      </div>
    </div>
  );

  if (loadingData) return (
    <div style={{ background: "#0a0a0f", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{css}</style>
      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: "#a8ff3e", letterSpacing: 2 }}>CARGANDO DATOS...</div>
    </div>
  );

  const navItems = [
    { id: "activar",      icon: "🎮", label: "Activar Juegos", count: null },
    { id: "preguntas",    icon: "✔",  label: "Test Diario",    count: preguntas.length },
    { id: "alineaciones", icon: "🏟", label: "Alineaciones",   count: alineaciones.length },
    { id: "jugadores",    icon: "⚽", label: "Jugadores",      count: jugadores.length },
    { id: "combinas",     icon: "🔍", label: "Combinas",       count: combinas.length },
    { id: "usuarios",     icon: "👥", label: "Usuarios",       count: null },
  ];

  return (
    <div className="admin">
      <style>{css}</style>
      <aside className="sidebar">
        <div className="sb-logo">ADMIN <span>PANEL</span></div>
        <div className="sb-tag">Contenido</div>
        {navItems.map(n => (
          <button key={n.id} className={`sb-btn ${sec === n.id ? "on" : ""}`} onClick={() => setSec(n.id)}>
            <span>{n.icon}</span>
            <span style={{ flex: 1 }}>{n.label}</span>
            {n.count !== null && <span style={{ fontSize: 11, background: "#1e3d25", borderRadius: 10, padding: "1px 7px", color: "#6b8f71" }}>{n.count}</span>}
          </button>
        ))}
        <div className="sb-stats">
          <div className="sb-stat">Total preguntas <span>{preguntas.length}</span></div>
          <div className="sb-stat">Total partidos <span>{alineaciones.length}</span></div>
          <div className="sb-stat">Total jugadores <span>{jugadores.length}</span></div>
          <div className="sb-stat">Total combinas <span>{combinas.length}</span></div>
          <button className="btn-ghost" style={{ width: "100%", marginTop: 10, fontSize: 12 }} onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </aside>
      <main className="content">
        {sec === "activar" && (
          <div>
            <div className="page-title">🎮 ACTIVAR JUEGOS</div>
            <div className="page-sub">Activa o desactiva cada juego cuando esté listo para los usuarios</div>
            {[
              { id: "test",      icon: "✔",  name: "Test Diario",           maxPts: 600 },
              { id: "alineacion",icon: "🏟", name: "Adivina la Alineación", maxPts: 200 },
              { id: "jugador",   icon: "⚽", name: "Adivina el Jugador",    maxPts: 300 },
              { id: "combina",   icon: "🔍", name: "Combina",               maxPts: 400 },
            ].map(j => (
              <div key={j.id} className="card" style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 22px" }}>
                <div style={{ fontSize: 32 }}>{j.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: "#f0ede6", letterSpacing: 1 }}>{j.name}</div>
                  <div style={{ fontSize: 12, color: "#6b8f71", marginTop: 2 }}>Máximo {j.maxPts} pts por día</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 13, color: juegosActivos[j.id] ? "#a8ff3e" : "#e74c3c", fontWeight: 600 }}>
                    {juegosActivos[j.id] ? "✔ ACTIVO" : "✖ INACTIVO"}
                  </span>
                  <button
                    onClick={() => toggleJuego(j.id)}
                    style={{
                      background: juegosActivos[j.id] ? "#e74c3c22" : "#a8ff3e22",
                      border: `1px solid ${juegosActivos[j.id] ? "#e74c3c" : "#a8ff3e"}`,
                      color: juegosActivos[j.id] ? "#e74c3c" : "#a8ff3e",
                      borderRadius: 8, padding: "8px 18px",
                      fontFamily: "'Bebas Neue',sans-serif", fontSize: 15,
                      cursor: "pointer", letterSpacing: 1,
                    }}
                  >
                    {juegosActivos[j.id] ? "DESACTIVAR" : "ACTIVAR"}
                  </button>
                </div>
              </div>
            ))}
            <div className="alert" style={{ background: "#1a2a4a44", border: "1px solid #4a7aaf44", color: "#88b8e8", marginTop: 8 }}>
              ℹ️ Cuando actives un juego aquí, aparecerá disponible para todos los usuarios en la web. Asegúrate de tener el contenido listo antes de activarlo.
            </div>
          </div>
        )}
        {sec === "preguntas"    && <SecPreguntas    data={preguntas}    setData={setPreguntas} />}
        {sec === "alineaciones" && <SecAlineaciones data={alineaciones} setData={setAlineaciones} />}
        {sec === "jugadores"    && <SecJugadores    data={jugadores}    setData={setJugadores} />}
        {sec === "combinas"     && <SecCombinas     data={combinas}     setData={setCombinas} />}
        {sec === "usuarios"     && <SecUsuarios />}
      </main>
    </div>
  );
}