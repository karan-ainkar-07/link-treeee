import { useEffect, useRef, useState } from "react";
import { VIDEO, SITE, EVENTS, FOOTER } from "./config";

const N = EVENTS.length;
const HERO = -1;   // step -1 = hero, 0..N-1 = event panels, N = footer
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function App() {
  const [step, setStep] = useState(HERO);
  const [mode, setMode] = useState("full");       // "full" | "framed"
  const [videoOn, setVideoOn] = useState(false);
  const [panelsIn, setPanelsIn] = useState(false);
  const [debugTime, setDebugTime] = useState(0);

  const videoRef = useRef(null);
  const footerRef = useRef(null);
  const s = useRef({ step: HERO, busy: false, cooldown: 0 });
  const debug = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("debug");

  const setStepBoth = (v) => { s.current.step = v; setStep(v); };
  const unlock = () => { s.current.busy = false; s.current.cooldown = Date.now() + 500; };

  // play video forward from its current time until `target`, then pause exactly there
  const playTo = (target) =>
    new Promise((resolve) => {
      const v = videoRef.current;
      if (!v) return resolve();
      v.playbackRate = VIDEO.playbackRate;
      const tick = () => {
        if (v.currentTime >= target - 0.03 || v.ended) { v.pause(); resolve(); return; }
        requestAnimationFrame(tick);
      };
      v.play().then(() => requestAnimationFrame(tick)).catch(() => { v.currentTime = target; resolve(); });
    });

  const enterPanel = async (i) => {
    setStepBoth(i);
    setMode("framed");            // zoom out
    await sleep(800);
    setPanelsIn(true);            // event panels slide in
    await sleep(800);
    unlock();
  };

  const goNext = async () => {
    const cur = s.current.step;
    s.current.busy = true;
    if (cur === HERO) {
      setVideoOn(true);
      await sleep(900);
      await playTo(EVENTS[0].stopAt);
      await enterPanel(0);
    } else if (cur < N - 1) {
      setPanelsIn(false);
      setMode("full");
      await sleep(900);
      await playTo(EVENTS[cur + 1].stopAt);
      await enterPanel(cur + 1);
    } else if (cur === N - 1) {
      setPanelsIn(false);
      setMode("full");
      await sleep(900);
      await playTo(videoRef.current?.duration ?? 999);
      setStepBoth(N);             // big footer covers everything
      await sleep(900);
      unlock();
    } else unlock();
  };

  const goPrev = async () => {
    const cur = s.current.step;
    s.current.busy = true;
    const v = videoRef.current;
    if (cur === N) {
      if (footerRef.current) footerRef.current.scrollTop = 0;
      setMode("framed");
      if (v) v.currentTime = EVENTS[N - 1].stopAt;
      setStepBoth(N - 1);
      await sleep(900);
      setPanelsIn(true);
      await sleep(800);
      unlock();
    } else if (cur > 0) {
      setPanelsIn(false);
      await sleep(700);
      if (v) v.currentTime = EVENTS[cur - 1].stopAt;
      setStepBoth(cur - 1);
      await sleep(300);
      setPanelsIn(true);
      await sleep(800);
      unlock();
    } else if (cur === 0) {
      setPanelsIn(false);
      await sleep(600);
      setMode("full");
      await sleep(700);
      setVideoOn(false);
      if (v) v.currentTime = 0;
      setStepBoth(HERO);
      await sleep(800);
      unlock();
    } else unlock();
  };

  useEffect(() => {
    const ready = () => !s.current.busy && Date.now() > s.current.cooldown;
    const intent = (dir) => {
      if (!ready()) return;
      const cur = s.current.step;
      if (dir > 0 && cur < N) goNext();
      if (dir < 0 && cur > HERO) goPrev();
    };
    const footerAtTop = () => (footerRef.current?.scrollTop ?? 0) <= 0;

    let ty = 0, tTop = true;
    const onWheel = (e) => {
      const inFooter = s.current.step === N;
      if (inFooter && !(e.deltaY < 0 && footerAtTop())) return; // native scroll in footer
      e.preventDefault();
      if (Math.abs(e.deltaY) < 8) return;
      intent(e.deltaY > 0 ? 1 : -1);
    };
    const onTouchStart = (e) => { ty = e.touches[0].clientY; tTop = footerAtTop(); };
    const onTouchMove = (e) => { if (s.current.step !== N) e.preventDefault(); };
    const onTouchEnd = (e) => {
      const dy = ty - e.changedTouches[0].clientY;
      if (Math.abs(dy) < 40) return;
      if (s.current.step === N && !(dy < 0 && tTop)) return;
      intent(dy > 0 ? 1 : -1);
    };
    const onKey = (e) => {
      if (["ArrowDown", "PageDown", " "].includes(e.key)) { if (s.current.step !== N) e.preventDefault(); intent(1); }
      if (["ArrowUp", "PageUp"].includes(e.key)) { if (s.current.step !== N || footerAtTop()) intent(-1); }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (!debug) return;
    const id = setInterval(() => setDebugTime(videoRef.current?.currentTime ?? 0), 100);
    return () => clearInterval(id);
  }, [debug]);

  const ev = EVENTS[Math.min(Math.max(step, 0), N - 1)];

  return (
    <div className="stage">
      <style>{css}</style>

      {/* Video layer */}
      <div className={`vwrap ${mode} ${videoOn ? "on" : ""}`}>
        <video ref={videoRef} src={VIDEO.src}  playsInline preload="auto" />
        <div className="shade" />
      </div>

      {/* Hero */}
      <section className={`hero ${step === HERO ? "" : "out"}`}>
        <span className="badge">{SITE.badge}</span>
        <h1>{SITE.title}</h1>
        <p className="tag">{SITE.tagline}</p>
        <p className="overview">{SITE.overview}</p>
        <div className="meta">
          {SITE.meta.map((m) => (
            <div key={m.label}><b>{m.value}</b><span>{m.label}</span></div>
          ))}
        </div>
        <div className="hint">{SITE.scrollHint}<i>↓</i></div>
      </section>

      {/* Event panels: title panel + description/CTA panel.
          Mobile: title on top, description on bottom.
          Desktop: title on left, description on right (flanking the video). */}
      <div className={`panel top ${panelsIn ? "in" : ""}`}>
        <span className="count">{String(Math.max(step, 0) + 1).padStart(2, "0")} / {String(N).padStart(2, "0")}</span>
        <h2><span>{ev.emoji}</span> {ev.title}</h2>
        <p className="tag">{ev.tagline}</p>
      </div>
      <div className={`panel bottom ${panelsIn ? "in" : ""}`}>
        <p className="desc">{ev.description}</p>
        <a className="cta" href={ev.registerUrl} target="_blank" rel="noreferrer">{SITE.registerLabel}</a>
      </div>

      {/* Big footer */}
      <footer ref={footerRef} className={`footer ${step === N ? "in" : ""}`}>
        <div className="fin">
          <h2>{FOOTER.heading}</h2>
          <p>{FOOTER.about}</p>
          <h3>Contact</h3>
          {FOOTER.contacts.map((c) => (
            <div className="row" key={c.label}><span>{c.label}</span><b>{c.value}</b></div>
          ))}
          <h3>FAQ</h3>
          {FOOTER.faqs.map((f) => (
            <div className="faq" key={f.q}><b>{f.q}</b><p>{f.a}</p></div>
          ))}
          <h3>Links</h3>
          <div className="links">
            {FOOTER.links.map((l) => <a key={l.label} href={l.url} target="_blank" rel="noreferrer">{l.label}</a>)}
          </div>
          <small>{FOOTER.copyright}</small>
        </div>
      </footer>

      {debug && <div className="debug">t = {debugTime.toFixed(2)}s · step {step}</div>}
    </div>
  );
}

// Mobile-first: base rules below target phones. The one @media block near the
// bottom re-lays-out the video/panels for desktop (video stays centered, the
// two panels move from top/bottom bars to left/right side columns).
const css = `
@import url('https://fonts.googleapis.com/css2?family=Pirata+One&family=Inter:wght@400;600&display=swap');
:root{
  --gold:#f2c14e;--ink:#07141d;--fg:#f4ead5;
  --frame-w:min(94vw,1100px);
  --frame-h:calc(var(--frame-w) * 9 / 16);
}
*{box-sizing:border-box;margin:0}
html,body,#root{height:100%;overflow:hidden;overscroll-behavior:none;background:var(--ink)}
.stage{position:fixed;inset:0;overflow:hidden;color:var(--fg);font-family:Inter,system-ui,sans-serif;touch-action:none;
  background:radial-gradient(circle at 50% 30%,#12324a,var(--ink) 70%)}
h1,h2,h3,.badge{font-family:'Pirata One',Georgia,serif;font-weight:400}

.vwrap{position:absolute;top:50%;left:50%;width:100vw;height:100dvh;overflow:hidden;opacity:0;
  transform:translate(-50%,-50%) scale(1.15);
  transition:width .9s cubic-bezier(.65,0,.35,1),height .9s cubic-bezier(.65,0,.35,1),
    transform 1.2s ease,opacity 1.2s ease,border-radius .9s ease}
.vwrap.on{opacity:1;transform:translate(-50%,-50%) scale(1)}
.vwrap.framed{width:var(--frame-w);height:var(--frame-h);border-radius:14px;border:2px solid var(--gold);
  box-shadow:0 20px 60px #000a}
.vwrap video{width:100%;height:100%;object-fit:cover;display:block}
.shade{position:absolute;inset:0;background:linear-gradient(#0006,#0000 30%,#0000 70%,#0006)}

.hero{position:absolute;inset:0;z-index:5;display:flex;flex-direction:column;justify-content:center;align-items:center;
  text-align:center;padding:24px;gap:14px;transition:opacity .8s,transform .8s}
.hero.out{opacity:0;transform:translateY(-40px);pointer-events:none}
.badge{color:var(--gold);letter-spacing:.08em;font-size:1.1rem}
.hero h1{font-size:clamp(3rem,13vw,6rem);line-height:1;color:var(--gold)}
.tag{opacity:.85;font-size:1.05rem}
.overview{max-width:520px;line-height:1.6;opacity:.75;font-size:.95rem}
.meta{display:flex;gap:22px;margin-top:8px;flex-wrap:wrap;justify-content:center}
.meta div{display:flex;flex-direction:column;gap:2px}
.meta b{color:var(--gold)}.meta span{font-size:.7rem;opacity:.6;text-transform:uppercase;letter-spacing:.1em}
.hint{position:absolute;bottom:28px;font-size:.75rem;letter-spacing:.2em;text-transform:uppercase;opacity:.7;
  display:flex;flex-direction:column;align-items:center;gap:4px;animation:bob 1.6s infinite}
.hint i{font-style:normal;font-size:1.2rem}
@keyframes bob{50%{transform:translateY(6px)}}

/* ---- Mobile-first panels: horizontal bars above/below the video ---- */
.panel{position:absolute;left:0;right:0;z-index:6;padding:18px 22px;background:linear-gradient(#0a1f2e,#0d2a3f);
  display:flex;flex-direction:column;overflow:auto;transition:transform .8s cubic-bezier(.22,1,.36,1)}
.panel.top{top:0;height:calc((100dvh - var(--frame-h))/2);justify-content:flex-end;gap:6px;transform:translateY(-105%)}
.panel.bottom{bottom:0;height:calc((100dvh - var(--frame-h))/2);justify-content:center;gap:14px;transform:translateY(105%)}
.panel.in{transform:none}
.count{color:var(--gold);font-size:.8rem;letter-spacing:.2em}
.panel h2{font-size:clamp(2rem,9vw,3rem);line-height:1;color:var(--gold);display:flex;align-items:center;gap:10px}
.desc{line-height:1.6;font-size:.95rem;opacity:.85;max-width:46ch}
.cta{align-self:flex-start;background:var(--gold);color:var(--ink);font-weight:600;text-decoration:none;
  padding:13px 26px;border-radius:12px;white-space:nowrap}

.footer{position:absolute;inset:0;z-index:10;overflow-y:auto;overscroll-behavior:contain;touch-action:pan-y;
  background:linear-gradient(#07141d,#0a2233);transform:translateY(100%);transition:transform .9s cubic-bezier(.22,1,.36,1)}
.footer.in{transform:none}
.fin{min-height:170dvh;padding:64px 24px 40px;display:flex;flex-direction:column;gap:14px;max-width:640px;margin:auto}
.fin h2{font-size:clamp(2.8rem,12vw,4.5rem);color:var(--gold);line-height:1}
.fin h3{font-size:1.6rem;color:var(--gold);margin-top:28px}
.fin p{opacity:.8;line-height:1.6}
.row{display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid #fff2;padding:10px 0;font-size:.9rem}
.row span{opacity:.6}.row b{text-align:right;font-weight:600}
.faq b{display:block;margin-bottom:2px}.faq{margin-bottom:8px}
.links{display:flex;flex-wrap:wrap;gap:10px}
.links a{color:var(--gold);border:1px solid var(--gold);padding:8px 16px;border-radius:99px;text-decoration:none;font-size:.9rem}
.fin small{margin-top:auto;padding-top:60px;opacity:.5}

.debug{position:absolute;left:8px;top:8px;z-index:99;background:#000a;color:#0f0;font:12px monospace;padding:4px 8px;border-radius:6px}

/* ---- Desktop layout: video shrinks to a fixed max width, panels become
   left/right side columns instead of top/bottom bars ---- */
@media (min-width:900px){
  :root{ --frame-w:min(56vw,880px); }

  .hero{gap:20px;padding:40px}
  .overview{max-width:640px;font-size:1.05rem}
  .meta{gap:40px}

  .panel.top,.panel.bottom{top:0;bottom:auto;height:100dvh;width:min(30vw,380px);padding:48px 40px;justify-content:center}
  .panel.top{left:0;right:auto;align-items:flex-start;transform:translateX(-105%)}
  .panel.bottom{right:0;left:auto;align-items:flex-start;transform:translateX(105%)}
  .panel.in{transform:none}
  .panel h2{font-size:clamp(2.4rem,4vw,3.6rem)}
  .desc{font-size:1.05rem;max-width:34ch}

  .fin{max-width:760px}
}
`;