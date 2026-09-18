import { useEffect, useState } from "react";
import { useFocusly } from "@/contexts/FocuslyContext";
import type { Settings as S } from "@/utils/types";

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-white/5 last:border-b-0">
      <div>
        <div className="text-sm">{label}</div>
        {hint && <div className="text-xs text-white/40">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (b: boolean) => void; label: string }) {
  return (
    <button role="switch" aria-checked={checked} aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition-colors ${checked ? "" : "bg-white/10"}`}
      style={checked ? { background: "linear-gradient(135deg, rgb(139,92,246), rgb(59,130,246))" } : undefined}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

function Num({ v, on, min = 1, max = 90 }: { v: number; on: (n: number) => void; min?: number; max?: number }) {
  const [draft, setDraft] = useState<string>(String(v));
  useEffect(() => { setDraft(String(v)); }, [v]);
  const commit = (raw: string) => {
    const n = parseInt(raw, 10);
    const safe = Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : v;
    setDraft(String(safe));
    on(safe);
  };
  return (
    <input type="number" inputMode="numeric" min={min} max={max} value={draft}
      onChange={(e) => {
        setDraft(e.target.value);
        const n = parseInt(e.target.value, 10);
        if (Number.isFinite(n) && n >= min && n <= max) on(n);
      }}
      onBlur={(e) => commit(e.target.value)}
      className="w-20 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm text-center" />
  );
}

const AMBIENTS: { id: S["ambient"]; label: string }[] = [
  { id: "space", label: "Space" },
  { id: "rain", label: "Rain" },
  { id: "library", label: "Library" },
  { id: "forest", label: "Forest" },
  { id: "cafe", label: "Café" },
];

export function SettingsPanel() {
  const { settings, updateSettings } = useFocusly();
  return (
    <div className="glass rounded-3xl p-6">
      <h3 className="font-display text-lg font-semibold mb-2">Settings</h3>
      <p className="text-xs text-white/40 mb-4">Preferences save automatically to this browser.</p>

      <Row label="Focus duration" hint="Minutes per focus session">
        <Num v={settings.focus} on={(n) => updateSettings({ focus: n })} max={180} />
      </Row>
      <Row label="Short break" hint="Minutes for short breaks">
        <Num v={settings.short} on={(n) => updateSettings({ short: n })} max={90} />
      </Row>
      <Row label="Long break" hint="Minutes after every 4th focus session">
        <Num v={settings.long} on={(n) => updateSettings({ long: n })} max={120} />
      </Row>
      <Row label="Auto-start focus sessions" hint="Continue after a break">
        <Toggle label="Auto-start focus" checked={settings.autoStart} onChange={(b) => updateSettings({ autoStart: b })} />
      </Row>
      <Row label="Auto-start breaks" hint="Kick off breaks automatically">
        <Toggle label="Auto-start breaks" checked={settings.autoStartBreaks} onChange={(b) => updateSettings({ autoStartBreaks: b })} />
      </Row>
      <Row label="Notification sounds" hint="Play a soft bell on completion">
        <Toggle label="Sounds" checked={settings.sound} onChange={(b) => updateSettings({ sound: b })} />
      </Row>
      <Row label="Ticking sound" hint="Subtle tick every second during focus">
        <Toggle label="Ticking" checked={settings.ticking} onChange={(b) => updateSettings({ ticking: b })} />
      </Row>
      <Row label="Desktop notifications" hint="Requires browser permission">
        <Toggle label="Notifications" checked={settings.desktopNotifications} onChange={(b) => {
          updateSettings({ desktopNotifications: b });
          if (b && typeof Notification !== "undefined" && Notification.permission === "default") {
            Notification.requestPermission().catch(() => {});
          }
        }} />
      </Row>
      <Row label="Ambient mode" hint="Background atmosphere">
        <div className="flex flex-wrap gap-1">
          {AMBIENTS.map((a) => (
            <button key={a.id} onClick={() => updateSettings({ ambient: a.id })}
              className={`rounded-full px-3 py-1 text-xs border transition ${settings.ambient === a.id ? "bg-white/15 border-white/30" : "bg-white/5 border-white/10 hover:bg-white/10"}`}>
              {a.label}
            </button>
          ))}
        </div>
      </Row>
    </div>
  );
}
