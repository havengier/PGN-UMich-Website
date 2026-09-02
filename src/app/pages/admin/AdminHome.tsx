import { useState, useEffect } from "react";
import { Link } from "react-router";
import { ArrowLeft, Save, CheckCircle, AlertCircle } from "lucide-react";
import { LoginGate } from "@/app/components/LoginGate";

const NS = "home";

const DEFAULT_PRESIDENT_BODY =
  "On behalf of the brotherhood, it is my pleasure to welcome you to Phi Gamma Nu at the University of Michigan. Thank you for taking the time to learn more about our organization, our values, and our people.\n\nPGN is one of the largest professional business fraternities in the United States, with a rich history dating back to 1927. Our Delta Phi chapter here at Michigan is proud to uphold these traditions while forging new paths as future business leaders.";

const DEFAULTS = {
  // Hero Action Buttons
  "home.hero.button_1_text": "W26 Application",
  "home.hero.button_1_url": "/apply",
  "home.hero.button_2_text": "Interest Form",
  "home.hero.button_2_url": "#",
  // President's Welcome
  "home.president.hide_image": "false",
  "home.president.image_url": "",
  "home.president.image_width": "288",
  "home.president.yellow_text": "Welcome to PGN at the University of Michigan!",
  "home.president.heading": "President's Welcome",
  "home.president.heading_font_size": "42",
  "home.president.body_font_size": "15",
  "home.president.body": DEFAULT_PRESIDENT_BODY,
};

type Fields = typeof DEFAULTS;

function AdminHomeContent() {
  const [fields, setFields] = useState<Fields>({ ...DEFAULTS });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    fetch(`/api/content?ns=${NS}`)
      .then((r) => r.json())
      .then((data: Record<string, string>) => {
        setFields((prev) => {
          let body = data["home.president.body"];
          if (!body && (data["home.president.body_1"] || data["home.president.body_2"])) {
            body = [data["home.president.body_1"], data["home.president.body_2"]].filter(Boolean).join("\n\n");
          }
          return {
            ...prev,
            ...data,
            ...(body !== undefined ? { "home.president.body": body } : {}),
          };
        });
      })
      .catch(() => {});
  }, []);

  const set = (key: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFields((f) => ({ ...f, [key]: e.target.value }));

  async function handleSave() {
    setSaving(true);
    setStatus("idle");
    setErrMsg("");
    try {
      const res = await fetch("/api/content", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (res.ok) {
        setStatus("ok");
      } else {
        const body = await res.json().catch(() => ({})) as { error?: string };
        setErrMsg(body.error ?? `HTTP ${res.status}`);
        setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9]" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="bg-[#1a0303] px-8 md:px-16 py-10 pt-24">
        <Link to="/admin" className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft size={15} /> Back to Admin
        </Link>
        <h1 className="text-white font-normal" style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}>
          Home Page
        </h1>
        <p className="text-white/40 text-sm mt-2">Edit the Hero buttons and President's Welcome section.</p>
      </div>

      <div className="px-8 md:px-16 py-12 max-w-4xl">

        {/* Hero Action Buttons */}
        <Section title="Hero Action Buttons">
          <p className="text-xs text-gray-500 mb-2">
            Configure the two call-to-action buttons that appear at the bottom of the video hero on the home page.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl bg-stone-50 border border-stone-200/70">
            {/* Button 1 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#7A0C0C]">
                  Primary Button (Left)
                </span>
                <span className="text-[11px] text-gray-400 font-mono">Button 1</span>
              </div>

              <Field label="Button Text">
                <input
                  type="text"
                  value={fields["home.hero.button_1_text"]}
                  onChange={set("home.hero.button_1_text")}
                  placeholder="e.g. W26 Application"
                  className={inputCls}
                />
              </Field>

              <Field
                label="Destination Link / URL"
                hint="Internal path (e.g. /apply) or external URL (https://…)"
              >
                <input
                  type="text"
                  value={fields["home.hero.button_1_url"]}
                  onChange={set("home.hero.button_1_url")}
                  placeholder="e.g. /apply or https://..."
                  className={inputCls}
                />
              </Field>
            </div>

            {/* Button 2 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#7A0C0C]">
                  Secondary Button (Right)
                </span>
                <span className="text-[11px] text-gray-400 font-mono">Button 2</span>
              </div>

              <Field label="Button Text">
                <input
                  type="text"
                  value={fields["home.hero.button_2_text"]}
                  onChange={set("home.hero.button_2_text")}
                  placeholder="e.g. Interest Form"
                  className={inputCls}
                />
              </Field>

              <Field
                label="Destination Link / URL"
                hint="Internal path (e.g. /recruitment), external form URL, or # to disable"
              >
                <input
                  type="text"
                  value={fields["home.hero.button_2_url"]}
                  onChange={set("home.hero.button_2_url")}
                  placeholder="e.g. https://forms.gle/… or #"
                  className={inputCls}
                />
              </Field>
            </div>
          </div>

          {/* Live Preview */}
          <div className="mt-4 p-5 rounded-xl bg-[#140202] text-white flex flex-col items-center gap-3">
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#F5A623]">
              Hero Button Preview
            </span>
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 py-2">
              {fields["home.hero.button_1_text"] ? (
                <span className="text-white text-base font-light border-b-2 border-white pb-1 tracking-wide">
                  {fields["home.hero.button_1_text"]}
                </span>
              ) : (
                <span className="text-white/30 text-xs italic">(Button 1 hidden)</span>
              )}
              {fields["home.hero.button_2_text"] ? (
                <span className="text-white text-base font-light border-b-2 border-white pb-1 tracking-wide">
                  {fields["home.hero.button_2_text"]}
                </span>
              ) : (
                <span className="text-white/30 text-xs italic">(Button 2 hidden)</span>
              )}
            </div>
            <span className="text-[11px] text-white/40">
              Links: &ldquo;{fields["home.hero.button_1_url"] || "(none)"}&rdquo; &bull; &ldquo;{fields["home.hero.button_2_url"] || "(none)"}&rdquo;
            </span>
          </div>
        </Section>

        {/* President's Welcome */}
        <Section title="President's Welcome">
          {/* Toggle: Display President Photo */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-stone-50 border border-stone-200/70 mb-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">Show President Photo on Page</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {fields["home.president.hide_image"] === "true"
                  ? "Image is currently removed completely. The welcome text will display full-width."
                  : "Image is currently visible alongside the welcome text."}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={fields["home.president.hide_image"] !== "true"}
              onClick={() =>
                setFields((f) => ({
                  ...f,
                  "home.president.hide_image": f["home.president.hide_image"] === "true" ? "false" : "true",
                }))
              }
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                fields["home.president.hide_image"] !== "true" ? "bg-[#7A0C0C]" : "bg-gray-300"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  fields["home.president.hide_image"] !== "true" ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <Field
            label="President Photo URL"
            hint="Paste a direct image link (https://…) or use the fast, local optimized photo (/president.webp). Leave blank to default to /president.webp."
          >
            <input
              type="url"
              value={fields["home.president.image_url"]}
              onChange={set("home.president.image_url")}
              placeholder="/president.webp"
              className={inputCls}
            />
            {fields["home.president.image_url"]?.includes("ibb.co") && (
              <div className="mt-2.5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                <span className="text-base leading-none">⚠️</span>
                <div className="flex-1">
                  <p className="font-semibold">Slow External Host Detected (ImgBB)</p>
                  <p className="text-amber-800 mt-0.5">
                    Images hosted on ImgBB take over 30-120+ seconds to load due to severe external bandwidth throttling. We converted and packaged this photo into an optimized local WebP asset (<code className="font-mono bg-amber-100/80 px-1 py-0.5 rounded">/president.webp</code>, 52 KB) that loads instantly in 10ms.
                  </p>
                  <button
                    type="button"
                    onClick={() => setFields((f) => ({ ...f, "home.president.image_url": "/president.webp" }))}
                    className="mt-2 px-3 py-1 bg-amber-800 hover:bg-amber-900 text-white rounded font-medium text-xs transition-colors shadow-sm"
                  >
                    Switch to Fast Local Photo (/president.webp)
                  </button>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => setFields((f) => ({ ...f, "home.president.image_url": "/president.webp" }))}
                className="text-xs text-[#7A0C0C] hover:underline font-medium"
              >
                Set to default fast local photo (/president.webp)
              </button>
              {fields["home.president.image_url"] && (
                <>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={() => setFields((f) => ({ ...f, "home.president.image_url": "" }))}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Clear field
                  </button>
                </>
              )}
            </div>
          </Field>

          {/* Image Size Control */}
          <Field
            label={`President Photo Size: ${fields["home.president.image_width"] || "288"}px`}
            hint="Adjust the display width of the President's portrait photo on the home page."
          >
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {[
                { label: "Small (220px)", val: "220" },
                { label: "Medium (288px - Default)", val: "288" },
                { label: "Large (360px)", val: "360" },
                { label: "Extra Large (440px)", val: "440" },
              ].map(({ label, val }) => {
                const active = (fields["home.president.image_width"] || "288") === val;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setFields((f) => ({ ...f, "home.president.image_width": val }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      active
                        ? "bg-[#7A0C0C] text-white shadow-sm"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="200"
                max="500"
                step="4"
                value={fields["home.president.image_width"] || "288"}
                onChange={(e) =>
                  setFields((f) => ({ ...f, "home.president.image_width": e.target.value }))
                }
                className="w-full accent-[#7A0C0C] cursor-pointer"
              />
              <span className="text-xs font-mono text-gray-500 w-12 text-right">
                {fields["home.president.image_width"] || "288"}px
              </span>
            </div>

            {/* Photo Preview */}
            <div className="mt-3 p-4 rounded-xl bg-stone-100/60 border border-stone-200/60 flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-2">
                Photo Dimension Preview ({fields["home.president.image_width"] || "288"}px)
              </span>
              <div
                className="rounded-xl overflow-hidden shadow-md aspect-[3/4] bg-gradient-to-br from-amber-950 via-stone-800 to-stone-900 flex items-center justify-center transition-all duration-200"
                style={{
                  width: `${Math.min(Number(fields["home.president.image_width"] || 288) * 0.55, 240)}px`,
                }}
              >
                {fields["home.president.image_url"] || "/president.webp" ? (
                  <img
                    src={fields["home.president.image_url"] || "/president.webp"}
                    alt="President Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-amber-200/40 text-[10px] tracking-widest uppercase">
                    President
                  </span>
                )}
              </div>
            </div>
          </Field>

          <Field label="Yellow caption text (above photo)">
            <input
              type="text"
              value={fields["home.president.yellow_text"]}
              onChange={set("home.president.yellow_text")}
              className={inputCls}
            />
          </Field>

          <Field label="Section heading">
            <input
              type="text"
              value={fields["home.president.heading"]}
              onChange={set("home.president.heading")}
              className={inputCls}
            />
          </Field>

          {/* Heading Font Size Control */}
          <Field
            label={`Section Heading Font Size: ${fields["home.president.heading_font_size"] || "42"}px`}
            hint="Adjust the font size for the 'President's Welcome' main heading."
          >
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {[
                { label: "Small (34px)", val: "34" },
                { label: "Medium (42px - Default)", val: "42" },
                { label: "Large (50px)", val: "50" },
                { label: "Extra Large (58px)", val: "58" },
              ].map(({ label, val }) => {
                const active = (fields["home.president.heading_font_size"] || "42") === val;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() =>
                      setFields((f) => ({ ...f, "home.president.heading_font_size": val }))
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      active
                        ? "bg-[#7A0C0C] text-white shadow-sm"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="28"
                max="64"
                step="2"
                value={fields["home.president.heading_font_size"] || "42"}
                onChange={(e) =>
                  setFields((f) => ({ ...f, "home.president.heading_font_size": e.target.value }))
                }
                className="w-full accent-[#7A0C0C] cursor-pointer"
              />
              <span className="text-xs font-mono text-gray-500 w-12 text-right">
                {fields["home.president.heading_font_size"] || "42"}px
              </span>
            </div>
          </Field>

          <Field
            label="Welcome message / Body paragraphs"
            hint="Type as many paragraphs as you'd like. Separate paragraphs with a blank line (press Enter twice) to create line gaps on the page."
          >
            <textarea
              value={fields["home.president.body"]}
              onChange={set("home.president.body")}
              rows={8}
              placeholder="Write the welcome message here..."
              className={textareaCls}
            />
          </Field>

          {/* Body Font Size Control */}
          <Field
            label={`Body Text Font Size: ${fields["home.president.body_font_size"] || "15"}px`}
            hint="Adjust the font size of the welcome message body paragraphs."
          >
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {[
                { label: "Compact (14px)", val: "14" },
                { label: "Standard (15px - Default)", val: "15" },
                { label: "Medium (17px)", val: "17" },
                { label: "Large (19px)", val: "19" },
                { label: "Extra Large (22px)", val: "22" },
              ].map(({ label, val }) => {
                const active = (fields["home.president.body_font_size"] || "15") === val;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() =>
                      setFields((f) => ({ ...f, "home.president.body_font_size": val }))
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      active
                        ? "bg-[#7A0C0C] text-white shadow-sm"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="12"
                max="26"
                step="1"
                value={fields["home.president.body_font_size"] || "15"}
                onChange={(e) =>
                  setFields((f) => ({ ...f, "home.president.body_font_size": e.target.value }))
                }
                className="w-full accent-[#7A0C0C] cursor-pointer"
              />
              <span className="text-xs font-mono text-gray-500 w-12 text-right">
                {fields["home.president.body_font_size"] || "15"}px
              </span>
            </div>

            {/* Typography Live Preview */}
            <div className="mt-3 p-5 rounded-xl bg-stone-50 border border-stone-200/80">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block mb-2">
                Live Text Sizing Preview
              </span>
              <h4
                className="font-normal text-gray-900 leading-tight mb-2"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: `${fields["home.president.heading_font_size"] || "42"}px`,
                }}
              >
                {fields["home.president.heading"] || "President's Welcome"}
              </h4>
              <p
                className="text-black leading-relaxed"
                style={{
                  fontSize: `${fields["home.president.body_font_size"] || "15"}px`,
                }}
              >
                On behalf of the brotherhood, it is my pleasure to welcome you to Phi Gamma Nu...
              </p>
            </div>
          </Field>
        </Section>

        <SaveBar saving={saving} status={status} errMsg={errMsg} onSave={handleSave} />
      </div>
    </div>
  );
}

export default function AdminHome() {
  return (
    <LoginGate requireAdmin>
      <AdminHomeContent />
    </LoginGate>
  );
}

// ── Shared sub-components ────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-6">
      <h2 className="text-xs font-bold tracking-[0.18em] uppercase text-[#7A0C0C] mb-6">{title}</h2>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      {hint && <p className="text-xs text-gray-400 -mt-0.5">{hint}</p>}
      {children}
    </div>
  );
}

function SaveBar({ saving, status, errMsg, onSave }: { saving: boolean; status: "idle" | "ok" | "error"; errMsg: string; onSave: () => void }) {
  return (
    <div className="flex items-center gap-4 pt-2">
      <button
        onClick={onSave}
        disabled={saving}
        className="flex items-center gap-2 px-8 py-3 bg-[#7A0C0C] text-white text-sm font-bold tracking-widest uppercase rounded-full hover:bg-[#5C0A0A] transition-colors disabled:opacity-60"
      >
        <Save size={15} />
        {saving ? "Saving…" : "Save Changes"}
      </button>
      {status === "ok" && (
        <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
          <CheckCircle size={15} /> Saved
        </span>
      )}
      {status === "error" && (
        <span className="flex items-center gap-1.5 text-sm text-red-600 font-medium">
          <AlertCircle size={15} /> Failed to save{errMsg ? `: ${errMsg}` : ""}
        </span>
      )}
    </div>
  );
}

const inputCls =
  "border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7A0C0C]/30 focus:border-[#7A0C0C] transition-colors w-full";
const textareaCls =
  "border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7A0C0C]/30 focus:border-[#7A0C0C] transition-colors w-full resize-none";
