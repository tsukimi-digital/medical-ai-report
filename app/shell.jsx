/* ============================================================================
   Sonara — App shell: navbar, disclaimer, router, context
   ============================================================================ */
const { useState: useS, useEffect: useE } = React;

function Navbar({ lang, setLang, t, user, nav, onLogout }) {
  return (
    <div className="navbar">
      <div className="brand" onClick={() => nav({ name: "dashboard" })}>
        <div className="brand-mark"><Icon name="activity" size={17} /></div>
        <div className="hide-tablet">
          <div className="brand-name">Sonara</div>
          <div className="brand-sub">{t("brandSub")}</div>
        </div>
      </div>
      <div className="nav-spacer" />
      <div className="lang-toggle">
        {["pl", "en"].map((l) => <button key={l} className={lang === l ? "on" : ""} onClick={() => setLang(l)}>{l.toUpperCase()}</button>)}
      </div>
      {user && (
        <>
          <div className="vdivider" style={{ height: 26, margin: "0 4px" }} />
          <div className="user-chip">
            <div className="avatar">{user.initials}</div>
            <div className="user-meta hide-tablet">
              <div className="user-name">{user.name}</div>
              <div className="user-role">{t(user.role)}</div>
            </div>
          </div>
          <button className="iconbtn" title={t("logout")} onClick={onLogout}><Icon name="logout" size={17} /></button>
        </>
      )}
    </div>
  );
}

function Disclaimer({ t }) {
  return (
    <div className="disclaimer">
      <Icon name="shield" size={15} />
      <span>{t("disclaimer")}</span>
    </div>
  );
}

function Toast({ msg, onDone }) {
  useE(() => { if (!msg) return; const id = setTimeout(onDone, 4200); return () => clearTimeout(id); }, [msg]);
  if (!msg) return null;
  return (
    <div className="fade-in" style={{ position: "fixed", bottom: 22, left: "50%", transform: "translateX(-50%)", zIndex: 80, background: "var(--text)", color: "#fff", padding: "11px 16px", borderRadius: 10, boxShadow: "var(--sh-4)", fontSize: 13, maxWidth: 460, display: "flex", gap: 10, alignItems: "center" }}>
      <Icon name="info" size={16} style={{ flex: "none", opacity: 0.8 }} />
      <span>{msg}</span>
    </div>
  );
}

function App({ lang, setLang }) {
  const [user, setUser] = useS(null);
  const [route, setRoute] = useS({ name: "dashboard" });
  const [toast, setToast] = useS("");

  const t = (k) => (window.SonaraI18N[lang][k] ?? k);
  const nav = (r) => {
    setRoute(r);
    const f = document.querySelector(".device-frame");
    if (f) f.scrollTo({ top: 0 }); else window.scrollTo({ top: 0 });
  };

  const changeLang = (l) => {
    setLang(l);
    if (["report", "visit"].includes(route.name)) {
      setToast(window.SonaraI18N[l].langToast);
    }
  };

  if (!user) {
    return (
      <>
        <LoginScreen lang={lang} setLang={setLang} t={t} onLogin={(u) => { setUser(u); setRoute({ name: "dashboard" }); }} />
        <Toast msg={toast} onDone={() => setToast("")} />
      </>
    );
  }

  let screen;
  switch (route.name) {
    case "dashboard": screen = <Dashboard lang={lang} t={t} user={user} nav={nav} />; break;
    case "exam":      screen = <ExamFlow lang={lang} t={t} user={user} nav={nav} route={route} setToast={setToast} />; break;
    case "report":    screen = <ReportEditor lang={lang} t={t} user={user} nav={nav} route={route} setToast={setToast} />; break;
    case "visit":     screen = <VisitFlow lang={lang} t={t} user={user} nav={nav} route={route} setToast={setToast} />; break;
    default:          screen = <Dashboard lang={lang} t={t} user={user} nav={nav} />;
  }

  return (
    <div className="app-shell">
      <Navbar lang={lang} setLang={changeLang} t={t} user={user} nav={nav} onLogout={() => { setUser(null); setRoute({ name: "dashboard" }); }} />
      <Disclaimer t={t} />
      {screen}
      <Toast msg={toast} onDone={() => setToast("")} />
    </div>
  );
}

function Root() {
  const [mode, setMode] = useS(() => detectMode());
  const [lang, setLang] = useS("pl");
  const changeMode = (m) => { setMode(m); try { localStorage.setItem("sonara-device", m); } catch (e) {} };
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <DeviceBar mode={mode} setMode={changeMode} lang={lang} />
      <DeviceShell mode={mode}>
        <App lang={lang} setLang={setLang} />
      </DeviceShell>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
