/* ============================================================================
   Sonara — Radiologist Report Editor (HERO) + Multimodal Fusion view
   ============================================================================ */
const { useState: useR, useEffect: useRE, useRef: useRR } = React;

/* ---------------------------------------------------------- evidence ----- */
function EvidenceModal({ open, onClose, finding, label, t, lang }) {
  if (!finding) return null;
  const ev = finding.evidence || {};
  const imgs = ev.imageIndexes || [];
  const frags = ev.transcriptFragments || [];
  const total = Math.max((label ? 3 : 0), ...(imgs.length ? imgs : [0]).map((x) => x + 1));
  return (
    <Modal open={open} onClose={onClose}>
      <div className="row between" style={{ padding: "16px 18px", borderBottom: "1px solid var(--border)" }}>
        <div className="row g8"><Icon name="eye" size={17} style={{ color: "var(--accent-700)" }} /><span className="h-card">{t("evidence")}</span></div>
        <button className="iconbtn" onClick={onClose}><Icon name="x" size={16} /></button>
      </div>
      <div className="card-pad col g16">
        <div className="panel" style={{ padding: 12, background: "var(--surface-2)" }}>
          <div className="faint" style={{ fontSize: 11.5, marginBottom: 4 }}>{finding.anatomicalLocation}</div>
          <div style={{ fontSize: 13.5 }}>{finding.text}</div>
        </div>
        {imgs.length > 0 && label && (
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>{t("evidenceImages")}</div>
            <div className="row g8 wrap">
              {Array.from({ length: total }).map((_, i) => (
                <UsgThumb key={i} idx={i} label={label} w={96} h={74} lit={imgs.includes(i)} />
              ))}
            </div>
            <div className="faint" style={{ fontSize: 11.5, marginTop: 8 }}>
              {lang === "pl" ? "Podświetlone: źródło znaleziska" : "Highlighted: finding source"} ({imgs.map((i) => String(i + 1).padStart(2, "0")).join(", ")})
            </div>
          </div>
        )}
        {frags.length > 0 && (
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>{t("evidenceTranscript")}</div>
            {frags.map((f, i) => (
              <div key={i} className="panel mono" style={{ padding: "10px 12px", fontSize: 12, lineHeight: 1.6, color: "var(--text-muted)", borderLeft: "3px solid var(--accent-600)" }}>„{f}”</div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------- finding card ---- */
const CONF_CYCLE = { high: "medium", medium: "low", low: "high" };

function FindingCard({ f, lang, t, onEvidence, edited, onEdit, onUpdate, low, onMove, onRemove, readonly }) {
  const [editing, setEditing] = useR(false);
  const [text, setText] = useR(f.text);
  const [editLoc, setEditLoc] = useR(false);
  const [loc, setLoc] = useR(f.anatomicalLocation || "");
  const hasEv = f.evidence && ((f.evidence.imageIndexes && f.evidence.imageIndexes.length) || (f.evidence.transcriptFragments && f.evidence.transcriptFragments.length));
  const cycleConf = () => { onUpdate(f.id, { confidence: CONF_CYCLE[f.confidence] || "high" }); onEdit(f.id); };
  const toggleDev = () => { onUpdate(f.id, { isDeviation: !f.isDeviation }); onEdit(f.id); };
  return (
    <div className="panel" style={{ padding: "12px 14px", borderLeft: `3px solid ${low ? "var(--low-bd)" : f.isDeviation ? "var(--med-bd)" : "var(--border-strong)"}` }}>
      <div className="row between g10" style={{ marginBottom: 7 }}>
        <div className="row g8 wrap">
          {edited && <span className="chip chip-edit"><Icon name="edit" size={11} />{t("edited")}</span>}
          {readonly
            ? <ConfBadge level={f.confidence} lang={lang} />
            : <button className="badge-btn" title={t("editConfHint")} onClick={cycleConf}><ConfBadge level={f.confidence} lang={lang} /><Icon name="chevD" size={11} style={{ opacity: 0.5 }} /></button>}
          {readonly
            ? (f.isDeviation ? <span className="chip chip-dev">{t("deviation")}</span> : <span className="chip chip-norm">{t("normal")}</span>)
            : <button className="chip-btn" title={t("editDevHint")} onClick={toggleDev}>{f.isDeviation ? <span className="chip chip-dev">{t("deviation")}</span> : <span className="chip chip-norm">{t("normal")}</span>}</button>}
          {editLoc && !readonly
            ? <input className="input" autoFocus value={loc} style={{ fontSize: 11.5, padding: "2px 7px", width: 200, height: 24 }}
                onChange={(e) => setLoc(e.target.value)}
                onBlur={() => { setEditLoc(false); if (loc !== f.anatomicalLocation) { onUpdate(f.id, { anatomicalLocation: loc }); onEdit(f.id); } }}
                onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()} />
            : <button className="loc-btn faint" disabled={readonly} title={readonly ? "" : t("editLocHint")} onClick={() => setEditLoc(true)} style={{ fontSize: 11.5 }}>{f.anatomicalLocation}{!readonly && <Icon name="edit" size={10} style={{ opacity: 0.45, marginLeft: 4 }} />}</button>}
        </div>
        {!readonly && (
          <div className="row g4">
            {hasEv && <button className="iconbtn" title={t("source")} onClick={() => onEvidence(f)} style={{ width: 26, height: 26 }}><Icon name="eye" size={15} /></button>}
            <button className="iconbtn" title={t("editText")} onClick={() => setEditing(!editing)} style={{ width: 26, height: 26, background: editing ? "var(--accent-tint)" : "transparent", color: editing ? "var(--accent-800)" : "var(--text-muted)" }}><Icon name="edit" size={14} /></button>
          </div>
        )}
        {readonly && hasEv && <button className="iconbtn" title={t("source")} onClick={() => onEvidence(f)} style={{ width: 26, height: 26 }}><Icon name="eye" size={15} /></button>}
      </div>
      {editing ? (
        <textarea className="textarea" rows={2} value={text} autoFocus
          onChange={(e) => setText(e.target.value)}
          onBlur={() => { setEditing(false); if (text !== f.text) { onUpdate(f.id, { text }); onEdit(f.id); } }}
          style={{ fontSize: 13.5 }} />
      ) : (
        <div style={{ fontSize: 13.5, lineHeight: 1.5, cursor: readonly ? "default" : "text" }} onClick={() => !readonly && setEditing(true)}>{text}</div>
      )}
      {low && !readonly && (
        <div className="row g8" style={{ marginTop: 10 }}>
          <Btn size="xs" variant="secondary" icon="arrowUp" onClick={() => onMove(f.id)}>{t("moveToFormal")}</Btn>
          <Btn size="xs" variant="ghost" icon="trash" onClick={() => onRemove(f.id)}>{t("remove")}</Btn>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------ editable section -- */
function EditSection({ icon, title, value, onChange, rows = 3, readonly, accent }) {
  return (
    <div>
      <div className="row g8" style={{ marginBottom: 8 }}>
        <Icon name={icon} size={16} style={{ color: accent ? "var(--accent-700)" : "var(--text-muted)" }} />
        <span className="h-card">{title}</span>
      </div>
      {readonly
        ? <div className="panel" style={{ padding: "11px 14px", fontSize: 13.5, lineHeight: 1.6, whiteSpace: "pre-wrap", background: "var(--surface-2)" }}>{value || "—"}</div>
        : <textarea className="textarea" rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />}
    </div>
  );
}

/* ------------------------------------------------- AI quality check panel - */
function QualityPanel({ qc, t, lang }) {
  if (!qc) return null;
  const st = QC_STATUS[qc.status];
  const [open, setOpen] = useR(false);
  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div className="row g8" style={{ padding: "12px 14px", background: `var(--${st.kind === "ok" ? "ok" : st.kind === "warn" ? "warn" : "crit"}-bg)`, borderBottom: "1px solid var(--border)" }}>
        <Icon name={st.icon} size={17} style={{ color: `var(--${st.kind === "ok" ? "ok" : st.kind === "warn" ? "warn" : "crit"}-text)` }} />
        <div className="grow">
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-faint)" }}>{t("qualityCheck")}</div>
          <div style={{ fontWeight: 600, fontSize: 13.5, color: `var(--${st.kind === "ok" ? "ok" : st.kind === "warn" ? "warn" : "crit"}-text)` }}>{t(st.key)}</div>
        </div>
      </div>
      <div className="col" style={{ padding: "10px 14px", gap: 9 }}>
        <div className="faint" style={{ fontSize: 12, lineHeight: 1.5 }}>{qc.summary}</div>
        <div className="divider" />
        {qc.checks.map((c, i) => (
          <div key={i} className="row g8" style={{ alignItems: "flex-start" }}>
            <Icon name={QC_ICON[c.status]} size={15} style={{ color: QC_COLOR[c.status], flex: "none", marginTop: 1 }} />
            <span style={{ fontSize: 12.5, lineHeight: 1.45 }}>{c.message}</span>
          </div>
        ))}
        {(qc.autoCorrections.length > 0 || qc.unresolvedItems.length > 0) && (
          <>
            <button className="link row g6" style={{ fontSize: 12, marginTop: 2 }} onClick={() => setOpen(!open)}>
              <Icon name="chevR" size={13} className={`chev${open ? " open" : ""}`} />
              {lang === "pl" ? "Szczegóły korekt" : "Correction details"}
            </button>
            {open && (
              <div className="fade-in col g10" style={{ paddingLeft: 4 }}>
                {qc.autoCorrections.length > 0 && (
                  <div>
                    <div className="eyebrow" style={{ marginBottom: 5 }}>{t("autoCorrections")}</div>
                    {qc.autoCorrections.map((a, i) => <div key={i} className="row g6" style={{ fontSize: 12, marginBottom: 3 }}><Icon name="check" size={13} style={{ color: "var(--ok-text)", flex: "none", marginTop: 2 }} /><span>{a}</span></div>)}
                  </div>
                )}
                {qc.unresolvedItems.length > 0 && (
                  <div>
                    <div className="eyebrow" style={{ marginBottom: 5 }}>{t("unresolved")}</div>
                    {qc.unresolvedItems.map((a, i) => <div key={i} className="row g6" style={{ fontSize: 12, marginBottom: 3 }}><Icon name="alert" size={13} style={{ color: "var(--warn-text)", flex: "none", marginTop: 2 }} /><span>{a}</span></div>)}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ----------------------------------------------------- AI suggestions ---- */
function SuggestionsBlock({ suggestions, t, lang, onAdd, added, readonly }) {
  if (!suggestions || !suggestions.length) return null;
  const diffs = suggestions.filter((s) => s.type === "differential_diagnosis");
  const obs = suggestions.filter((s) => s.type !== "differential_diagnosis");
  const Item = ({ s }) => (
    <div className="panel" style={{ padding: "12px 14px" }}>
      <div className="row between g10" style={{ marginBottom: 5 }}>
        <div className="row g8"><span className="h-card" style={{ fontSize: 13 }}>{s.title}</span><ConfBadge level={s.confidence} lang={lang} /></div>
        {s.canInsertIntoReport && !readonly && (
          added.includes(s.id)
            ? <span className="badge badge-approved"><Icon name="check" size={12} />{t("added")}</span>
            : <Btn size="xs" variant="secondary" icon="plus" onClick={() => onAdd(s)}>{t("addToReport")}</Btn>
        )}
      </div>
      <div className="muted" style={{ fontSize: 12.5, lineHeight: 1.5 }}>{s.rationale}</div>
    </div>
  );
  return (
    <div className="card card-pad" style={{ background: "var(--surface-2)" }}>
      <div className="row g8" style={{ marginBottom: 4 }}>
        <Icon name="sparkle" size={17} style={{ color: "var(--accent-700)" }} />
        <span className="h-sec">{t("aiSuggestions")}</span>
      </div>
      <div className="faint" style={{ fontSize: 12, marginBottom: 14, lineHeight: 1.5 }}>{t("aiSuggestionsHint")}</div>
      {diffs.length > 0 && <>
        <div className="eyebrow row g6" style={{ marginBottom: 8 }}><Icon name="target" size={13} />{t("diffDx")}</div>
        <div className="col g8" style={{ marginBottom: obs.length ? 16 : 0 }}>{diffs.map((s) => <Item key={s.id} s={s} />)}</div>
      </>}
      {obs.length > 0 && <>
        <div className="eyebrow row g6" style={{ marginBottom: 8 }}><Icon name="info" size={13} />{t("addObs")}</div>
        <div className="col g8">{obs.map((s) => <Item key={s.id} s={s} />)}</div>
      </>}
    </div>
  );
}

/* =========================================================== FUSION ====== */
function FusionView({ fr, t, lang, onContinue, label }) {
  const Col = ({ kind, title, sub, items, icon, emptyOk }) => (
    <div className="card" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div className="row g8" style={{ padding: "12px 14px", background: `var(--${kind}-bg)`, borderBottom: "1px solid var(--border)" }}>
        <Icon name={icon} size={16} style={{ color: `var(--${kind}-text)` }} />
        <div className="grow"><div className="h-card" style={{ fontSize: 13, color: `var(--${kind}-text)` }}>{title}</div></div>
        <span className="badge" style={{ background: "var(--surface)", color: `var(--${kind}-text)`, borderColor: "var(--border)" }}>{items.length}</span>
      </div>
      <div className="faint" style={{ fontSize: 11.5, padding: "8px 14px 4px" }}>{sub}</div>
      <div className="col g8" style={{ padding: "4px 14px 14px" }}>
        {items.length === 0 ? <div className="faint" style={{ fontSize: 12.5, padding: "8px 0" }}>{emptyOk ? (lang === "pl" ? "Brak — pełna zgodność." : "None — full agreement.") : "—"}</div>
          : items.map((f, i) => (
            <div key={i} className="panel" style={{ padding: "9px 12px" }}>
              <div className="row g8" style={{ marginBottom: 4 }}><ConfBadge level={f.confidence} lang={lang} /><span className="faint" style={{ fontSize: 11 }}>{f.anatomicalLocation}</span></div>
              <div style={{ fontSize: 13 }}>{f.text}</div>
            </div>
          ))}
      </div>
    </div>
  );
  return (
    <div className="page"><div className="page-wide">
      <div className="row g10" style={{ marginBottom: 4 }}>
        <Icon name="layers" size={21} style={{ color: "var(--accent-700)" }} />
        <div className="h-page">{t("fusionTitle")}</div>
      </div>
      <div className="lead" style={{ marginBottom: 22 }}>{t("fusionSub")}</div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 14, marginBottom: 16 }} className="stagger">
        <Col kind="ok" title={t("confirmed")} sub={t("confirmedSub")} items={fr.confirmedFindings} icon="checkCircle" emptyOk />
        <Col kind="warn" title={t("imageOnly")} sub={t("imageOnlySub")} items={fr.imageOnlyFindings} icon="image" emptyOk />
        <Col kind="warn" title={t("speechOnly")} sub={t("speechOnlySub")} items={fr.speechOnlyFindings} icon="mic" emptyOk />
      </div>

      {fr.conflicts.length > 0 && (
        <div className="card" style={{ overflow: "hidden", borderColor: "var(--crit-bd)" }}>
          <div className="row g8" style={{ padding: "13px 16px", background: "var(--crit-bg)", borderBottom: "1px solid var(--crit-bd)" }}>
            <Icon name="alertCircle" size={18} style={{ color: "var(--crit-text)" }} />
            <span className="h-sec" style={{ color: "var(--crit-text)" }}>{t("conflicts")}</span>
            <span className="faint" style={{ fontSize: 12 }}>· {t("conflictsSub")}</span>
          </div>
          {fr.conflicts.map((c, i) => (
            <div key={i} className="card-pad col g12">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="panel" style={{ padding: 12 }}><div className="eyebrow row g6" style={{ marginBottom: 6 }}><Icon name="mic" size={12} />{t("speechClaim")}</div><div style={{ fontSize: 13 }}>{c.speechClaim}</div></div>
                <div className="panel" style={{ padding: 12 }}><div className="eyebrow row g6" style={{ marginBottom: 6 }}><Icon name="image" size={12} />{t("imageEvidence")}</div><div style={{ fontSize: 13 }}>{c.imageEvidence}</div></div>
              </div>
              <Banner kind="warn" icon="sparkle" title={t("aiNote")}>{c.note}</Banner>
            </div>
          ))}
        </div>
      )}

      <div className="row" style={{ justifyContent: "flex-end", marginTop: 22 }}>
        <Btn variant="primary" size="lg" iconR="arrowRight" onClick={onContinue}>{t("continueToEditor")}</Btn>
      </div>
    </div></div>
  );
}

/* ==================================================== REPORT EDITOR ====== */
function resolveReport(route) {
  const D = window.SonaraData;
  if (route.caseKey && D.GOLDEN[route.caseKey]) return { ...D.GOLDEN[route.caseKey] };
  if (route.reportId === "rad-A-appr") return { ...D.CASE_A_APPROVED };
  const row = D.RAD_EXAM_ROWS.find((r) => r.id === route.reportId);
  if (row) return { id: row.id, patientId: row.patientId, examinationType: row.type, analysisMode: row.mode, status: row.status, findings: [], lowConfidenceFindings: [], impression: row.summary, aiSuggestions: [], minimal: true };
  return { ...D.CASE_A };
}

function ReportEditor({ lang, t, user, nav, route, setToast }) {
  const D = window.SonaraData;
  const base = resolveReport(route);
  const patient = D.PATIENTS[base.patientId];
  const label = base.imageLabel;

  const [showFusion, setShowFusion] = useR(!!route.showFusion && !!base.fusionResult);
  const [approved, setApproved] = useR(base.status === "approved" || !!route.readonly);
  const readonly = approved;

  const [findings, setFindings] = useR(base.findings || []);
  const [lowFindings, setLowFindings] = useR(base.lowConfidenceFindings || []);
  const [impression, setImpression] = useR(base.impression || "");
  const [limitations, setLimitations] = useR(base.imagingLimitations || "");
  const [recs, setRecs] = useR(base.radiologistRecommendations || "");
  const [edited, setEdited] = useR([]);
  const [added, setAdded] = useR([]);
  const [evidenceF, setEvidenceF] = useR(null);
  const [showApprove, setShowApprove] = useR(false);
  const [tab, setTab] = useR("report"); // report | patient
  const [patientExpl, setPatientExpl] = useR(base.patientExplanation || null);
  const [genExpl, setGenExpl] = useR(false);

  const markEdited = (id) => setEdited((e) => e.includes(id) ? e : [...e, id]);
  const updateFinding = (id, patch) => {
    setFindings((fs) => fs.map((x) => x.id === id ? { ...x, ...patch } : x));
    setLowFindings((ls) => ls.map((x) => x.id === id ? { ...x, ...patch } : x));
  };
  const moveToFormal = (id) => { const f = lowFindings.find((x) => x.id === id); if (!f) return; setLowFindings((l) => l.filter((x) => x.id !== id)); setFindings((fs) => [...fs, { ...f }]); };
  const removeLow = (id) => setLowFindings((l) => l.filter((x) => x.id !== id));
  const addSuggestion = (s) => {
    setAdded((a) => [...a, s.id]);
    if (s.type === "differential_diagnosis") setImpression((v) => v + (v ? "\n\n" : "") + `Różnicowo: ${s.title}.`);
    else setRecs((v) => v + (v ? "\n" : "") + `${s.title}: ${s.rationale}`);
    setToast(lang === "pl" ? "Dodano do raportu" : "Added to report");
  };

  const canApprove = findings.length > 0 || impression.trim().length > 0;
  const srcLabel = base.analysisMode === "voice" ? t("srcVoice") : base.analysisMode === "multimodal" ? t("srcMulti") : t("srcImage");

  const doApprove = () => {
    setApproved(true); setShowApprove(false); window.scrollTo({ top: 0 });
    setToast(lang === "pl" ? "Raport zatwierdzony" : "Report approved");
  };

  const generatePatientExpl = () => {
    setGenExpl(true);
    setTimeout(() => {
      setGenExpl(false);
      setPatientExpl(THYROID_EXPL);
      setTab("patient");
    }, 1900);
  };

  if (showFusion) {
    return <FusionView fr={base.fusionResult} t={t} lang={lang} label={label} onContinue={() => setShowFusion(false)} />;
  }

  const subBanner = base.imageQuality === "suboptimal";
  const nonDiag = base.imageQuality === "non_diagnostic";

  return (
    <div className="page"><div className="page-xwide">
      {/* header */}
      <button className="link row g6" style={{ marginBottom: 14, fontSize: 13 }} onClick={() => nav({ name: "dashboard" })}>
        <Icon name="arrowLeft" size={15} />{t("backToDash")}
      </button>
      <div className="row between wrap g16" style={{ marginBottom: 16 }}>
        <div className="row g12">
          <div className="avatar" style={{ width: 42, height: 42, fontSize: 15 }}>{patient?.firstName[0]}{patient?.lastName[0]}</div>
          <div>
            <div className="row g10 wrap">
              <span className="h-page" style={{ fontSize: 20 }}>{patient?.firstName} {patient?.lastName}</span>
              {base.caseKey && <CaseChip k={base.caseKey} />}
            </div>
            <div className="faint" style={{ fontSize: 12.5 }}>
              {window.SonaraL(lang, base.examinationType)} · {patient?.age} {t("patientAge")} · {patient?.gender === "F" ? t("female") : t("male")} · <span className="mono">{patient?.pesel}</span>
            </div>
          </div>
        </div>
        <div className="row g10">
          {base.classification && (
            <div className="panel row g8" style={{ padding: "7px 12px", background: "var(--accent-tint)", borderColor: "var(--accent-tint-2)", whiteSpace: "nowrap" }}>
              <Icon name="target" size={16} style={{ color: "var(--accent-800)", flex: "none" }} />
              <div>
                <div className="mono" style={{ fontSize: 11, color: "var(--accent-800)", fontWeight: 600 }}>{base.classification.name}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent-800)" }}>{base.classification.value} <span style={{ fontWeight: 400, fontSize: 11.5 }}>· {window.SonaraL(lang, base.classification.label)}</span></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* provenance badge */}
      {approved ? (
        <Banner kind="ok" icon="shield" title={`${t("approvedBadge")} — ${base.approvedByName || user.name}`}>
          {new Date(base.approvedAt || Date.now()).toLocaleString(lang === "pl" ? "pl-PL" : "en-GB")} · {t("approvedSource")}: {srcLabel}
        </Banner>
      ) : (
        <Banner kind="info" icon="sparkle">{t("aiDraftBadge")}</Banner>
      )}

      {/* quality banners */}
      {subBanner && <div style={{ marginTop: 12 }}><Banner kind="warn" title={t("bSuboptimal")}>{(base.qualityIssues || []).join(", ")}. {lang === "pl" ? "Wyniki mogą być ograniczone." : "Results may be limited."}</Banner></div>}
      {nonDiag && <div style={{ marginTop: 12 }}><Banner kind="crit" title={t("bNonDiagnostic")} action={<Btn size="sm" variant="danger">{t("continueNoAi")}</Btn>}>{(base.qualityIssues || []).join(", ")}.</Banner></div>}

      {/* approved → tabs */}
      {approved && patientExpl && (
        <div className="tabs" style={{ marginTop: 18 }}>
          <div className={`tab${tab === "report" ? " on" : ""}`} onClick={() => setTab("report")}>{t("formalReport")}</div>
          <div className={`tab${tab === "patient" ? " on" : ""}`} onClick={() => setTab("patient")}>{t("forPatient")}</div>
        </div>
      )}

      {tab === "patient" && patientExpl ? (
        <div style={{ marginTop: 18 }}><PatientExplView expl={patientExpl} t={t} lang={lang} /></div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 340px", gap: 22, marginTop: 18, alignItems: "start" }} className="report-grid">
          {/* main column */}
          <div className="col g22" style={{ gap: 22 }}>
            <div className="card card-pad-lg col g20">
              <div className="row g8"><Icon name="fileText" size={18} style={{ color: "var(--accent-700)" }} /><span className="h-sec">{t("formalReport")}</span></div>

              {/* findings */}
              <div>
                <div className="eyebrow" style={{ marginBottom: 9 }}>{t("findings")} · {findings.length}</div>
                <div className="col g8">
                  {findings.map((f) => <FindingCard key={f.id} f={f} lang={lang} t={t} readonly={readonly} edited={edited.includes(f.id)} onEdit={markEdited} onUpdate={updateFinding} onEvidence={setEvidenceF} />)}
                  {findings.length === 0 && <div className="faint" style={{ fontSize: 13, padding: 8 }}>—</div>}
                </div>
              </div>

              {/* needs verification */}
              {lowFindings.length > 0 && (
                <div className="panel" style={{ padding: 14, background: "var(--low-bg)", borderColor: "var(--low-bd)" }}>
                  <div className="row g8" style={{ marginBottom: 6 }}><Icon name="alertCircle" size={16} style={{ color: "var(--low-text)" }} /><span className="h-card" style={{ color: "var(--low-text)" }}>{t("needsVerification")} · {lowFindings.length}</span></div>
                  <div className="faint" style={{ fontSize: 12, marginBottom: 12, color: "var(--low-text)", opacity: 0.85 }}>{t("needsVerificationHint")}</div>
                  <div className="col g8">
                    {lowFindings.map((f) => <FindingCard key={f.id} f={f} lang={lang} t={t} low readonly={readonly} edited={edited.includes(f.id)} onEdit={markEdited} onUpdate={updateFinding} onEvidence={setEvidenceF} onMove={moveToFormal} onRemove={removeLow} />)}
                  </div>
                </div>
              )}

              <div className="divider" />
              <EditSection icon="clipboard" title={t("impression")} value={impression} onChange={setImpression} rows={4} readonly={readonly} accent />
              <EditSection icon="alert" title={t("limitations")} value={limitations} onChange={setLimitations} rows={3} readonly={readonly} />
              <EditSection icon="check" title={t("recommendations")} value={recs} onChange={setRecs} rows={3} readonly={readonly} />
            </div>

            <SuggestionsBlock suggestions={base.aiSuggestions} t={t} lang={lang} onAdd={addSuggestion} added={added} readonly={readonly} />
          </div>

          {/* right rail */}
          <div className="col g16 report-rail" style={{ gap: 16, position: "sticky", top: 104 }}>
            <QualityPanel qc={base.aiQualityCheck} t={t} lang={lang} />
            {!approved && (
              <div className="card card-pad col g10">
                <Btn variant="primary" size="lg" icon="shield" className="btn-block" disabled={!canApprove} onClick={() => setShowApprove(true)}>{t("approve")}</Btn>
                {!canApprove && <div className="faint" style={{ fontSize: 11.5, textAlign: "center" }}>{t("approveDisabled")}</div>}
              </div>
            )}
            {approved && !patientExpl && (
              <div className="card card-pad col g10">
                <Btn variant="secondary" size="lg" icon="heart" className="btn-block" disabled={genExpl} onClick={generatePatientExpl}>
                  {genExpl ? <><Icon name="loader" size={16} className="spin" />{lang === "pl" ? "Generowanie…" : "Generating…"}</> : t("genPatientExpl")}
                </Btn>
              </div>
            )}
          </div>
        </div>
      )}

      <EvidenceModal open={!!evidenceF} onClose={() => setEvidenceF(null)} finding={evidenceF} label={label} t={t} lang={lang} />

      <Modal open={showApprove} onClose={() => setShowApprove(false)}>
        <div className="card-pad-lg">
          <div className="row g10" style={{ marginBottom: 12 }}><div style={{ width: 38, height: 38, borderRadius: 99, background: "var(--accent-tint)", color: "var(--accent-800)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="shield" size={20} /></div><span className="h-sec">{t("confirmApproveTitle")}</span></div>
          <div className="muted" style={{ fontSize: 13.5, lineHeight: 1.55, marginBottom: 20 }}>{t("confirmApproveBody")}</div>
          <div className="row g10" style={{ justifyContent: "flex-end" }}>
            <Btn variant="ghost" onClick={() => setShowApprove(false)}>{t("cancel")}</Btn>
            <Btn variant="primary" icon="check" onClick={doApprove}>{t("confirm")}</Btn>
          </div>
        </div>
      </Modal>
    </div></div>
  );
}

const THYROID_EXPL = {
  plainLanguageSummary: "W badaniu USG szyi znaleziono niewielką zmianę (około 8 mm) w lewej części tarczycy. Ma ona kilka cech, które warto dokładnie sprawdzić — dlatego zalecamy pobranie próbki cienką igłą.",
  keyFindings: ["Niewielka zmiana (ok. 8 mm) w lewej części tarczycy.", "Prawa część tarczycy bez nieprawidłowości.", "Zmiana zaklasyfikowana do grupy wymagającej weryfikacji."],
  nextSteps: ["Wykonać biopsję cienkoigłową zmiany (krótki zabieg ambulatoryjny).", "Zgłosić się na kontrolę z wynikiem biopsji."],
  followUp: "Kontrola USG za 6 miesięcy w razie wyniku łagodnego.",
};

function PatientExplView({ expl, t, lang }) {
  return (
    <div className="card card-pad-lg" style={{ maxWidth: 760 }}>
      <Banner kind="info" icon="heart">{lang === "pl" ? "Wersja dla pacjenta — prostym językiem, bez terminologii łacińskiej." : "Patient version — plain language, no Latin terminology."}</Banner>
      <div style={{ marginTop: 20 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>{lang === "pl" ? "Co znaleziono" : "What we found"}</div>
        <div style={{ fontSize: 15, lineHeight: 1.6 }}>{expl.plainLanguageSummary}</div>
      </div>
      <div className="divider" style={{ margin: "20px 0" }} />
      <div className="eyebrow" style={{ marginBottom: 10 }}>{t("keyFindings")}</div>
      <div className="col g8" style={{ marginBottom: 20 }}>
        {expl.keyFindings.map((k, i) => <div key={i} className="row g10"><Icon name="dot" size={9} style={{ color: "var(--accent-600)", flex: "none", marginTop: 6 }} /><span style={{ fontSize: 14 }}>{k}</span></div>)}
      </div>
      <div className="eyebrow" style={{ marginBottom: 10 }}>{t("nextSteps")}</div>
      <div className="col g8" style={{ marginBottom: 20 }}>
        {expl.nextSteps.map((k, i) => <div key={i} className="row g10"><div style={{ width: 20, height: 20, borderRadius: 99, background: "var(--accent-tint)", color: "var(--accent-800)", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flex: "none", marginTop: 1 }}>{i + 1}</div><span style={{ fontSize: 14 }}>{k}</span></div>)}
      </div>
      {expl.followUp && <div className="panel row g10" style={{ padding: "12px 14px", background: "var(--accent-tint)", borderColor: "var(--accent-tint-2)" }}><Icon name="calendar" size={17} style={{ color: "var(--accent-800)" }} /><div><div className="eyebrow" style={{ marginBottom: 2 }}>{t("followUp")}</div><div style={{ fontSize: 14, color: "var(--accent-800)", fontWeight: 600 }}>{expl.followUp}</div></div></div>}
    </div>
  );
}

Object.assign(window, { ReportEditor, FusionView, PatientExplView });
