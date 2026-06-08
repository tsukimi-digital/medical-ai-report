/* ============================================================================
   Sonara — Device shell. Explicit Desktop / iPad views, scaled to fit.
   Layout is chosen by the user (or auto-detected once), NOT by window width.
   ============================================================================ */
const { useState: useDS, useEffect: useDE } = React;

const DEVICE_DIMS = {
  desktop:          { w: 1440, h: null, label: "Desktop", dims: "1440" },
  "tablet-land":    { w: 1180, h: 820,  label: "iPad — poziomo", labelEn: "iPad — landscape", dims: "1180 × 820" },
  "tablet-port":    { w: 820,  h: 1180, label: "iPad — pionowo", labelEn: "iPad — portrait", dims: "820 × 1180" },
};

const BAR_H = 46;

function DeviceBar({ mode, setMode, lang }) {
  const Opt = ({ id, icon, children }) => (
    <button className={mode === id ? "on" : ""} onClick={() => setMode(id)}>
      <Icon name={icon} size={15} />{children}
    </button>
  );
  const d = DEVICE_DIMS[mode];
  return (
    <div className="device-bar">
      <div className="db-brand"><Icon name="activity" size={15} />Sonara</div>
      <div className="seg">
        <Opt id="desktop" icon="grid">Desktop</Opt>
        <Opt id="tablet-land" icon="image">{lang === "pl" ? "iPad poziomo" : "iPad landscape"}</Opt>
        <Opt id="tablet-port" icon="file">{lang === "pl" ? "iPad pionowo" : "iPad portrait"}</Opt>
      </div>
      <div className="db-dims">{d.dims} px</div>
    </div>
  );
}

function DeviceShell({ mode, children }) {
  const cfg = DEVICE_DIMS[mode];
  const isTablet = mode !== "desktop";
  const [box, setBox] = useDS({ scale: 1, h: 800 });

  useDE(() => {
    const calc = () => {
      const availW = window.innerWidth;
      const availH = window.innerHeight - BAR_H;
      const margin = isTablet ? 48 : 0;          // breathing room around the iPad bezel
      if (mode === "desktop") {
        const scale = Math.min(1, availW / cfg.w);
        const h = Math.max(720, Math.round(availH / scale));
        setBox({ scale, h });
      } else {
        const scale = Math.min(1, (availW - margin) / cfg.w, (availH - margin) / cfg.h);
        setBox({ scale, h: cfg.h });
      }
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, [mode]);

  const device = isTablet ? "tablet" : "desktop";
  const orient = mode === "tablet-port" ? "portrait" : "landscape";

  return (
    <div className="device-stage" data-mode={isTablet ? "tablet" : "desktop"}>
      <div className="device-frame" data-device={device} data-orient={orient}
        style={{ width: cfg.w, height: box.h, transform: `scale(${box.scale})`, transformOrigin: mode === "desktop" ? "top center" : "center center" }}>
        {children}
      </div>
    </div>
  );
}

function detectMode() {
  try { const s = localStorage.getItem("sonara-device"); if (s && DEVICE_DIMS[s]) return s; } catch (e) {}
  const w = window.innerWidth;
  if (w >= 1180) return "desktop";
  if (w >= 768) return "tablet-land";
  return "tablet-port";
}

Object.assign(window, { DeviceShell, DeviceBar, detectMode, DEVICE_BAR_H: BAR_H });
