/* ============================================================================
   Sonara — Login + Dashboard screens
   ============================================================================ */
const { useState: useStateD } = React;

/* =============================================================== LOGIN === */
function LoginScreen({ lang, setLang, t, onLogin }) {
  const { USERS } = window.SonaraData;
  const [email, setEmail] = useState("rad1@demo.pl");
  const [pw, setPw] = useState("demo2024");

  const submit = (e) => {
    e && e.preventDefault();
    const u = USERS.find((x) => x.email === email) || USERS[0];
    onLogin(u);
  };

  return (
    <div style={{ minHeight: "100%", height: "100%", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      <div className="row between" style={{ padding: "16px 22px" }}>
        <div className="brand">
          <div className="brand-mark"><Icon name="activity" size={17} /></div>
          <div>
            <div className="brand-name">Sonara</div>
            <div className="brand-sub">{t("brandSub")}</div>
          </div>
        </div>
        <div className="lang-toggle">
          {["pl", "en"].map((l) => <button key={l} className={lang === l ? "on" : ""} onClick={() => setLang(l)}>{l.toUpperCase()}</button>)}
        </div>
      </div>

      <div className="grow row center" style={{ padding: 24 }}>
        <div style={{ width: "100%", maxWidth: 396 }}>
          <div className="card card-pad-lg fade-in">
            <div className="col center" style={{ marginBottom: 22 }}>
              <div className="brand-mark" style={{ width: 46, height: 46, borderRadius: 12, marginBottom: 14 }}><Icon name="activity" size={26} /></div>
              <div className="h-page" style={{ fontSize: 21 }}>{t("loginTitle")}</div>
              <div className="muted" style={{ marginTop: 4 }}>{t("loginSub")}</div>
            </div>

            <form onSubmit={submit} className="col g14">
              <div>
                <label className="field-label">{t("email")}</label>
                <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
              </div>
              <div>
                <label className="field-label">{t("password")}</label>
                <input className="input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" />
              </div>
              <Btn variant="primary" size="lg" className="btn-block" type="submit">{t("signIn")}</Btn>
            </form>

            <div className="divider" style={{ margin: "20px 0 16px" }} />
            <div className="eyebrow" style={{ marginBottom: 10 }}>{t("quickAccess")}</div>
            <div className="col g8">
              {USERS.map((u) => (
                <button key={u.id} className="panel row between" style={{ padding: "9px 11px", cursor: "pointer", background: email === u.email ? "var(--accent-tint)" : "var(--surface)", borderColor: email === u.email ? "var(--accent-tint-2)" : "var(--border)" }}
                  onClick={() => { setEmail(u.email); setPw("demo2024"); }}>
                  <div className="row g10">
                    <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{u.initials}</div>
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{u.name}</div>
                      <div className="faint mono" style={{ fontSize: 11 }}>{u.email}</div>
                    </div>
                  </div>
                  <span className={`badge ${u.role === "radiologist" ? "badge-accent" : "badge-neutral"}`}>{t(u.role)}</span>
                </button>
              ))}
            </div>
            <div className="faint" style={{ fontSize: 11.5, marginTop: 14, textAlign: "center" }}>{t("demoHint")}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================ DASHBOARD === */
function CaseChip({ k }) {
  return <span className="badge badge-accent badge-sq mono" style={{ fontWeight: 700, letterSpacing: "0.04em" }}>CASE {k}</span>;
}

function DemoCaseCard({ icon, caseKey, title, sub, wow, onClick, t }) {
  return (
    <button className="card card-pad" style={{ textAlign: "left", cursor: "pointer", transition: "box-shadow .14s, transform .08s, border-color .14s", display: "flex", flexDirection: "column", gap: 12 }}
      onClick={onClick}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "var(--sh-3)"; e.currentTarget.style.borderColor = "var(--accent-tint-2)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "var(--sh-1)"; e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "none"; }}>
      <div className="row between">
        <div className="row g10">
          <div style={{ width: 34, height: 34, borderRadius: 9, background: "var(--accent-tint)", color: "var(--accent-800)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name={icon} size={18} />
          </div>
          <CaseChip k={caseKey} />
        </div>
        <Icon name="arrowRight" size={17} style={{ color: "var(--text-faint)" }} />
      </div>
      <div>
        <div className="h-card" style={{ marginBottom: 3 }}>{title}</div>
        <div className="muted" style={{ fontSize: 12.5, lineHeight: 1.45 }}>{sub}</div>
      </div>
      <div className="row g6" style={{ marginTop: "auto", paddingTop: 4 }}>
        <Icon name="sparkle" size={13} style={{ color: "var(--accent-700)" }} />
        <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--accent-800)" }}>{wow}</span>
      </div>
    </button>
  );
}

function Dashboard({ lang, t, user, nav }) {
  const { PATIENTS, RAD_EXAM_ROWS, DOC_VISIT_ROWS } = window.SonaraData;
  const isRad = user.role === "radiologist";
  const pname = (id) => { const p = PATIENTS[id]; return p ? `${p.firstName} ${p.lastName}` : id; };
  const page = (id) => { const p = PATIENTS[id]; return p ? p.age : ""; };

  const radCases = [
    { icon: "image", caseKey: "A", title: lang === "pl" ? "USG tarczycy — zdjęcie → raport" : "Thyroid US — image → report", sub: lang === "pl" ? "Analiza 3 obrazów, klasyfikacja TI-RADS, warstwa evidence." : "3-image analysis, TI-RADS, evidence layer.", wow: lang === "pl" ? "TI-RADS 4 + źródła z obrazów" : "TI-RADS 4 + image sources", go: () => nav({ name: "exam", caseKey: "A" }) },
    { icon: "mic", caseKey: "B", title: lang === "pl" ? "USG jamy brzusznej — głos → raport" : "Abdominal US — voice → report", sub: lang === "pl" ? "Z naturalnego dyktowania powstaje strukturalny raport." : "Structured report from natural dictation.", wow: lang === "pl" ? "Korekta w locie → czysty raport" : "In-flight fix → clean report", go: () => nav({ name: "exam", caseKey: "B" }) },
    { icon: "shield", caseKey: "D", title: lang === "pl" ? "AI Quality Review — konflikt" : "AI Quality Review — conflict", sub: lang === "pl" ? "Obraz suboptymalny + element niepewny. Warstwa jakości." : "Suboptimal image + uncertain item. Quality layer.", wow: lang === "pl" ? "AI nie udaje pewności" : "AI doesn't fake certainty", go: () => nav({ name: "exam", caseKey: "D" }) },
  ];
  const docCases = [
    { icon: "stetho", caseKey: "C", title: lang === "pl" ? "Wizyta → raport + wersja dla pacjenta" : "Visit → report + patient version", sub: lang === "pl" ? "Jedno nagranie rozmowy daje dwa dokumenty jednocześnie." : "One recording yields two documents at once.", wow: lang === "pl" ? "Jedno nagranie → dwa dokumenty" : "One recording → two documents", go: () => nav({ name: "visit", caseKey: "C" }) },
  ];
  const cases = isRad ? radCases : docCases;
  const rows = isRad ? RAD_EXAM_ROWS : DOC_VISIT_ROWS;

  return (
    <div className="page">
      <div className="page-wide">
        <div className="row between wrap g16" style={{ marginBottom: 24 }}>
          <div>
            <div className="h-page">{t("hello")}, {user.name.split(" ").slice(-1)[0]}</div>
            <div className="lead" style={{ marginTop: 3 }}>{isRad ? t("dashRadSub") : t("dashDocSub")}</div>
          </div>
          <Btn variant="primary" size="lg" icon="plus" onClick={() => nav({ name: isRad ? "exam" : "visit" })}>
            {isRad ? t("newExam") : t("newVisit")}
          </Btn>
        </div>

        {/* demo cases */}
        <div className="row between" style={{ marginBottom: 12 }}>
          <div>
            <div className="h-sec row g8"><Icon name="sparkle" size={17} style={{ color: "var(--accent-700)" }} />{t("demoCases")}</div>
            <div className="faint" style={{ fontSize: 12.5, marginTop: 2 }}>{t("demoCasesSub")}</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isRad ? "repeat(auto-fill, minmax(290px, 1fr))" : "repeat(auto-fill, minmax(330px, 1fr))", gap: 14, marginBottom: 14 }} className="stagger">
          {cases.map((c) => <DemoCaseCard key={c.caseKey} {...c} onClick={c.go} t={t} />)}
          {isRad && (
            <div className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 12, background: "var(--surface-2)", borderStyle: "dashed" }}>
              <div className="row g10">
                <div style={{ width: 34, height: 34, borderRadius: 9, background: "var(--surface-3)", color: "var(--accent-800)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="layers" size={18} /></div>
                <span className="badge badge-neutral badge-sq mono" style={{ fontWeight: 700 }}>MULTIMODAL</span>
              </div>
              <div>
                <div className="h-card" style={{ marginBottom: 3 }}>{lang === "pl" ? "Copilot wielomodalny" : "Multimodal copilot"}</div>
                <div className="muted" style={{ fontSize: 12.5, lineHeight: 1.45 }}>{lang === "pl" ? "Obraz + dyktowanie równolegle → warstwa fuzji wykrywa konflikty." : "Image + dictation in parallel → fusion layer detects conflicts."}</div>
              </div>
              <Btn variant="secondary" size="sm" iconR="arrowRight" style={{ marginTop: "auto", alignSelf: "flex-start" }} onClick={() => nav({ name: "exam", caseKey: "D" })}>
                {lang === "pl" ? "Zobacz fuzję" : "See fusion"}
              </Btn>
            </div>
          )}
        </div>

        {/* table */}
        <div className="card" style={{ marginTop: 22, overflow: "hidden" }}>
          <div className="row between" style={{ padding: "16px 18px 12px" }}>
            <div className="h-sec">{isRad ? t("yourExams") : t("yourVisits")}</div>
            <span className="badge badge-neutral">{rows.length}</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>{t("colDate")}</th><th>{t("colPatient")}</th><th>{t("colType")}</th>
                  {isRad && <th className="hide-tablet">{t("colMode")}</th>}
                  <th>{isRad ? t("colSummary") : t("colStatus")}</th>
                  {isRad && <th>{t("colStatus")}</th>}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const go = () => {
                    if (isRad) nav(r.status === "draft" && r.caseKey ? { name: "exam", caseKey: r.caseKey } : { name: "report", reportId: r.id, readonly: r.status === "approved", caseKey: r.caseKey });
                    else nav(r.caseKey ? { name: "visit", caseKey: r.caseKey } : { name: "visit", visitId: r.id, readonly: r.status === "approved" });
                  };
                  return (
                    <tr key={r.id} onClick={go}>
                      <td className="mono faint nowrap" style={{ fontSize: 12.5 }}>{r.date}</td>
                      <td>
                        <div className="row g8">
                          <div className="avatar" style={{ width: 26, height: 26, fontSize: 10 }}>{pname(r.patientId).split(" ").map((s) => s[0]).join("")}</div>
                          <div className="nowrap">
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{pname(r.patientId)}</div>
                            <div className="faint" style={{ fontSize: 11 }}>{page(r.patientId)} {t("patientAge")}</div>
                          </div>
                        </div>
                      </td>
                      <td className="nowrap">
                        <div className="row g8">
                          {r.caseKey && <CaseChip k={r.caseKey} />}
                          <span>{window.SonaraL(lang, r.type)}</span>
                        </div>
                      </td>
                      {isRad && <td className="hide-tablet"><ModeTag mode={r.mode} lang={lang} /></td>}
                      <td className="muted" style={{ fontSize: 12.5, maxWidth: 260 }}>
                        {isRad ? window.SonaraL(lang, r.summary) : <StatusBadge status={r.status} t={t} />}
                      </td>
                      {isRad && <td><StatusBadge status={r.status} t={t} /></td>}
                      <td style={{ textAlign: "right" }}><Icon name="chevR" size={16} style={{ color: "var(--text-faint)" }} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status, t }) {
  return <span className={`badge ${status === "approved" ? "badge-approved" : "badge-draft"}`}><span className="dot" />{status === "approved" ? t("statusApproved") : t("statusDraft")}</span>;
}
function ModeTag({ mode, lang }) {
  const m = { image: { i: "image", pl: "zdjęcie", en: "image" }, voice: { i: "mic", pl: "głos", en: "voice" }, multimodal: { i: "layers", pl: "multimodal", en: "multimodal" } }[mode] || { i: "file", pl: mode, en: mode };
  return <span className="row g6 faint" style={{ fontSize: 12 }}><Icon name={m.i} size={14} />{lang === "pl" ? m.pl : m.en}</span>;
}

Object.assign(window, { LoginScreen, Dashboard, StatusBadge, ModeTag, CaseChip });
