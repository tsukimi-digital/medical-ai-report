/* ============================================================================
   Sonara — Doctor: Visit-to-Report + Patient explanation (Case C)
   ============================================================================ */
const { useState: useV, useEffect: useVE } = React;

/* radiological context (sticky) */
function RadContextCard({ report, t, lang, collapsed, onToggle }) {
  if (!report) return null;
  const D = window.SonaraData;
  const findings = report.findings || [];
  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div className="collapse-head between" onClick={onToggle} style={{ background: "var(--surface-2)" }}>
        <div className="row g8">
          <Icon name="fileText" size={16} style={{ color: "var(--accent-700)" }} />
          <div>
            <div className="h-card" style={{ fontSize: 12.5 }}>{t("radContext")}</div>
            <div className="faint" style={{ fontSize: 11 }}>{window.SonaraL(lang, report.examinationType)}</div>
          </div>
        </div>
        <Icon name="chevD" size={16} className={`chev${collapsed ? "" : " open"}`} style={{ transform: collapsed ? "rotate(-90deg)" : "rotate(0)" }} />
      </div>
      {!collapsed && (
        <div className="col" style={{ padding: 14, gap: 12 }}>
          {report.classification && (
            <div className="panel row g8" style={{ padding: "7px 11px", background: "var(--accent-tint)", borderColor: "var(--accent-tint-2)" }}>
              <Icon name="target" size={15} style={{ color: "var(--accent-800)" }} />
              <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--accent-800)" }}>{report.classification.name} {report.classification.value}</span>
            </div>
          )}
          <div>
            <div className="eyebrow" style={{ marginBottom: 5 }}>{t("impression")}</div>
            <div style={{ fontSize: 12.5, lineHeight: 1.5 }}>{report.impression}</div>
          </div>
          {report.radiologistRecommendations && (
            <div>
              <div className="eyebrow" style={{ marginBottom: 5 }}>{t("recommendations")}</div>
              <div style={{ fontSize: 12.5, lineHeight: 1.5 }}>{report.radiologistRecommendations}</div>
            </div>
          )}
          <div className="divider" />
          <div className="eyebrow" style={{ marginBottom: 1 }}>{t("findings")} · {findings.length}</div>
          <div className="col g6">
            {findings.slice(0, 5).map((f) => (
              <div key={f.id} className="row g8" style={{ alignItems: "flex-start" }}>
                <ConfBadge level={f.confidence} lang={lang} />
                <span style={{ fontSize: 12, lineHeight: 1.4 }}>{f.text}</span>
              </div>
            ))}
          </div>
          <div className="faint row g6" style={{ fontSize: 11, marginTop: 2 }}><Icon name="shield" size={12} />{report.approvedByName} · {report.approvedAt ? new Date(report.approvedAt).toLocaleDateString(lang === "pl" ? "pl-PL" : "en-GB") : ""}</div>
        </div>
      )}
    </div>
  );
}

/* doctor record simulation */
function VisitRecordSim({ lang, t, seed, onDone }) {
  const [state, setState] = useV("rec");
  const [sec, setSec] = useV(0);
  const [step, setStep] = useV(0);
  const steps = [t("transcribing"), t("processingClaude"), t("qualityReview")];

  useVE(() => { if (state !== "rec") return; const id = setInterval(() => setSec((s) => s + 1), 1000); return () => clearInterval(id); }, [state]);
  useVE(() => {
    if (state !== "run") return;
    if (step >= steps.length) { const id = setTimeout(onDone, 700); return () => clearTimeout(id); }
    const id = setTimeout(() => setStep((s) => s + 1), step === 0 ? 1600 : 1300);
    return () => clearTimeout(id);
  }, [state, step]);

  const mm = String(Math.floor(sec / 60)).padStart(2, "0");
  const ss = String(sec % 60).padStart(2, "0");

  if (state === "rec") {
    return (
      <div className="card card-pad-lg col center" style={{ gap: 20, padding: "44px 26px" }}>
        <div className="row g10"><span className="pulse-dot" /><span className="h-sec" style={{ color: "#be123c" }}>{t("recording")}</span></div>
        <div className="mono" style={{ fontSize: 34, fontWeight: 500 }}>{mm}:{ss}</div>
        <div className="wave">{Array.from({ length: 26 }).map((_, i) => <i key={i} style={{ animationDelay: `${(i % 7) * 0.08}s`, height: 6 + (i % 5) * 3 }} />)}</div>
        <div className="faint" style={{ fontSize: 12.5, textAlign: "center", maxWidth: 380 }}>{lang === "pl" ? "Nagrywanie całej rozmowy — AI rozróżni wypowiedzi lekarza i pacjenta." : "Recording the whole visit — AI will separate doctor and patient."}</div>
        <Btn variant="rec" size="lg" icon="dot" onClick={() => setState("run")}>{t("stopRec")}</Btn>
      </div>
    );
  }

  return (
    <div className="card card-pad-lg col g18 fade-in">
      <div className="row g10"><Icon name="sparkle" size={20} style={{ color: "var(--accent-700)" }} /><div className="h-sec grow">{t("analyzing")}</div><span className="badge badge-accent mono">CASE C</span></div>
      <div className="col g8">
        {steps.map((s, i) => {
          const st = i < step ? "done" : i === step ? "active" : "wait";
          return (
            <div key={i} className="row g10" style={{ opacity: st === "wait" ? 0.4 : 1, transition: "opacity .3s" }}>
              <div style={{ width: 24, height: 24, borderRadius: 99, flex: "none", display: "flex", alignItems: "center", justifyContent: "center", background: st === "done" ? "var(--ok-bg)" : st === "active" ? "var(--accent-tint)" : "var(--surface-2)", color: st === "done" ? "var(--ok-text)" : "var(--accent-700)" }}>
                {st === "done" ? <Icon name="check" size={14} /> : st === "active" ? <Icon name="loader" size={14} className="spin" /> : <span className="mono" style={{ fontSize: 11 }}>{i + 1}</span>}
              </div>
              <span style={{ fontSize: 13.5, fontWeight: st === "active" ? 600 : 500 }}>{s}</span>
            </div>
          );
        })}
      </div>
      {seed.rawTranscriptionPreview && (
        <div className="panel fade-in" style={{ overflow: "hidden" }}>
          <div className="row g8" style={{ padding: "9px 13px", background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
            <Icon name="waveform" size={15} style={{ color: "var(--accent-700)" }} /><span className="h-card" style={{ fontSize: 12.5 }}>{t("rawTranscript")}</span>
            <span className="badge badge-neutral" style={{ marginLeft: "auto" }}>Whisper · pl</span>
          </div>
          <div className="mono" style={{ padding: "12px 14px", fontSize: 12, lineHeight: 1.7, color: "var(--text-muted)" }}>{seed.rawTranscriptionPreview}</div>
        </div>
      )}
    </div>
  );
}

/* patient panel (editable draft) */
function EditableList({ items, onChange, lang, readonly, marker }) {
  if (readonly) {
    return (
      <div className="col g6">
        {items.map((k, i) => (
          <div key={i} className="row g8">{marker(i)}<span style={{ fontSize: 13 }}>{k}</span></div>
        ))}
      </div>
    );
  }
  const set = (i, v) => onChange(items.map((x, j) => j === i ? v : x));
  const add = () => onChange([...items, ""]);
  const remove = (i) => onChange(items.filter((_, j) => j !== i));
  return (
    <div className="col g6">
      {items.map((k, i) => (
        <div key={i} className="row g8" style={{ alignItems: "flex-start" }}>
          <div style={{ marginTop: 6 }}>{marker(i)}</div>
          <input className="input" value={k} style={{ fontSize: 13, padding: "6px 10px" }} onChange={(e) => set(i, e.target.value)} />
          <button className="iconbtn" style={{ width: 30, height: 30, flex: "none" }} title={lang === "pl" ? "Usuń" : "Remove"} onClick={() => remove(i)}><Icon name="trash" size={14} /></button>
        </div>
      ))}
      <button className="link row g6" style={{ fontSize: 12, marginTop: 2 }} onClick={add}><Icon name="plus" size={13} />{lang === "pl" ? "Dodaj pozycję" : "Add item"}</button>
    </div>
  );
}

function PatientDraft({ expl, setExpl, t, lang, readonly }) {
  const upd = (k, v) => setExpl({ ...expl, [k]: v });
  const dotMarker = (i) => <Icon name="dot" size={8} style={{ color: "var(--accent-600)", flex: "none" }} />;
  const numMarker = (i) => <div style={{ width: 18, height: 18, borderRadius: 99, background: "var(--accent-tint)", color: "var(--accent-800)", fontSize: 10.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>{i + 1}</div>;
  return (
    <div className="card" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div className="row g8" style={{ padding: "13px 16px", background: "var(--accent-tint)", borderBottom: "1px solid var(--accent-tint-2)" }}>
        <Icon name="heart" size={17} style={{ color: "var(--accent-800)" }} />
        <span className="h-card" style={{ color: "var(--accent-800)" }}>{t("patientPanel")}</span>
        {!readonly && <span className="badge badge-accent" style={{ marginLeft: "auto" }}><Icon name="edit" size={11} />{lang === "pl" ? "draft edytowalny" : "editable draft"}</span>}
      </div>
      <div className="col g16" style={{ padding: 18 }}>
        <div className="faint" style={{ fontSize: 11.5, lineHeight: 1.5, display: "flex", gap: 7 }}><Icon name="sparkle" size={13} style={{ flex: "none", marginTop: 1, color: "var(--accent-700)" }} />{t("patientPanelBadge")}</div>
        <div>
          <label className="field-label">{lang === "pl" ? "Podsumowanie" : "Summary"}</label>
          {readonly ? <div className="panel" style={{ padding: "10px 12px", fontSize: 13.5, lineHeight: 1.6, background: "var(--surface-2)" }}>{expl.plainLanguageSummary}</div>
            : <textarea className="textarea" rows={3} value={expl.plainLanguageSummary} onChange={(e) => upd("plainLanguageSummary", e.target.value)} />}
        </div>
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>{t("keyFindings")}</div>
          <EditableList items={expl.keyFindings} onChange={(v) => upd("keyFindings", v)} lang={lang} readonly={readonly} marker={dotMarker} />
        </div>
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>{t("nextSteps")}</div>
          <EditableList items={expl.nextSteps} onChange={(v) => upd("nextSteps", v)} lang={lang} readonly={readonly} marker={numMarker} />
        </div>
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>{t("followUp")}</div>
          {readonly
            ? (expl.followUp ? <div className="panel row g8" style={{ padding: "10px 12px", background: "var(--surface-2)" }}><Icon name="calendar" size={15} style={{ color: "var(--accent-700)", flex: "none" }} /><div style={{ fontSize: 12.5, fontWeight: 600 }}>{expl.followUp}</div></div> : null)
            : <div className="row g8"><Icon name="calendar" size={15} style={{ color: "var(--accent-700)", flex: "none", marginTop: 9 }} /><input className="input" value={expl.followUp || ""} style={{ fontSize: 13 }} onChange={(e) => upd("followUp", e.target.value)} /></div>}
        </div>
      </div>
    </div>
  );
}

const DIAG_PREFIX = { definitive: "", probable: "Prawdopodobnie", differential: "Różnicowo", possible: "Do wykluczenia" };

/* ===================================================== VISIT FLOW ======== */
function VisitFlow({ lang, t, user, nav, route, setToast }) {
  const D = window.SonaraData;
  const seed = route.caseKey ? D.CASE_C : null;
  const effective = seed || D.CASE_C;
  const patient = D.PATIENTS[effective.patientId];
  const radReport = effective.radiologicalReportId ? D.CASE_A_APPROVED : null;

  const [phase, setPhase] = useV(route.readonly ? "editor" : "form"); // form | record | editor
  const [collapsed, setCollapsed] = useV(false);
  const [selPatient, setSelPatient] = useV(seed ? patient : null);
  const [selReport, setSelReport] = useV(seed ? radReport : null);
  const [approved, setApproved] = useV(!!route.readonly);

  const [anamnesis, setAnamnesis] = useV(effective.anamnesis);
  const [diagnosis, setDiagnosis] = useV(effective.diagnosis);
  const [recs, setRecs] = useV(effective.recommendations);
  const [expl, setExpl] = useV(effective.patientExplanation);
  const [showSave, setShowSave] = useV(false);

  const readonly = approved;

  const doSave = () => { setApproved(true); setShowSave(false); window.scrollTo({ top: 0 }); setToast(lang === "pl" ? "Zatwierdzono raport i wersję dla pacjenta" : "Report and patient version approved"); };

  /* ---------- FORM ---------- */
  if (phase === "form") {
    const patients = Object.values(D.PATIENTS);
    const reports = [D.CASE_A_APPROVED, ...D.SEED_RAD_REPORTS.filter((r) => r.id !== "rad-A-appr")];
    return (
      <div className="page"><div className="page-narrow">
        <button className="link row g6" style={{ marginBottom: 14, fontSize: 13 }} onClick={() => nav({ name: "dashboard" })}><Icon name="arrowLeft" size={15} />{t("backToDash")}</button>
        <div className="row g10" style={{ marginBottom: 4 }}><div className="h-page">{t("visitTitle")}</div>{seed && <CaseChip k="C" />}</div>
        <div className="lead" style={{ marginBottom: 22 }}>{user.name}</div>

        <div className="card card-pad-lg col g20">
          <div>
            <label className="field-label">{t("selectPatient")}</label>
            <Combobox value={selPatient} onChange={setSelPatient} options={patients} placeholder={t("selectPatientPh")} emptyText={t("noResults")} getLabel={(p) => `${p.firstName} ${p.lastName}`}
              render={(p) => <div className="row g10"><div className="avatar" style={{ width: 28, height: 28, fontSize: 10 }}>{p.firstName[0]}{p.lastName[0]}</div><div><div style={{ fontWeight: 600, fontSize: 13 }}>{p.firstName} {p.lastName}</div><div className="faint mono" style={{ fontSize: 11 }}>{p.pesel} · {p.age} {t("patientAge")}</div></div></div>} />
          </div>
          <div>
            <label className="field-label">{t("selectRadReport")} <span className="opt">· {t("optional")}</span></label>
            <Combobox value={selReport} onChange={setSelReport} options={reports} placeholder={t("noRadReport")} emptyText={t("noResults")} getLabel={(r) => `${window.SonaraL(lang, r.examinationType)} · ${r.approvedAt ? r.approvedAt.slice(0, 10) : ""}`}
              render={(r) => <div className="grow"><div className="row g8"><Icon name="fileText" size={14} style={{ color: "var(--accent-700)" }} /><span style={{ fontWeight: 600, fontSize: 13 }}>{window.SonaraL(lang, r.examinationType)}</span></div><div className="faint" style={{ fontSize: 11, marginLeft: 22 }}>{D.PATIENTS[r.patientId].firstName} {D.PATIENTS[r.patientId].lastName} · {r.approvedByName}</div></div>} />
          </div>
          <Btn variant="primary" size="lg" icon="mic" className="btn-block" disabled={!selPatient} onClick={() => setPhase("record")}>{t("recordVisit")}</Btn>
        </div>
      </div></div>
    );
  }

  /* ---------- RECORD ---------- */
  if (phase === "record") {
    return <div className="page"><div className="page-narrow"><VisitRecordSim lang={lang} t={t} seed={effective} onDone={() => setPhase("editor")} /></div></div>;
  }

  /* ---------- EDITOR ---------- */
  const transcPartial = effective.transcriptionQuality === "partial" || effective.transcriptionQuality === "poor";
  return (
    <div className="page"><div className="page-xwide">
      <button className="link row g6" style={{ marginBottom: 14, fontSize: 13 }} onClick={() => nav({ name: "dashboard" })}><Icon name="arrowLeft" size={15} />{t("backToDash")}</button>
      <div className="row between wrap g16" style={{ marginBottom: 16 }}>
        <div className="row g12">
          <div className="avatar" style={{ width: 42, height: 42, fontSize: 15 }}>{patient?.firstName[0]}{patient?.lastName[0]}</div>
          <div>
            <div className="row g10"><span className="h-page" style={{ fontSize: 20 }}>{patient?.firstName} {patient?.lastName}</span><CaseChip k="C" /></div>
            <div className="faint" style={{ fontSize: 12.5 }}>{t("visitTitle")} · {user.name} · {patient?.age} {t("patientAge")}</div>
          </div>
        </div>
      </div>

      {approved ? <Banner kind="ok" icon="shield" title={`${t("approvedBadge")} — ${user.name}`}>{new Date().toLocaleString(lang === "pl" ? "pl-PL" : "en-GB")}</Banner>
        : <Banner kind="info" icon="sparkle">{t("aiDraftBadge")}</Banner>}

      <div style={{ display: "grid", gridTemplateColumns: "300px minmax(0,1fr)", gap: 20, marginTop: 18, alignItems: "start" }} className="visit-grid">
        {/* left rail: rad context + quality */}
        <div className="col g16" style={{ position: "sticky", top: 104 }}>
          <RadContextCard report={selReport || radReport} t={t} lang={lang} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
          <QualityPanel qc={effective.aiQualityCheck} t={t} lang={lang} />
        </div>

        {/* two panels */}
        <div className="col g16">
          {transcPartial && <Banner kind="warn" title={effective.transcriptionQuality === "poor" ? t("bTranscPoor") : t("bTranscPartial")}>{lang === "pl" ? "Sprawdź nagranie przed zatwierdzeniem." : "Check the recording before approving."}</Banner>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }} className="panels-grid">
            {/* medical report */}
            <div className="card" style={{ overflow: "hidden" }}>
              <div className="row g8" style={{ padding: "13px 16px", background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                <Icon name="stetho" size={17} style={{ color: "var(--accent-700)" }} /><span className="h-card">{t("medReport")}</span>
              </div>
              <div className="col g16" style={{ padding: 18 }}>
                <EditSection icon="user" title={t("anamnesis")} value={anamnesis} onChange={setAnamnesis} rows={5} readonly={readonly} />
                <div>
                  <div className="row g8" style={{ marginBottom: 8 }}><Icon name="clipboard" size={16} style={{ color: "var(--accent-700)" }} /><span className="h-card">{t("diagnosis")}</span>{DIAG_PREFIX[effective.diagnosisConfidence] && <span className="chip chip-dev">{lang === "pl" ? DIAG_PREFIX[effective.diagnosisConfidence] : effective.diagnosisConfidence}</span>}</div>
                  {readonly ? <div className="panel" style={{ padding: "11px 14px", fontSize: 13.5, lineHeight: 1.6, background: "var(--surface-2)" }}>{diagnosis}</div>
                    : <textarea className="textarea" rows={3} value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />}
                </div>
                <EditSection icon="check" title={t("recommendations")} value={recs} onChange={setRecs} rows={4} readonly={readonly} />
              </div>
            </div>

            {/* patient draft */}
            <PatientDraft expl={expl} setExpl={setExpl} t={t} lang={lang} readonly={readonly} />
          </div>

          {!approved && (
            <div className="card card-pad row between wrap g12">
              <div className="faint" style={{ fontSize: 12, maxWidth: 420, lineHeight: 1.5 }}>{lang === "pl" ? "Raport medyczny i wersja dla pacjenta zostaną zatwierdzone razem." : "The medical report and patient version will be approved together."}</div>
              <Btn variant="primary" size="lg" icon="shield" onClick={() => setShowSave(true)}>{t("saveApprove")}</Btn>
            </div>
          )}
        </div>
      </div>

      <Modal open={showSave} onClose={() => setShowSave(false)}>
        <div className="card-pad-lg">
          <div className="row g10" style={{ marginBottom: 12 }}><div style={{ width: 38, height: 38, borderRadius: 99, background: "var(--accent-tint)", color: "var(--accent-800)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="shield" size={20} /></div><span className="h-sec">{t("confirmVisitTitle")}</span></div>
          <div className="muted" style={{ fontSize: 13.5, lineHeight: 1.55, marginBottom: 20 }}>{t("confirmVisitBody")}</div>
          <div className="row g10" style={{ justifyContent: "flex-end" }}>
            <Btn variant="ghost" onClick={() => setShowSave(false)}>{t("cancel")}</Btn>
            <Btn variant="primary" icon="check" onClick={doSave}>{t("confirm")}</Btn>
          </div>
        </div>
      </Modal>
    </div></div>
  );
}

Object.assign(window, { VisitFlow });
