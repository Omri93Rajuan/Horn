import React, { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "horn_a11y_prefs";

type A11yPrefs = {
  fontScale: number;
  contrastLevel: "normal" | "increased" | "high";
  underlineLinks: boolean;
  reduceMotion: boolean;
  readableFont: boolean;
  barOpen: boolean;
};

const DEFAULT_PREFS: A11yPrefs = {
  fontScale: 1,
  contrastLevel: "normal",
  underlineLinks: false,
  reduceMotion: false,
  readableFont: false,
  barOpen: false,
};

const clampFont = (value: number) => Math.min(1.25, Math.max(0.9, value));

const AccessibilityBar: React.FC = () => {
  const [prefs, setPrefs] = useState<A11yPrefs>(DEFAULT_PREFS);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as Partial<A11yPrefs> & { highContrast?: boolean };
      const normalized: Partial<A11yPrefs> = { ...parsed };
      if (parsed.highContrast) {
        normalized.contrastLevel = "high";
      }
      setPrefs({ ...DEFAULT_PREFS, ...normalized });
    } catch {
      setPrefs(DEFAULT_PREFS);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--a11y-font-scale", String(prefs.fontScale));
    root.classList.toggle("a11y-contrast-increased", prefs.contrastLevel === "increased");
    root.classList.toggle("a11y-contrast-high", prefs.contrastLevel === "high");
    root.classList.toggle("a11y-underline", prefs.underlineLinks);
    root.classList.toggle("a11y-reduce-motion", prefs.reduceMotion);
    root.classList.toggle("a11y-readable-font", prefs.readableFont);
    root.classList.toggle("a11y-bar-visible", prefs.barOpen);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // Ignore storage errors.
    }
  }, [prefs]);

  const fontLabel = useMemo(() => {
    if (prefs.fontScale >= 1.15) return "גדול";
    if (prefs.fontScale <= 0.95) return "קטן";
    return "רגיל";
  }, [prefs.fontScale]);

  if (!prefs.barOpen) {
    return (
      <button
        type="button"
        className="a11y-toggle"
        onClick={() => setPrefs((prev) => ({ ...prev, barOpen: true }))}
        aria-label="פתח סרגל נגישות"
      >
        נגישות
      </button>
    );
  }

  return (
    <div className="a11y-bar" role="region" aria-label="סרגל נגישות">
      <div className="a11y-bar__content">
        <div className="a11y-bar__title">
          <span className="a11y-bar__badge">נגישות</span>
          <span className="a11y-bar__hint">העדפות נשמרות אוטומטית</span>
        </div>

        <div className="a11y-bar__controls">
          <div className="a11y-group">
            <span className="a11y-label">גודל טקסט</span>
            <div className="a11y-stepper">
              <button
                type="button"
                className="a11y-btn"
                onClick={() =>
                  setPrefs((prev) => ({
                    ...prev,
                    fontScale: clampFont(Number((prev.fontScale - 0.05).toFixed(2))),
                  }))
                }
                aria-label="הקטן טקסט"
              >
                -
              </button>
              <span className="a11y-value">{fontLabel}</span>
              <button
                type="button"
                className="a11y-btn"
                onClick={() =>
                  setPrefs((prev) => ({
                    ...prev,
                    fontScale: clampFont(Number((prev.fontScale + 0.05).toFixed(2))),
                  }))
                }
                aria-label="הגדל טקסט"
              >
                +
              </button>
            </div>
          </div>

          <div className="a11y-group">
            <span className="a11y-label">ניגודיות</span>
            <div className="a11y-stepper">
              <button
                type="button"
                className={`a11y-btn ${prefs.contrastLevel === "normal" ? "is-active" : ""}`}
                onClick={() => setPrefs((prev) => ({ ...prev, contrastLevel: "normal" }))}
                aria-label="ניגודיות רגילה"
              >
                רגילה
              </button>
              <button
                type="button"
                className={`a11y-btn ${prefs.contrastLevel === "increased" ? "is-active" : ""}`}
                onClick={() => setPrefs((prev) => ({ ...prev, contrastLevel: "increased" }))}
                aria-label="ניגודיות משופרת"
              >
                משופרת
              </button>
              <button
                type="button"
                className={`a11y-btn ${prefs.contrastLevel === "high" ? "is-active" : ""}`}
                onClick={() => setPrefs((prev) => ({ ...prev, contrastLevel: "high" }))}
                aria-label="ניגודיות גבוהה"
              >
                גבוהה
              </button>
            </div>
          </div>

          <button
            type="button"
            className={`a11y-btn ${prefs.underlineLinks ? "is-active" : ""}`}
            onClick={() => setPrefs((prev) => ({ ...prev, underlineLinks: !prev.underlineLinks }))}
          >
            הדגשת קישורים
          </button>
          <button
            type="button"
            className={`a11y-btn ${prefs.reduceMotion ? "is-active" : ""}`}
            onClick={() => setPrefs((prev) => ({ ...prev, reduceMotion: !prev.reduceMotion }))}
          >
            הפחתת תנועה
          </button>
          <button
            type="button"
            className={`a11y-btn ${prefs.readableFont ? "is-active" : ""}`}
            onClick={() => setPrefs((prev) => ({ ...prev, readableFont: !prev.readableFont }))}
          >
            פונט קריא
          </button>
          <button
            type="button"
            className="a11y-btn a11y-btn--ghost"
            onClick={() => setPrefs(DEFAULT_PREFS)}
          >
            איפוס
          </button>
        </div>
      </div>

      <button
        type="button"
        className="a11y-collapse"
        onClick={() => setPrefs((prev) => ({ ...prev, barOpen: false }))}
        aria-label="סגור סרגל נגישות"
      >
        הסתר
      </button>
    </div>
  );
};

export default AccessibilityBar;
