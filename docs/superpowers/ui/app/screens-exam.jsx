/* ============================================================================
   Sonara — Radiologist: New Examination form + AI generation simulation
   ============================================================================ */
const { useState: useEx, useEffect: useExE, useRef: useExR } = React;

function ModeButton({ icon, title, sub, onClick, disabled, hint, accent }) {
  return (
    <button className="card" disabled={disabled} onClick={onClick}
      style={{ padding: 16, textAlign: "left", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.55 : 1,
        display: "flex", flexDirection: "column", gap: 10, transition: "box-shadow .14s, transform .08s, border-color .14s",
        borderColor: accent ? "var(--accent-tint-2)" : "var(--border)" }}
      onMouseEnter={(e) => { if (disabled) return; e.currentTarget.style.boxShadow = "var(--sh-3)"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "var(--accent-600)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "var(--sh-1)"; e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = accent ? "var(--accent-tint-2)" : "var(--border)"; }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: accent ? "var(--accent)" : "var(--accent-tint)", color: accent ? "#fff" : "var(--accent-800)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={20} />
      </div>
      <div>
        <div className="h-card">{title}</div>
        <div className="faint" style={{ fontSize: 12 }}>{sub}</div>
      </div>
      {disabled && hint && <div className="faint" style={{ fontSize: 11, fontStyle: "italic" }}>{hint}</div>}
    </button>
  );
}

/* contextual fields per exam type */
function contextFor(type) {
  if (!type) return [];
  if (type.includes("ginekolog")) return ["cycle"];
  if (/jamy brzusznej|wątroby|pęcherzyka|trzustki|śledziony|nerek/.test(type)) return ["fasting"];
  return [];
}

function ExamForm({ lang, t, user, seed, onGenerate, nav }) {
  const { PATIENTS, EXAM_TYPES } = window.SonaraData;
  const patients = Object.values(PATIENTS);
  const [patient, setPatient] = useEx(seed ? PATIENTS[seed.patientId] : null);
  const [type, setType] = useEx(seed ? seed.examinationType : null);
  const [indication, setIndication] = useEx(seed ? seed.clinicalIndication : "");
  const [fasting, setFasting] = useEx(seed?.examinationContext?.fastingStatus === "fasting");
  const [cycle, setCycle] = useEx("");
  const [labVals, setLabVals] = useEx(seed?.examinationContext?.relevantLabValues?.map((l) => `${l.label} ${l.value} ${l.unit}`).join(", ") || "");
  const [comments, setComments] = useEx("");
  const hasImages = !!seed && (seed.analysisMode === "image" || seed.analysisMode === "multimodal" || seed.caseKey === "A" || seed.caseKey === "D");
  const hasVoice = !!seed && (seed.analysisMode === "voice" || seed.analysisMode === "multimodal");
  const imageCount = seed?.imageCount || (hasImages ? 3 : 0);
  const fields = contextFor(type);
  const ctxKeys = fields;

  const pLabel = (p) => `${p.firstName} ${p.lastName}`;

  return (
    <div className="page">
      <div className="page-narrow">
        <button className="link row g6" style={{ marginBottom: 14, fontSize: 13 }} onClick={() => nav({ name: "dashboard" })}>
          <Icon name="arrowLeft" size={15} />{t("backToDash")}
        </button>
        <div className="row g10" style={{ marginBottom: 4 }}>
          <div className="h-page">{t("newExamTitle")}</div>
          {seed?.caseKey && <CaseChip k={seed.caseKey} />}
        </div>
        <div className="lead" style={{ marginBottom: 22 }}>{user.name} · {new Date().toLocaleDateString(lang === "pl" ? "pl-PL" : "en-GB")}</div>

        <div className="card card-pad-lg col g20">
          {/* patient */}
          <div>
            <label className="field-label">{t("selectPatient")}</label>
            <Combobox value={patient} onChange={setPatient} options={patients} placeholder={t("selectPatientPh")} emptyText={t("noResults")}
              getLabel={pLabel}
              render={(p) => (
                <div className="row g10 grow">
                  <div className="avatar" style={{ width: 28, height: 28, fontSize: 10 }}>{p.firstName[0]}{p.lastName[0]}</div>
                  <div className="grow">
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{p.firstName} {p.lastName}</div>
                    <div className="faint mono" style={{ fontSize: 11 }}>{p.pesel} · {p.age} {t("patientAge")} · {p.gender === "F" ? t("female") : t("male")}</div>
                  </div>
                </div>
              )} />
            <button className="link row g6" style={{ fontSize: 12.5, marginTop: 8 }}><Icon name="userPlus" size={14} />{t("addPatient")}</button>
          </div>

          {/* exam type */}
          <div>
            <label className="field-label">{t("examType")}</label>
            <Combobox value={type} onChange={setType} options={EXAM_TYPES} placeholder={t("examTypePh")} emptyText={t("noResults")}
              getLabel={(o) => window.SonaraL(lang, o)} render={(o) => window.SonaraL(lang, o)} />
          </div>

          {/* contextual fields */}
          {ctxKeys.length > 0 && (
            <div className="panel card-pad fade-in" style={{ background: "var(--surface-2)", padding: 16 }}>
              <div className="eyebrow row g6" style={{ marginBottom: 12 }}><Icon name="flask" size={13} />{t("contextFields")}</div>
              <div className="col g14">
                {fields.includes("fasting") && (
                  <label className="row g10" style={{ cursor: "pointer" }}>
                    <input type="checkbox" className="checkbox" checked={fasting} onChange={(e) => setFasting(e.target.checked)} />
                    <span style={{ fontSize: 13.5 }}>{t("fasting")}</span>
                  </label>
                )}
                {fields.includes("cycle") && (
                  <div>
                    <label className="field-label">{t("cyclePhase")}</label>
                    <select className="select" value={cycle} onChange={(e) => setCycle(e.target.value)}>
                      <option value="">—</option>
                      <option>{lang === "pl" ? "folikularna" : "follicular"}</option>
                      <option>{lang === "pl" ? "lutealna" : "luteal"}</option>
                      <option>{lang === "pl" ? "menopauza" : "postmenopause"}</option>
                      <option>{lang === "pl" ? "ciąża" : "pregnancy"}</option>
                    </select>
                  </div>
                )}
                <div>
                  <label className="field-label">{t("labValues")} <span className="opt">· {t("optional")}</span></label>
                  <input className="input" value={labVals} onChange={(e) => setLabVals(e.target.value)} placeholder={t("labValuesPh")} />
                </div>
              </div>
            </div>
          )}

          {/* indication */}
          <div>
            <label className="field-label">{t("clinicalIndication")} <span className="opt">· {t("optional")}</span></label>
            <textarea className="textarea" rows={2} value={indication} onChange={(e) => setIndication(e.target.value)} placeholder={t("clinicalIndicationPh")} />
          </div>

          {/* upload */}
          <div>
            <label className="field-label">{t("uploadImages")} <span className="opt">· {t("optional")}</span></label>
            <UploadZone t={t} hasImages={hasImages} imageCount={imageCount} label={seed?.imageLabel || "USG"} />
          </div>

          {/* comments */}
          <div>
            <label className="field-label">{t("comments")} <span className="opt">· {t("optional")}</span></label>
            <textarea className="textarea" rows={2} value={comments} onChange={(e) => setComments(e.target.value)} placeholder={t("commentsPh")} />
          </div>
        </div>

        {/* generation modes */}
        <div style={{ marginTop: 22 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>{t("generateMode")}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            <ModeButton icon="image" title={t("genImage")} sub={t("genImageSub")} disabled={!patient || !type || !hasImages}
              onClick={() => onGenerate("image")} />
            <ModeButton icon="mic" title={t("genVoice")} sub={t("genVoiceSub")} disabled={!patient || !type}
              onClick={() => onGenerate("voice")} />
            <ModeButton icon="layers" title={t("genMulti")} sub={t("genMultiSub")} disabled={!patient || !type || !(hasImages && hasVoice)}
              hint={t("multiNeedsBoth")} accent={hasImages && hasVoice}
              onClick={() => onGenerate("multimodal")} />
          </div>
        </div>
      </div>
    </div>
  );
}

function UploadZone({ t, hasImages, imageCount, label }) {
  if (hasImages) {
    return (
      <div className="panel" style={{ padding: 14 }}>
        <div className="row g8 wrap">
          {Array.from({ length: imageCount }).map((_, i) => <UsgThumb key={i} idx={i} label={label} w={92} h={70} />)}
          <button className="panel center" style={{ width: 92, height: 70, flexDirection: "column", gap: 5, cursor: "pointer", color: "var(--text-faint)", background: "var(--surface-2)", borderStyle: "dashed" }}>
            <Icon name="plus" size={18} /><span style={{ fontSize: 11 }}>{t("uploadCta")}</span>
          </button>
        </div>
        <div className="faint" style={{ fontSize: 11.5, marginTop: 10 }}>{imageCount} / 5 · {t("uploadHint")}</div>
      </div>
    );
  }
  return (
    <button className="panel col center" style={{ padding: "26px 16px", cursor: "pointer", color: "var(--text-faint)", background: "var(--surface-2)", borderStyle: "dashed", width: "100%", gap: 8 }}>
      <Icon name="upload" size={22} />
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)" }}>{t("uploadCta")}</div>
      <div style={{ fontSize: 11.5 }}>{t("uploadHint")}</div>
    </button>
  );
}

/* ====================================================== GENERATION SIM === */
function GenerationSim({ lang, t, mode, seed, onDone }) {
  const advanced = seed.pipeline === "advanced";
  // image/multimodal: vision steps. voice: transcription steps.
  const steps = mode === "voice"
    ? [t("transcribing"), t("processingClaude"), t("qualityReview")]
    : mode === "multimodal"
      ? [t("visionExtract"), t("transcribing"), t("fusionStep"), t("qualityReview")]
      : advanced
        ? [t("visionExtract"), t("reportGen"), t("qualityReview")]
        : [t("visionExtract"), t("reportGen")];

  const [stepIdx, setStepIdx] = useEx(0);
  const [recState, setRecState] = useEx(mode === "voice" || mode === "multimodal" ? "rec" : "run"); // rec|run
  const [showRaw, setShowRaw] = useEx(false);
  const [recSec, setRecSec] = useEx(0);

  useExE(() => {
    if (recState !== "rec") return;
    const id = setInterval(() => setRecSec((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [recState]);

  useExE(() => {
    if (recState !== "run") return;
    if (mode !== "voice" && !showRaw) {
      const id = setTimeout(() => setShowRaw(true), 1100);
      return () => clearTimeout(id);
    }
  }, [recState, showRaw, mode]);

  useExE(() => {
    if (recState !== "run") return;
    if (stepIdx >= steps.length) { const id = setTimeout(onDone, 700); return () => clearTimeout(id); }
    const id = setTimeout(() => setStepIdx((i) => i + 1), stepIdx === 0 ? 1500 : 1300);
    return () => clearTimeout(id);
  }, [recState, stepIdx]);

  const mm = String(Math.floor(recSec / 60)).padStart(2, "0");
  const ss = String(recSec % 60).padStart(2, "0");

  if (recState === "rec") {
    return (
      <div className="page"><div className="page-narrow">
        <div className="card card-pad-lg col center" style={{ gap: 20, padding: "44px 26px" }}>
          <div className="row g10"><span className="pulse-dot" /><span className="h-sec" style={{ color: "#be123c" }}>{t("recording")}</span></div>
          <div className="mono" style={{ fontSize: 34, fontWeight: 500, letterSpacing: "0.04em" }}>{mm}:{ss}</div>
          <div className="wave">{Array.from({ length: 26 }).map((_, i) => <i key={i} style={{ animationDelay: `${(i % 7) * 0.08}s`, height: 6 + (i % 5) * 3 }} />)}</div>
          <div className="faint" style={{ fontSize: 12.5, textAlign: "center", maxWidth: 360 }}>
            {mode === "multimodal"
              ? (lang === "pl" ? "Nagrywanie dyktowania równolegle z analizą obrazów." : "Recording dictation alongside image analysis.")
              : (lang === "pl" ? "Mów naturalnie — AI ustrukturyzuje raport po zakończeniu." : "Speak naturally — AI will structure the report afterwards.")}
          </div>
          <Btn variant="rec" size="lg" icon="dot" onClick={() => { setRecState("run"); }}>{t("stopRec")}</Btn>
        </div>
      </div></div>
    );
  }

  const rawTranscript = seed.rawTranscriptionPreview;
  const showTranscriptPreview = (mode === "voice" || mode === "multimodal") && rawTranscript;

  return (
    <div className="page"><div className="page-narrow">
      <div className="card card-pad-lg col g20 fade-in">
        <div className="row g10">
          <Icon name="sparkle" size={20} style={{ color: "var(--accent-700)" }} />
          <div className="h-sec grow">{t("analyzing")}</div>
          <span className="badge badge-accent mono">{advanced ? "ADVANCED" : "TWO-STEP"}</span>
        </div>

        {/* pipeline steps */}
        <div className="col g8">
          {steps.map((s, i) => {
            const state = i < stepIdx ? "done" : i === stepIdx ? "active" : "wait";
            return (
              <div key={i} className="row g10" style={{ opacity: state === "wait" ? 0.4 : 1, transition: "opacity .3s" }}>
                <div style={{ width: 24, height: 24, borderRadius: 99, flex: "none", display: "flex", alignItems: "center", justifyContent: "center",
                  background: state === "done" ? "var(--ok-bg)" : state === "active" ? "var(--accent-tint)" : "var(--surface-2)",
                  color: state === "done" ? "var(--ok-text)" : "var(--accent-700)" }}>
                  {state === "done" ? <Icon name="check" size={14} /> : state === "active" ? <Icon name="loader" size={14} className="spin" /> : <span className="mono" style={{ fontSize: 11 }}>{i + 1}</span>}
                </div>
                <span style={{ fontSize: 13.5, fontWeight: state === "active" ? 600 : 500 }}>{s}</span>
              </div>
            );
          })}
        </div>

        {/* transcript preview (voice/multimodal) */}
        {showTranscriptPreview && (
          <div className="panel fade-in" style={{ overflow: "hidden" }}>
            <div className="row g8" style={{ padding: "9px 13px", background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
              <Icon name="waveform" size={15} style={{ color: "var(--accent-700)" }} />
              <span className="h-card" style={{ fontSize: 12.5 }}>{t("rawTranscript")}</span>
              <span className="badge badge-neutral" style={{ marginLeft: "auto" }}>Whisper · pl</span>
            </div>
            <div className="mono" style={{ padding: "12px 14px", fontSize: 12, lineHeight: 1.7, color: "var(--text-muted)" }}>{rawTranscript}</div>
          </div>
        )}

        {/* raw observations (image two-step) */}
        {mode !== "voice" && showRaw && seed.rawObservations && (
          <Collapse title={t("rawObs")} sub={t("rawObsSub")} icon="eye" defaultOpen={true}>
            <div className="row g8 wrap" style={{ padding: 14 }}>
              {seed.rawObservations.map((o, i) => (
                <span key={i} className="badge badge-neutral mono fade-in" style={{ fontSize: 11.5, fontWeight: 500, padding: "3px 9px" }}>{o}</span>
              ))}
            </div>
          </Collapse>
        )}
      </div>
    </div></div>
  );
}

/* ===================================================== EXAM FLOW WRAPPER === */
function ExamFlow({ lang, t, user, nav, route, setToast }) {
  const seed = route.caseKey ? window.SonaraData.GOLDEN[route.caseKey] : null;
  const [phase, setPhase] = useEx("form"); // form | gen
  const [mode, setMode] = useEx(null);

  // No seed: blank form (won't generate meaningful demo) — fall back to Case A seed for demo richness
  const effectiveSeed = seed || window.SonaraData.GOLDEN.A;

  const startGen = (m) => { setMode(m); setPhase("gen"); };
  const finishGen = () => {
    if (mode === "multimodal" && effectiveSeed.fusionResult) {
      nav({ name: "report", reportId: effectiveSeed.id, caseKey: route.caseKey, mode, showFusion: true });
    } else {
      nav({ name: "report", reportId: effectiveSeed.id, caseKey: route.caseKey, mode });
    }
  };

  if (phase === "gen") return <GenerationSim lang={lang} t={t} mode={mode} seed={effectiveSeed} onDone={finishGen} />;
  return <ExamForm lang={lang} t={t} user={user} seed={seed} onGenerate={startGen} nav={nav} />;
}

Object.assign(window, { ExamFlow });
