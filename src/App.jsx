import { useEffect, useRef, useState } from "react";
import { VIDEO, SITE, EVENTS, CHEST_ITEMS, CHEST, FOOTER } from "./config";

const N = EVENTS.length;
const HERO = -1;          // step -1  = hero
const REVEAL = N;         // step N   = treasure-chest reveal (images)
const FOOTER_STEP = N + 1; // step N+1 = big footer
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function App() {
  const [step, setStep] = useState(HERO);
  const [displayIndex, setDisplayIndex] = useState(0);
  const [mode, setMode] = useState("full");       // "full" | "framed"
  const [videoOn, setVideoOn] = useState(false);
  const [panelsIn, setPanelsIn] = useState(false);
  const [chestIn, setChestIn] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [debugTime, setDebugTime] = useState(0);

  const videoRef = useRef(null);
  const footerRef = useRef(null);
  const s = useRef({ step: HERO, busy: false, cooldown: 0, failed: false });
  const debug = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("debug");
  const forceFallback = typeof window !== "undefined" && (new URLSearchParams(window.location.search).has("fallback") || new URLSearchParams(window.location.search).has("no-video"));

  const setStepBoth = (v) => {
    s.current.step = v;
    setStep(v);
    if (v >= 0 && v < N) {
      setDisplayIndex(v);
    }
  };
  const unlock = () => { s.current.busy = false; s.current.cooldown = Date.now() + 500; };
  const markFailed = () => { if (s.current.failed) return; s.current.failed = true; setVideoFailed(true); };

  // Play the video forward to `target`. If the video has failed to load (poor
  // network / poor device), this just waits the same amount of time instead,
  // so the rest of the scroll choreography stays identical either way.
  const playTo = (target) =>
    new Promise((resolve) => {
      const v = videoRef.current;
      if (s.current.failed || !v) { sleep(900).then(resolve); return; }
      v.playbackRate = VIDEO.playbackRate;

      let resolved = false;
      const done = () => {
        if (!resolved) {
          resolved = true;
          resolve();
        }
      };

      const safetyTimer = setTimeout(() => {
        markFailed();
        done();
      }, 5000);

      const tick = () => {
        if (s.current.failed) {
          clearTimeout(safetyTimer);
          done();
          return;
        }
        if (v.currentTime >= target - 0.03 || v.ended) {
          clearTimeout(safetyTimer);
          v.pause();
          done();
          return;
        }
        requestAnimationFrame(tick);
      };

      const playPromise = v.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => requestAnimationFrame(tick))
          .catch(() => {
            clearTimeout(safetyTimer);
            markFailed();
            done();
          });
      } else {
        requestAnimationFrame(tick);
      }
    });

  // Detect a video that never loads: an explicit error, or simply taking too
  // long (slow network / weak device / iOS low power mode) — either way we fall back to images.
  useEffect(() => {
    if (forceFallback) {
      markFailed();
      return;
    }
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.playsInline = true;

    if (v.readyState >= 3) return;

    const timer = setTimeout(markFailed, 5000);
    const onReady = () => clearTimeout(timer);
    const onErr = () => markFailed();

    v.addEventListener("canplaythrough", onReady);
    v.addEventListener("canplay", onReady);
    v.addEventListener("loadeddata", onReady);
    v.addEventListener("error", onErr);

    return () => {
      clearTimeout(timer);
      v.removeEventListener("canplaythrough", onReady);
      v.removeEventListener("canplay", onReady);
      v.removeEventListener("loadeddata", onReady);
      v.removeEventListener("error", onErr);
    };
  }, []);

  const enterPanel = async (i) => {
    setDisplayIndex(i);
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

    // --- PICTURES MODE: image remains static on event until scrolled ---
    if (s.current.failed) {
      if (cur === HERO) {
        setDisplayIndex(0);
        setStepBoth(0);
        setMode("framed");
        setVideoOn(true);
        await sleep(300);
        setPanelsIn(true);
        await sleep(400);
        unlock();
      } else if (cur >= 0 && cur < N - 1) {
        const nextIdx = cur + 1;
        setPanelsIn(false);
        await sleep(300);
        setDisplayIndex(nextIdx);
        setStepBoth(nextIdx);
        await sleep(200);
        setPanelsIn(true);
        await sleep(400);
        unlock();
      } else if (cur === N - 1) {
        setPanelsIn(false);
        await sleep(300);
        setVideoOn(false);
        setStepBoth(REVEAL);
        await sleep(300);
        setChestIn(true);
        await sleep(500);
        unlock();
      } else if (cur === REVEAL) {
        setChestIn(false);
        await sleep(400);
        setStepBoth(FOOTER_STEP);
        await sleep(600);
        unlock();
      } else unlock();
      return;
    }

    // --- VIDEO MODE: original full cinematic playback ---
    if (cur === HERO) {
      setDisplayIndex(0);
      setVideoOn(true);
      await sleep(900);
      await playTo(EVENTS[0].stopAt);
      await enterPanel(0);
    } else if (cur >= 0 && cur < N - 1) {
      const nextIdx = cur + 1;
      setPanelsIn(false);
      setMode("full");
      await sleep(900);
      setDisplayIndex(nextIdx);
      await playTo(EVENTS[nextIdx].stopAt);
      await enterPanel(nextIdx);
    } else if (cur === N - 1) {
      setPanelsIn(false);
      setMode("full");
      await sleep(900);
      await playTo(videoRef.current?.duration ?? 999); // chest opens on the last frame
      setVideoOn(false);
      setStepBoth(REVEAL);
      await sleep(900);
      setChestIn(true);           // images spill out and settle at the bottom
      await sleep(800);
      unlock();
    } else if (cur === REVEAL) {
      setChestIn(false);
      await sleep(700);
      setStepBoth(FOOTER_STEP);
      await sleep(900);
      unlock();
    } else unlock();
  };

  const goPrev = async () => {
    const cur = s.current.step;
    s.current.busy = true;
    const v = videoRef.current;

    // --- PICTURES MODE ---
    if (s.current.failed) {
      if (cur === FOOTER_STEP) {
        if (footerRef.current) footerRef.current.scrollTop = 0;
        setStepBoth(REVEAL);
        await sleep(200);
        setChestIn(true);
        await sleep(500);
        unlock();
      } else if (cur === REVEAL) {
        setChestIn(false);
        await sleep(300);
        setDisplayIndex(N - 1);
        setStepBoth(N - 1);
        setMode("framed");
        setVideoOn(true);
        await sleep(200);
        setPanelsIn(true);
        await sleep(400);
        unlock();
      } else if (cur > 0) {
        const prevIdx = cur - 1;
        setPanelsIn(false);
        await sleep(300);
        setDisplayIndex(prevIdx);
        setStepBoth(prevIdx);
        await sleep(200);
        setPanelsIn(true);
        await sleep(400);
        unlock();
      } else if (cur === 0) {
        setPanelsIn(false);
        await sleep(300);
        setVideoOn(false);
        setStepBoth(HERO);
        await sleep(400);
        unlock();
      } else unlock();
      return;
    }

    // --- VIDEO MODE ---
    if (cur === FOOTER_STEP) {
      if (footerRef.current) footerRef.current.scrollTop = 0;
      setStepBoth(REVEAL);
      await sleep(300);
      setChestIn(true);
      await sleep(800);
      unlock();
    } else if (cur === REVEAL) {
      setChestIn(false);
      await sleep(700);
      setDisplayIndex(N - 1);
      setMode("framed");
      setVideoOn(true);
      if (v) v.currentTime = EVENTS[N - 1].stopAt;
      setStepBoth(N - 1);
      await sleep(900);
      setPanelsIn(true);
      await sleep(800);
      unlock();
    } else if (cur > 0) {
      const prevIdx = cur - 1;
      setPanelsIn(false);
      setMode("full");
      await sleep(700);
      setDisplayIndex(prevIdx);
      if (v) v.currentTime = EVENTS[prevIdx].stopAt;
      setStepBoth(prevIdx);
      await sleep(300);
      setMode("framed");
      await sleep(700);
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
      if (dir > 0 && cur < FOOTER_STEP) goNext();
      if (dir < 0 && cur > HERO) goPrev();
    };
    const footerAtTop = () => (footerRef.current?.scrollTop ?? 0) <= 0;

    let ty = 0, tTop = true;
    const onWheel = (e) => {
      const inFooter = s.current.step === FOOTER_STEP;
      if (inFooter && !(e.deltaY < 0 && footerAtTop())) return; // native scroll in footer
      e.preventDefault();
      if (Math.abs(e.deltaY) < 8) return;
      intent(e.deltaY > 0 ? 1 : -1);
    };
    const onTouchStart = (e) => { ty = e.touches[0].clientY; tTop = footerAtTop(); };
    const onTouchMove = (e) => { if (s.current.step !== FOOTER_STEP) e.preventDefault(); };
    const onTouchEnd = (e) => {
      const dy = ty - e.changedTouches[0].clientY;
      if (Math.abs(dy) < 40) return;
      if (s.current.step === FOOTER_STEP && !(dy < 0 && tTop)) return;
      intent(dy > 0 ? 1 : -1);
    };
    const onKey = (e) => {
      if (["ArrowDown", "PageDown", " "].includes(e.key)) { if (s.current.step !== FOOTER_STEP) e.preventDefault(); intent(1); }
      if (["ArrowUp", "PageUp"].includes(e.key)) { if (s.current.step !== FOOTER_STEP || footerAtTop()) intent(-1); }
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

  const activeIdx = Math.min(Math.max(step >= 0 ? step : displayIndex, 0), N - 1);
  const ev = EVENTS[activeIdx];

  return (
    <div className="stage">
      <style>{css}</style>

      {/* Video & Poster layers — seamlessly cross-fades posters for each respective event */}
      <div className={`vwrap ${mode} ${videoOn ? "on" : ""}`}>
        <video
          ref={videoRef}
          src={VIDEO.src}
          muted
          playsInline
          preload="auto"
          onError={markFailed}
          style={{ opacity: videoFailed ? 0 : 1 }}
        />
        {EVENTS.map((item, idx) => (
          <img
            key={item.id}
            className="fallback"
            src={item.image}
            alt={item.title}
            style={{
              opacity: videoFailed && idx === displayIndex ? 1 : 0,
              zIndex: idx === displayIndex ? 2 : 1,
            }}
          />
        ))}
        <div className="shade" />
      </div>

      {/* Hero — fades out the moment the video starts, not once the first event arrives */}
      <section className={`hero ${videoOn ? "out" : ""}`}>
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

      {/* Event panels: title on top/left, description + CTA on bottom/right */}
      <div className={`panel top ${panelsIn ? "in" : ""}`}>
        <span className="count">{String(Math.max(step, 0) + 1).padStart(2, "0")} / {String(N).padStart(2, "0")}</span>
        <h2><span>{ev.emoji}</span> {ev.title}</h2>
        <p className="tag">{ev.tagline}</p>
      </div>
      <div className={`panel bottom ${panelsIn ? "in" : ""}`}>
        <p className="desc">{ev.description}</p>
        <a className="cta" href={ev.registerUrl} target="_blank" rel="noreferrer">{SITE.registerLabel}</a>
      </div>

      {/* Treasure-chest reveal: images spill out and settle like items on the ocean floor */}
      <div className={`chest ${chestIn ? "in" : ""}`}>
        <div className="chest-copy">
          <h2>{CHEST.heading}</h2>
          <p>{CHEST.sub}</p>
        </div>
        <div className="chest-row">
          {CHEST_ITEMS.map((it, i) => (
            <a
              key={it.id}
              className="chest-item"
              style={{ transitionDelay: `${i * 90}ms` }}
              href={it.link}
              target="_blank"
              rel="noreferrer"
              aria-label={it.id}
            >
              <img src={it.image} alt={it.id} />
            </a>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className={`footer ${step === FOOTER_STEP ? "in" : ""}`} ref={footerRef}>
        <div className="fin">
          <h2>{FOOTER.heading}</h2>
          <p>{FOOTER.about}</p>
          <h3>Contacts</h3>
          {FOOTER.contacts.map((c) => (
            <div key={c.label} className="row">
              <span>{c.label}</span>
              <b>{c.value}</b>
            </div>
          ))}
          <h3>FAQs</h3>
          {FOOTER.faqs.map((f) => (
            <div key={f.q} className="faq">
              <b>{f.q}</b>
              <p>{f.a}</p>
            </div>
          ))}
          <h3>Links</h3>
          <div className="links">
            {FOOTER.links.map((l) => (
              <a key={l.label} href={l.url} target="_blank" rel="noreferrer">
                {l.label}
              </a>
            ))}
          </div>
          <small>{FOOTER.copyright}</small>
        </div>
      </div>

      {debug && <div className="debug">t = {debugTime.toFixed(2)}s · step {step} · {videoFailed ? "fallback images" : "video"}</div>}
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
.vwrap video,.vwrap .fallback{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;
  transition:opacity .4s ease}
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

/* ---- Treasure-chest reveal ---- */
.chest{position:absolute;inset:0;z-index:7;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;
  gap:18px;padding:24px 16px 8vh;opacity:0;pointer-events:none;transition:opacity .5s ease}
.chest.in{opacity:1;pointer-events:auto}
.chest::before{content:"";position:absolute;inset:0;z-index:-1;
  background:radial-gradient(ellipse at bottom,#0a2f45dd,transparent 65%)}
.chest-copy{text-align:center;max-width:420px}
.chest-copy h2{font-size:clamp(1.8rem,7vw,2.6rem);color:var(--gold)}
.chest-copy p{opacity:.8;font-size:.9rem;margin-top:4px}
.chest-row{display:flex;gap:14px;flex-wrap:wrap;justify-content:center;max-width:92vw}
.chest-item{width:60px;height:60px;border-radius:14px;overflow:hidden;border:2px solid var(--gold);
  background:#04121c;box-shadow:0 10px 24px #000a;opacity:0;transform:translateY(140%);
  transition:transform .7s cubic-bezier(.22,1,.36,1),opacity .5s}
.chest.in .chest-item{opacity:1;transform:translateY(0)}
.chest-item img{width:100%;height:100%;object-fit:cover;display:block}

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

  .chest-item{width:76px;height:76px}
  .chest-copy p{font-size:1rem}

  .fin{max-width:760px}
}
`;