/* ============================================================================
   Sonara — UI primitives + icon set. Exposed on window for other scripts.
   Simple line icons only (stroke-based). No illustrative SVG.
   ============================================================================ */
const { useState, useEffect, useRef, createContext, useContext } = React;

/* --------------------------------------------------------------- icons --- */
function Icon({ name, size = 18, stroke = 2, style, className }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", strokeWidth: stroke, strokeLinecap: "round", strokeLinejoin: "round",
    style, className };
  const paths = {
    search: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-3.6-3.6" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    mic: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="2.5" /><circle cx="8.5" cy="8.5" r="1.6" /><path d="M21 15l-5-5L5 21" /></>,
    check: <><path d="M20 6L9 17l-5-5" /></>,
    checkCircle: <><circle cx="12" cy="12" r="9" /><path d="M8.5 12.5l2.5 2.5 4.5-5" /></>,
    x: <><path d="M18 6L6 18M6 6l12 12" /></>,
    alert: <><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></>,
    alertCircle: <><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" /></>,
    chevR: <><path d="M9 6l6 6-6 6" /></>,
    chevD: <><path d="M6 9l6 6 6-6" /></>,
    chevL: <><path d="M15 6l-6 6 6 6" /></>,
    eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></>,
    file: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /></>,
    fileText: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>,
    userPlus: <><circle cx="9" cy="8" r="4" /><path d="M2 21c0-4 3.5-6 7-6M17 9v6M14 12h6" /></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></>,
    globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>,
    sparkle: <><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /><path d="M19 4v3M20.5 5.5h-3" /></>,
    activity: <><path d="M22 12h-4l-3 8-6-16-3 8H2" /></>,
    layers: <><path d="M12 2 2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5M2 12l10 5 10-5" /></>,
    stetho: <><path d="M5 3v5a5 5 0 0 0 10 0V3" /><path d="M10 18a5 5 0 0 0 10 0v-3" /><circle cx="20" cy="11" r="2" /><path d="M5 3H3M5 3h2M15 3h-2M15 3h2" /></>,
    clipboard: <><rect x="6" y="4" width="12" height="17" rx="2" /><path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" /><path d="M9 11h6M9 15h6" /></>,
    edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></>,
    arrowUp: <><path d="M12 19V5M5 12l7-7 7 7" /></>,
    trash: <><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></>,
    shield: <><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="M9 12l2 2 4-4" /></>,
    waveform: <><path d="M3 12h2l2-6 3 14 3-18 3 14 2-4h3" /></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    play: <><path d="M7 4l13 8-13 8z" /></>,
    loader: <><path d="M12 3v4M12 17v4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M3 12h4M17 12h4M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" /></>,
    heart: <><path d="M12 21C7 17 3 13.5 3 9a4.5 4.5 0 0 1 9-1 4.5 4.5 0 0 1 9 1c0 4.5-4 8-9 12z" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
    calendar: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></>,
    arrowRight: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    arrowLeft: <><path d="M19 12H5M11 6l-6 6 6 6" /></>,
    dot: <circle cx="12" cy="12" r="4" />,
    flask: <><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3" /><path d="M7.5 14h9" /></>,
    target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" /></>,
    upload: <><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></>,
  };
  return <svg {...p}>{paths[name] || null}</svg>;
}

/* -------------------------------------------------------------- button --- */
function Btn({ variant = "secondary", size, icon, iconR, children, className = "", ...rest }) {
  const cls = ["btn", `btn-${variant}`, size ? `btn-${size}` : "", className].filter(Boolean).join(" ");
  return (
    <button className={cls} {...rest}>
      {icon && <Icon name={icon} size={size === "xs" ? 14 : size === "sm" ? 15 : 16} />}
      {children}
      {iconR && <Icon name={iconR} size={size === "sm" ? 15 : 16} />}
    </button>
  );
}

/* ------------------------------------------------------ confidence badge --- */
function ConfBadge({ level, lang }) {
  const c = window.SonaraData.CONF[level];
  if (!c) return null;
  return <span className={`badge ${c.cls}`}><span className="dot" />{lang === "pl" ? c.pl : c.en}</span>;
}

/* ----------------------------------------------------------- usg thumb --- */
function UsgThumb({ idx, label, w = 78, h = 60, lit = false, showIdx = true, onClick }) {
  return (
    <div className={`usg-thumb${lit ? " lit" : ""}`} style={{ width: w, height: h, cursor: onClick ? "pointer" : "default" }} onClick={onClick}>
      {showIdx && <span className="usg-idx">{String(idx + 1).padStart(2, "0")}</span>}
      <span className="usg-label">{label}_{String(idx + 1).padStart(2, "0")}</span>
    </div>
  );
}

/* --------------------------------------------------------------- modal --- */
/* Anchors a .scrim to the currently-visible region of the device-frame
   scroll container, so modals/overlays appear centered in view no matter
   how far the user has scrolled (position:fixed is unreliable inside the
   scaled/transformed device frame). */
function useScrimAnchor(open) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const el = ref.current;
    const sp = el ? el.closest(".device-frame") : null;
    if (!sp) return;
    const place = () => {
      el.style.top = sp.scrollTop + "px";
      el.style.height = sp.clientHeight + "px";
    };
    place();
    sp.addEventListener("scroll", place, { passive: true });
    window.addEventListener("resize", place);
    return () => { sp.removeEventListener("scroll", place); window.removeEventListener("resize", place); };
  }, [open]);
  return ref;
}

function Modal({ open, onClose, children, lg }) {
  const ref = useScrimAnchor(open);
  useEffect(() => {
    if (!open) return;
    const h = (e) => e.key === "Escape" && onClose && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div ref={ref} className="scrim" onClick={onClose}>
      <div className={`modal${lg ? " modal-lg" : ""}`} onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

/* -------------------------------------------------------------- banner --- */
function Banner({ kind = "info", icon, title, children, action }) {
  const ic = icon || (kind === "crit" ? "alertCircle" : kind === "warn" ? "alert" : kind === "ok" ? "checkCircle" : "info");
  return (
    <div className={`banner banner-${kind}`}>
      <Icon name={ic} size={18} />
      <div className="grow">
        {title && <div className="banner-title">{title}</div>}
        <div>{children}</div>
      </div>
      {action}
    </div>
  );
}

/* ----------------------------------------------------------- collapse --- */
function Collapse({ title, sub, defaultOpen = false, icon, right, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="panel" style={{ overflow: "hidden" }}>
      <div className="collapse-head between" onClick={() => setOpen(!open)}>
        <div className="row g8">
          <Icon name="chevR" size={16} className={`chev${open ? " open" : ""}`} />
          {icon && <Icon name={icon} size={16} style={{ color: "var(--accent-700)" }} />}
          <div>
            <div className="h-card">{title}</div>
            {sub && <div className="faint" style={{ fontSize: 11.5, fontWeight: 400 }}>{sub}</div>}
          </div>
        </div>
        {right}
      </div>
      {open && <div className="fade-in" style={{ borderTop: "1px solid var(--border)" }}>{children}</div>}
    </div>
  );
}

/* -------------------------------------------------------- searchable cb --- */
function Combobox({ value, onChange, options, placeholder, render, getLabel, emptyText }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const lab = getLabel || ((o) => o);
  const filtered = options.filter((o) => lab(o).toLowerCase().includes(q.toLowerCase()));
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div className="input row between" style={{ cursor: "pointer", paddingRight: 10 }} onClick={() => setOpen(!open)}>
        <span style={{ color: value ? "var(--text)" : "var(--text-faint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {value ? (render ? render(value) : lab(value)) : placeholder}
        </span>
        <Icon name="chevD" size={16} style={{ color: "var(--text-faint)", flex: "none" }} />
      </div>
      {open && (
        <div className="card fade-in" style={{ position: "absolute", top: "calc(100% + 5px)", left: 0, right: 0, zIndex: 30, boxShadow: "var(--sh-3)", padding: 6, maxHeight: 280, overflow: "auto" }}>
          <div className="row g6" style={{ padding: "4px 8px 8px" }}>
            <Icon name="search" size={15} style={{ color: "var(--text-faint)" }} />
            <input autoFocus className="input" style={{ border: 0, padding: "2px 0", boxShadow: "none" }} placeholder={placeholder} value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="divider" style={{ margin: "0 -6px 6px" }} />
          {filtered.map((o, i) => (
            <div key={i} className="row" style={{ padding: "8px 10px", borderRadius: 7, cursor: "pointer" }}
              onMouseDown={() => { onChange(o); setOpen(false); setQ(""); }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              {render ? render(o) : lab(o)}
            </div>
          ))}
          {filtered.length === 0 && <div className="faint" style={{ padding: "8px 10px", fontSize: 13 }}>{emptyText || "Brak wyników"}</div>}
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------- qc helpers --- */
const QC_ICON = { pass: "checkCircle", warning: "alert", fail: "alertCircle" };
const QC_COLOR = { pass: "var(--ok-text)", warning: "var(--warn-text)", fail: "var(--crit-text)" };
const QC_STATUS = {
  ready: { kind: "ok", icon: "checkCircle", key: "qReady" },
  needs_attention: { kind: "warn", icon: "alert", key: "qAttention" },
  blocked: { kind: "crit", icon: "alertCircle", key: "qBlocked" },
};

Object.assign(window, {
  Icon, Btn, ConfBadge, UsgThumb, Modal, Banner, Collapse, Combobox, useScrimAnchor,
  QC_ICON, QC_COLOR, QC_STATUS,
});
