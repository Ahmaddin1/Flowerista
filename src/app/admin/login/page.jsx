"use client";

import { useEffect, useRef } from "react";

/**
 * Reactive login card — converted 1:1 from the original static HTML/CSS/JS
 * into a React component structure so it can be dropped into a Next.js app.
 *
 * Usage:
 *   import ReactiveLoginCard from '@/components/ReactiveLoginCard';
 *   export default function Page() { return <ReactiveLoginCard />; }
 *
 * Notes:
 * - The CSS is untouched (no Tailwind), just moved into a <style jsx global> block.
 * - All `document.getElementById(...)` lookups from the original script were
 *   replaced with React refs; everything else (state machine, animation loop,
 *   validation, submit handling) is the same logic, just wired up in useEffect.
 * - This is a client component ('use client') because it manipulates the DOM
 *   directly and uses requestAnimationFrame / pointer events.
 */
export default function ReactiveLoginCard() {
  const sceneRef = useRef(null);
  const panelRef = useRef(null);
  const emailRef = useRef(null);
  const passRef = useRef(null);
  const revealRef = useRef(null);
  const submitRef = useRef(null);
  const msgRef = useRef(null);
  const fEmailRef = useRef(null);
  const fPassRef = useRef(null);
  const hEmailRef = useRef(null);
  const hPassRef = useRef(null);

  useEffect(() => {
    const scene = sceneRef.current;
    const panel = panelRef.current;
    const email = emailRef.current;
    const pass = passRef.current;
    const reveal = revealRef.current;
    const submit = submitRef.current;
    const msg = msgRef.current;
    const fEmail = fEmailRef.current;
    const fPass = fPassRef.current;
    const hEmail = hEmailRef.current;
    const hPass = hPassRef.current;

    if (!scene || !panel || !email || !pass || !reveal || !submit || !msg || !fEmail || !fPass || !hEmail || !hPass) return undefined;

    const faces = [...scene.querySelectorAll(".face")];

    const calm =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let rafId = null;
    let blinkTimeoutId = null;
    let blinkInnerTimeoutId = null;
    let blinkStartTimeoutId = null;
    let submitTimeoutId = null;
    let failTimeoutId = null;
    let mounted = true;

    /* each face slides across its body toward whatever it is looking at.
       rest position = the midpoint of that character's eyes, in SVG user units. */
    faces.forEach((f, i) => {
      const eyes = [...f.querySelectorAll(".pupil")];
      f.ox = eyes.reduce((s, e) => s + +e.getAttribute("cx"), 0) / eyes.length;
      f.oy = eyes.reduce((s, e) => s + +e.getAttribute("cy"), 0) / eyes.length;
      f.mx = +f.dataset.mx || 20; // horizontal travel limit
      f.my = +f.dataset.my || 10; // vertical travel limit
      f.cx = +f.dataset.chat || f.ox; // who it glances at in 'chat'
      f.ease = +f.dataset.ease || 0.12; // per-character lag -> parallax
      const char = f.closest(".char");
      f.tilt = char.querySelector(".tilt"); // head lean, pivoting on the feet
      f.pivot = +char.dataset.px;
      f.maxT = +char.dataset.tilt || 3;
      f.phase = i * 1.3; // desync the idle drift
      f.x = f.y = 0;
      f.b = f.bv = 0; // spring for the keystroke nod
    });

    /* ---- screen px -> SVG user units ---- */
    const pt = scene.createSVGPoint();
    function toSvg(x, y) {
      const m = scene.getScreenCTM();
      if (!m) return null;
      pt.x = x;
      pt.y = y;
      return pt.matrixTransform(m.inverse());
    }
    function centerOf(el) {
      const r = el.getBoundingClientRect();
      return toSvg(r.left + r.width / 2, r.top + r.height / 2);
    }

    let mouse = { x: 210, y: 150 }; // in SVG units
    let watch = null; // element they all turn to look at

    const onPointerMove = (e) => {
      const p = toSvg(e.clientX, e.clientY);
      if (p) mouse = p;
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    /* ---- typing activity: keystrokes nod them, a pause makes them read ---- */
    let lastType = -1e9;
    const nodTimeouts = [];

    function nod() {
      lastType = performance.now();
      faces.forEach((f, i) => {
        const id = setTimeout(() => {
          f.bv += 1.6;
        }, i * 55); // ripple
        nodTimeouts.push(id);
      });
    }
    email.addEventListener("input", nod);
    pass.addEventListener("input", nod);

    /* they follow the Log In button when you reach for it */
    const onSubmitEnter = () => {
      watch = submit;
    };
    const onSubmitLeave = () => {
      watch = null;
    };
    submit.addEventListener("pointerenter", onSubmitEnter);
    submit.addEventListener("pointerleave", onSubmitLeave);

    /* aim a face at a point, eased off with distance and clamped to its body */
    function aimAt(f, px, py) {
      const dx = px - f.ox,
        dy = py - f.oy;
      const k = 1 - 1 / (1 + Math.hypot(dx, dy) / 190);
      return [
        Math.max(-f.mx, Math.min(f.mx, dx * k * 0.55)),
        Math.max(-f.my, Math.min(f.my, dy * k * 0.45)),
      ];
    }

    /* ---- render loop ---- */
    function frame() {
      const cl = scene.classList;
      const now = performance.now();
      const look = watch ? centerOf(watch) || mouse : mouse;
      const reading = centerOf(email) || mouse;

      for (const f of faces) {
        let tx = 0,
          ty = 0;

        if (cl.contains("shy")) {
          tx = ty = 0; // eyes shut, face back to centre
        } else if (cl.contains("away")) {
          tx = -f.mx;
          ty = -f.my * 0.3; // password on show -> turn off it
        } else if (cl.contains("chat")) {
          if (now - lastType > 700) {
            // paused -> read what you wrote
            [tx, ty] = aimAt(f, reading.x, reading.y);
          } else {
            const dir = Math.sign(f.cx - f.ox) || 1; // toward its neighbour
            const drift = 0.72 + 0.16 * Math.sin(now / 780 + f.phase);
            tx = dir * f.mx * drift; // never perfectly still
            ty = f.my * (0.22 + 0.12 * Math.sin(now / 610 + f.phase));
          }
        } else {
          [tx, ty] = aimAt(f, look.x, look.y); // idle -> follow the cursor
        }

        f.x += (tx - f.x) * f.ease;
        f.y += (ty - f.y) * f.ease;

        // keystroke nod: a damped spring that squashes the body toward its feet
        f.bv += (0 - f.b) * 0.28;
        f.bv *= 0.74;
        f.b += f.bv;

        const amount = f.x / f.mx; // -1 .. 1, how far it is looking
        // the head leans the way it looks, pivoting on the feet
        const lean = amount * f.maxT;
        const sy = 1 - f.b * 0.032;
        f.tilt.setAttribute(
          "transform",
          `rotate(${lean.toFixed(2)} ${f.pivot} 368) ` +
            `translate(${f.pivot} 368) scale(1 ${sy.toFixed(4)}) translate(${-f.pivot} -368)`,
        );
        // and the face rolls a little inside the head — secondary motion
        const roll = amount * 2;
        f.setAttribute(
          "transform",
          `translate(${f.x.toFixed(2)} ${f.y.toFixed(2)}) rotate(${roll.toFixed(2)} ${f.ox} ${f.oy})`,
        );
      }
      rafId = requestAnimationFrame(frame);
    }
    rafId = requestAnimationFrame(frame);

    /* ---- idle blinking ---- */
    function blink() {
      if (!mounted) return;
      if (!scene.classList.contains("shy")) {
        scene.classList.add("blink");
        blinkInnerTimeoutId = setTimeout(
          () => scene.classList.remove("blink"),
          120,
        );
        if (Math.random() < 0.28)
          setTimeout(() => {
            // occasional double blink
            scene.classList.add("blink");
            setTimeout(() => scene.classList.remove("blink"), 110);
          }, 250);
      }
      blinkTimeoutId = setTimeout(blink, 2400 + Math.random() * 4200);
    }
    if (!calm) blinkStartTimeoutId = setTimeout(blink, 1800);

    /* ---- state machine ---- */
    function setState(s) {
      scene.classList.remove("shy", "away", "chat", "err", "win");
      if (s) scene.classList.add(s);
    }
    function restingState() {
      // password visible on screen -> they turn away rather than read it
      if (
        pass.type === "text" &&
        (pass.value || document.activeElement === pass)
      )
        return "away";
      if (document.activeElement === pass) return "shy"; // typing it masked -> eyes shut
      if (document.activeElement === email) return "chat"; // typing the email -> look at each other
      return null; // idle -> follow the cursor
    }
    const refresh = () => setState(restingState());

    const events = ["focus", "blur", "input"];
    events.forEach((ev) => {
      email.addEventListener(ev, refresh);
      pass.addEventListener(ev, refresh);
    });

    /* ---- helpers ---- */
    function help(el, field, text, note) {
      el.textContent = text || "";
      el.classList.toggle("show", !!text);
      el.classList.toggle("note", !!note);
      field.classList.toggle("invalid", !!text && !note);
    }
    function say(text, ok) {
      msg.textContent = text;
      msg.classList.toggle("ok", !!ok);
      msg.classList.add("show");
    }
    const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

    const onEmailBlur = () => {
      if (email.value.trim() && !validEmail(email.value))
        help(hEmail, fEmail, "Enter a valid email address.");
    };
    const onEmailInput = () => help(hEmail, fEmail, "");
    email.addEventListener("blur", onEmailBlur);
    email.addEventListener("input", onEmailInput);

    const onPassInput = () => {
      if (fPass.classList.contains("invalid")) help(hPass, fPass, "");
    };
    pass.addEventListener("input", onPassInput);

    /* caps lock warning — the classic "why is my password wrong" bug */
    const caps = (e) => {
      if (typeof e.getModifierState !== "function") return;
      const on = e.getModifierState("CapsLock");
      if (on) help(hPass, fPass, "Caps Lock is on", true);
      else if (hPass.classList.contains("note")) help(hPass, fPass, "");
    };
    pass.addEventListener("keydown", caps);
    pass.addEventListener("keyup", caps);
    const onPassBlur = () => {
      if (hPass.classList.contains("note")) help(hPass, fPass, "");
    };
    pass.addEventListener("blur", onPassBlur);

    /* ---- reveal toggle ---- */
    const onRevealClick = () => {
      const showing = pass.type === "text";
      pass.type = showing ? "password" : "text";
      reveal.setAttribute("aria-pressed", String(!showing));
      reveal.setAttribute(
        "aria-label",
        showing ? "Show password" : "Hide password",
      );
      pass.focus();
      refresh();
    };
    reveal.addEventListener("click", onRevealClick);

    /* ---- submit ---- */
    let busy = false;

    function fail(text) {
      setState("err");
      if (text) say(text);
      panel.classList.remove("shake");
      void panel.offsetWidth; // restart the animation
      panel.classList.add("shake");
      failTimeoutId = setTimeout(() => {
        if (scene.classList.contains("err")) refresh();
      }, 1500);
    }

    const onSubmit = (e) => {
      e.preventDefault();
      if (busy) return;
      msg.classList.remove("show");

      if (!validEmail(email.value)) {
        help(hEmail, fEmail, "Enter a valid email address.");
        email.focus();
        return fail();
      }
      if (!pass.value) {
        help(hPass, fPass, "Enter your password.");
        pass.focus();
        return fail();
      }

      busy = true;
      submit.classList.add("loading");
      submit.disabled = true;
      watch = null;

      fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.value, password: pass.value }),
      })
        .then((res) => res.json())
        .then((data) => {
          busy = false;
          submit.classList.remove("loading");
          submit.disabled = false;
          if (data.success) {
            setState("win");
            say("Welcome back!", true);
            submitTimeoutId = setTimeout(() => {
              window.location.href = "/admin";
            }, 1000);
          } else {
            help(hPass, fPass, data.error || "Incorrect email or password.");
            fail(data.error || "Incorrect email or password.");
          }
        })
        .catch(() => {
          busy = false;
          submit.classList.remove("loading");
          submit.disabled = false;
          fail("An error occurred. Please try again.");
        });
    };
    panel.addEventListener("submit", onSubmit);

    /* ---- cleanup ---- */
    return () => {
      mounted = false;
      if (rafId) cancelAnimationFrame(rafId);
      if (blinkTimeoutId) clearTimeout(blinkTimeoutId);
      if (blinkInnerTimeoutId) clearTimeout(blinkInnerTimeoutId);
      if (blinkStartTimeoutId) clearTimeout(blinkStartTimeoutId);
      if (submitTimeoutId) clearTimeout(submitTimeoutId);
      if (failTimeoutId) clearTimeout(failTimeoutId);
      nodTimeouts.forEach(clearTimeout);

      window.removeEventListener("pointermove", onPointerMove);
      email.removeEventListener("input", nod);
      pass.removeEventListener("input", nod);
      submit.removeEventListener("pointerenter", onSubmitEnter);
      submit.removeEventListener("pointerleave", onSubmitLeave);
      events.forEach((ev) => {
        email.removeEventListener(ev, refresh);
        pass.removeEventListener(ev, refresh);
      });
      email.removeEventListener("blur", onEmailBlur);
      email.removeEventListener("input", onEmailInput);
      pass.removeEventListener("input", onPassInput);
      pass.removeEventListener("keydown", caps);
      pass.removeEventListener("keyup", caps);
      pass.removeEventListener("blur", onPassBlur);
      reveal.removeEventListener("click", onRevealClick);
      panel.removeEventListener("submit", onSubmit);
    };
  }, []);

  return (
    <>
      <div className="card">
        {/* ============ illustration ============ */}
        <div className="stage">
          {/* viewBox matches the reference panel (395 x 485); ground line sits at y = 368 */}
          <svg
            ref={sceneRef}
            className="scene"
            id="scene"
            viewBox="0 0 395 485"
            preserveAspectRatio="xMinYMax meet"
            aria-hidden="true"
          >
            <defs>
              <filter id="soft" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="7" />
              </filter>
              <filter id="tight" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="3.5" />
              </filter>
              <filter id="glow" x="-45%" y="-45%" width="190%" height="190%">
                <feGaussianBlur stdDeviation="9" />
              </filter>
              {/* the ground line: leaning or squashing can never poke through it */}
              <clipPath id="floor">
                <rect x="-60" y="-140" width="520" height="508" />
              </clipPath>
            </defs>

            {/* contact shadows: one soft ambient band + a tighter one per character */}
            <g className="shadows">
              <ellipse
                cx="196"
                cy="373"
                rx="146"
                ry="8"
                fill="#8d8d93"
                opacity=".42"
                filter="url(#soft)"
              />
              <ellipse
                className="shadow"
                cx="181"
                cy="369"
                rx="54"
                ry="5.5"
                fill="#5f5f68"
                opacity=".5"
                filter="url(#tight)"
              />
              <ellipse
                className="shadow"
                cx="236"
                cy="369"
                rx="35"
                ry="5"
                fill="#5f5f68"
                opacity=".55"
                filter="url(#tight)"
              />
              <ellipse
                className="shadow"
                cx="288"
                cy="369"
                rx="39"
                ry="5.5"
                fill="#5f5f68"
                opacity=".5"
                filter="url(#tight)"
              />
              <ellipse
                className="shadow"
                cx="151"
                cy="369"
                rx="92"
                ry="6.5"
                fill="#5f5f68"
                opacity=".45"
                filter="url(#tight)"
              />
            </g>

            {/* stacking order, back to front: purple, black, yellow, orange.
                nesting per character:
                  .char    state moves      (CSS)
                  .breathe idle breathing   (CSS animation)
                  .pose    shape deform     (CSS, per state)
                  .tilt    head lean        (JS, follows the look direction) */}

            <g clipPath="url(#floor)">
              <g id="purple" className="char" data-px="181.5" data-tilt="2.2">
                <g className="breathe">
                  <g className="pose">
                    <g className="tilt">
                      <rect
                        x="133"
                        y="151"
                        width="97"
                        height="86"
                        rx="12"
                        fill="#ff5fdc"
                        opacity=".38"
                        filter="url(#glow)"
                      />
                      <rect
                        x="131"
                        y="149"
                        width="101"
                        height="219"
                        rx="11"
                        fill="#5b21ea"
                      />
                      <g
                        className="face"
                        data-mx="20"
                        data-my="11"
                        data-chat="245"
                        data-ease=".085"
                      >
                        <circle
                          className="pupil"
                          cx="167"
                          cy="177"
                          r="4"
                          fill="#17171a"
                        />
                        <circle
                          className="pupil"
                          cx="196"
                          cy="177"
                          r="4"
                          fill="#17171a"
                        />
                        <path
                          className="mouth m-frown"
                          d="M167 206 Q181.5 192 196 206"
                        />
                        <path
                          className="mouth m-think"
                          d="M170 205 Q181.5 199 193 203"
                          strokeWidth="4.5"
                        />
                        <path
                          className="mouth m-grin"
                          d="M167 196 Q181.5 212 196 196"
                        />
                      </g>
                    </g>
                  </g>
                </g>
              </g>

              <g id="black" className="char" data-px="235.5" data-tilt="2">
                <g className="breathe">
                  <g className="pose">
                    <g className="tilt">
                      <rect
                        x="205"
                        y="214"
                        width="61"
                        height="154"
                        rx="4"
                        fill="#17171a"
                      />
                      <g
                        className="face"
                        data-mx="12"
                        data-my="9"
                        data-chat="160"
                        data-ease=".105"
                      >
                        <circle
                          className="pupil"
                          cx="224.5"
                          cy="234"
                          r="5"
                          fill="#fff"
                        />
                        <circle
                          className="pupil"
                          cx="246.5"
                          cy="234"
                          r="5"
                          fill="#fff"
                        />
                      </g>
                    </g>
                  </g>
                </g>
              </g>

              <g id="yellow" className="char" data-px="287.5" data-tilt="2.6">
                <g className="breathe">
                  <g className="pose">
                    <g className="tilt">
                      <path
                        d="M253 368 V288.5 a34.5 34.5 0 0 1 69 0 V368 z"
                        fill="#f5c518"
                      />
                      <path
                        d="M319 294 H345"
                        stroke="#17171a"
                        strokeWidth="5.5"
                        strokeLinecap="round"
                        fill="none"
                      />
                      <g
                        className="face"
                        data-mx="11"
                        data-my="8"
                        data-chat="230"
                        data-ease=".12"
                      >
                        <circle
                          className="pupil"
                          cx="301"
                          cy="276"
                          r="3.6"
                          fill="#17171a"
                        />
                        <path
                          className="mouth m-frown"
                          d="M281 312 q7.5 -9 15 0 t15 0"
                          strokeWidth="4.5"
                        />
                        <path
                          className="mouth m-think"
                          d="M283 310 q7 -7 14 0"
                          strokeWidth="4.5"
                        />
                        <path
                          className="mouth m-peek"
                          d="M281 310 q7.5 -9 15 0 t15 0"
                          strokeWidth="4.5"
                        />
                      </g>
                    </g>
                  </g>
                </g>
              </g>

              <g id="orange" className="char" data-px="151" data-tilt="1">
                <g className="breathe">
                  <g className="pose">
                    <g className="tilt">
                      <path d="M63 368 a88 88 0 0 1 176 0 z" fill="#f7690f" />
                      <g
                        className="face"
                        data-mx="30"
                        data-my="10"
                        data-chat="250"
                        data-ease=".15"
                      >
                        <circle
                          className="pupil"
                          cx="137"
                          cy="300"
                          r="4.2"
                          fill="#17171a"
                        />
                        <circle
                          className="pupil"
                          cx="165"
                          cy="300"
                          r="4.2"
                          fill="#17171a"
                        />
                        <path
                          className="mouth m-smile"
                          d="M142 320 Q151 331 160 320"
                          strokeWidth="5"
                        />
                        <path
                          className="mouth m-grin"
                          d="M139 318 Q151 334 163 318"
                          strokeWidth="5"
                        />
                        <path
                          className="mouth m-think"
                          d="M143 322 Q151 318 159 323"
                          strokeWidth="5"
                        />
                        <path
                          className="mouth m-peek"
                          d="M143 322 Q151 329 159 322"
                          strokeWidth="5"
                        />
                        <path
                          className="mouth m-flat"
                          d="M143 324 H159"
                          strokeWidth="5"
                        />
                        <path
                          className="mouth m-frown"
                          d="M142 330 Q151 319 160 330"
                          strokeWidth="5"
                        />
                      </g>
                    </g>
                  </g>
                </g>
              </g>
            </g>
          </svg>
        </div>

        {/* ============ form ============ */}
        <form className="panel" id="panel" ref={panelRef} noValidate>
          <svg className="logo" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 0c1 8 4 11 12 12-8 1-11 4-12 12-1-8-4-11-12-12C8 11 11 8 12 0z" />
          </svg>

          <h1>Welcome back!</h1>
          <p className="sub">Please enter your details</p>

          <div className="field" id="f-email" ref={fEmailRef}>
            <input
              ref={emailRef}
              id="email"
              type="email"
              placeholder=" "
              autoComplete="email"
            />
            <label htmlFor="email">Email</label>
            <p className="help" id="h-email" ref={hEmailRef}></p>
          </div>

          <div className="field" id="f-pass" ref={fPassRef}>
            <input
              ref={passRef}
              id="password"
              type="password"
              placeholder=" "
              autoComplete="current-password"
            />
            <label htmlFor="password">Password</label>
            <button
              ref={revealRef}
              className="reveal"
              id="reveal"
              type="button"
              aria-pressed="false"
              aria-label="Show password"
            >
              <svg
                className="on"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <svg
                className="off"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M3 3l18 18M10.6 10.7a3 3 0 004.2 4.2M9.4 5.4A9.6 9.6 0 0112 5c7 0 10.5 7 10.5 7a17 17 0 01-3.4 4.3M6.2 6.7A16.8 16.8 0 001.5 12S5 19 12 19c1.2 0 2.2-.2 3.2-.5" />
              </svg>
            </button>
            <p className="help" id="h-pass" ref={hPassRef}></p>
          </div>

          <div className="row">
            <label>
              <input type="checkbox" defaultChecked /> Remember for 7 days
            </label>
          </div>

          <button className="primary" id="submit" ref={submitRef} type="submit">
            <span className="txt">Log In</span>
            <span className="spinner" aria-hidden="true"></span>
          </button>

          <button className="google" type="button">
            <svg viewBox="0 0 48 48" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M45.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11.8c-.5 2.8-2 5.1-4.4 6.7v5.5h7.1c4.1-3.8 6.6-9.4 6.6-16.2z"
              />
              <path
                fill="#34A853"
                d="M24 46c6 0 11-2 14.6-5.3l-7.1-5.5c-2 1.3-4.5 2.1-7.5 2.1-5.8 0-10.6-3.9-12.4-9.1H4.3v5.7C7.9 41.1 15.4 46 24 46z"
              />
              <path
                fill="#FBBC05"
                d="M11.6 28.2c-.5-1.3-.7-2.7-.7-4.2s.3-2.9.7-4.2v-5.7H4.3A22 22 0 002 24c0 3.6.9 6.9 2.3 9.9l7.3-5.7z"
              />
              <path
                fill="#EA4335"
                d="M24 10.7c3.3 0 6.2 1.1 8.5 3.3l6.3-6.3C35 4.1 30 2 24 2 15.4 2 7.9 6.9 4.3 14.1l7.3 5.7c1.8-5.2 6.6-9.1 12.4-9.1z"
              />
            </svg>
            Log in with Google
          </button>

          <p
            className="msg"
            id="msg"
            role="status"
            aria-live="polite"
            ref={msgRef}
          ></p>
        </form>
      </div>
      <style jsx global>{`
        *,
        *::before,
        *::after {
          box-sizing: border-box;
        }

        :root {
          --page: #16161a;
          --stage: #eaeaec;
          --card: #ffffff;
          --ink: #0d0d0f;
          --body: #4a4a52;
          --muted: #9a9aa2;
          --line: #dcdce1;
          --danger: #e5484d;
          --ok: #17803d;
          --focus: #5b21ea;
        }

        html,
        body {
          height: 100%;
        }
        body {
          margin: 0;
          background: radial-gradient(
            120% 90% at 50% 0%,
            #26262c 0%,
            var(--page) 60%
          );
          color: var(--ink);
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 24px;
        }

        /* ---------- card ---------- */
        .card {
          width: min(1060px, 100%);
          display: grid;
          grid-template-columns: 1.35fr 1fr;
          background: var(--card);
          border-radius: 22px;
          overflow: hidden;
          box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.06) inset,
            0 50px 100px -40px rgba(0, 0, 0, 0.75),
            0 8px 30px -12px rgba(0, 0, 0, 0.45);
        }

        .stage {
          position: relative;
          min-height: 580px;
          background: radial-gradient(
            90% 70% at 42% 30%,
            #f3f3f5 0%,
            var(--stage) 70%
          );
        }
        /* the scene fills the panel — its viewBox already carries the framing */
        .stage svg.scene {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          display: block;
        }

        .panel {
          padding: 56px 54px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        /* ---------- header ---------- */
        .logo {
          width: 27px;
          height: 27px;
          margin: 0 auto 26px;
          display: block;
          fill: var(--ink);
        }
        h1 {
          margin: 0;
          font-size: 31px;
          line-height: 1.1;
          letter-spacing: -0.025em;
          text-align: center;
          font-weight: 700;
        }
        .sub {
          margin: 9px 0 36px;
          text-align: center;
          font-size: 13px;
          color: var(--muted);
        }

        /* ---------- fields ---------- */
        .field {
          position: relative;
          margin-bottom: 38px;
        }
        .field input {
          width: 100%;
          border: 0;
          border-bottom: 1.5px solid var(--line);
          background: transparent;
          font: inherit;
          font-size: 15px;
          color: var(--ink);
          padding: 20px 36px 9px 0;
          outline: none;
          transition: border-color 0.2s ease;
        }
        .field label {
          position: absolute;
          left: 0;
          top: 20px;
          font-size: 15px;
          color: var(--muted);
          pointer-events: none;
          transform-origin: left top;
          transition:
            transform 0.2s cubic-bezier(0.2, 0.8, 0.3, 1),
            font-size 0.2s,
            color 0.2s;
        }
        .field input:focus + label,
        .field input:not(:placeholder-shown) + label {
          transform: translateY(-19px);
          font-size: 11.5px;
          color: #6f6f78;
        }
        /* no layout shift: the shadow thickens the rule instead of the border width */
        .field input:focus {
          border-bottom-color: var(--ink);
          box-shadow: 0 1px 0 var(--ink);
        }
        .field.invalid input {
          border-bottom-color: var(--danger);
        }
        .field.invalid input:focus + label,
        .field.invalid input:not(:placeholder-shown) + label {
          color: var(--danger);
        }

        /* helper line under a field — absolute so the layout never jumps */
        .help {
          position: absolute;
          left: 0;
          top: calc(100% + 5px);
          font-size: 11px;
          line-height: 1.3;
          color: var(--danger);
          opacity: 0;
          transform: translateY(-3px);
          transition:
            opacity 0.18s ease,
            transform 0.18s ease;
        }
        .help.show {
          opacity: 1;
          transform: none;
        }
        .help.note {
          color: #8a6d00;
        }

        .reveal {
          position: absolute;
          right: -6px;
          bottom: 2px;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: none;
          border: 0;
          cursor: pointer;
          color: #7c7c86;
          padding: 0;
          transition:
            background 0.18s,
            color 0.18s;
        }
        .reveal:hover {
          background: #f2f2f5;
          color: var(--ink);
        }
        .reveal svg {
          width: 18px;
          height: 18px;
        }
        .reveal .off {
          display: none;
        }
        .reveal[aria-pressed="true"] .on {
          display: none;
        }
        .reveal[aria-pressed="true"] .off {
          display: block;
        }

        /* ---------- row ---------- */
        .row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 12.5px;
          margin: 2px 0 28px;
        }
        .row label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--body);
          cursor: pointer;
        }
        .row input[type="checkbox"] {
          accent-color: var(--ink);
          width: 15px;
          height: 15px;
          margin: 0;
          cursor: pointer;
        }
        .row a {
          color: #6f6f78;
          text-decoration: none;
          transition: color 0.15s;
        }
        .row a:hover {
          color: var(--ink);
        }

        /* ---------- buttons ---------- */
        button.primary,
        button.google {
          position: relative;
          width: 100%;
          height: 50px;
          border-radius: 999px;
          font: inherit;
          font-size: 14.5px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition:
            transform 0.14s cubic-bezier(0.2, 0.8, 0.3, 1),
            background 0.2s,
            box-shadow 0.2s,
            opacity 0.2s;
        }
        button.primary {
          background: var(--ink);
          color: #fff;
          border: 0;
          margin-bottom: 14px;
          box-shadow: 0 6px 16px -8px rgba(0, 0, 0, 0.7);
        }
        button.primary:hover:not(:disabled) {
          background: #26262b;
          transform: translateY(-1px);
          box-shadow: 0 12px 22px -10px rgba(0, 0, 0, 0.75);
        }
        button.primary:active:not(:disabled) {
          transform: translateY(0) scale(0.985);
        }
        button.primary:disabled {
          cursor: default;
          opacity: 0.85;
        }

        button.google {
          background: #fff;
          color: var(--ink);
          border: 1.5px solid var(--line);
        }
        button.google:hover {
          background: #f7f7f9;
          transform: translateY(-1px);
        }
        button.google svg {
          width: 18px;
          height: 18px;
        }

        :is(button, a, input[type="checkbox"]):focus-visible {
          outline: 2px solid var(--focus);
          outline-offset: 3px;
          border-radius: 6px;
        }

        /* spinner inside the primary button */
        .spinner {
          position: absolute;
          width: 19px;
          height: 19px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.35);
          border-top-color: #fff;
          opacity: 0;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        .primary.loading .txt {
          opacity: 0;
        }
        .primary.loading .spinner {
          opacity: 1;
        }
        .txt {
          transition: opacity 0.15s;
        }

        /* ---------- messages ---------- */
        .msg {
          min-height: 20px;
          margin: 16px 0 0;
          font-size: 12.5px;
          text-align: center;
          color: var(--danger);
          opacity: 0;
          transform: translateY(-3px);
          transition:
            opacity 0.2s,
            transform 0.2s;
        }
        .msg.show {
          opacity: 1;
          transform: none;
        }
        .msg.ok {
          color: var(--ok);
        }

        .foot {
          margin-top: 38px;
          text-align: center;
          font-size: 12.5px;
          color: var(--muted);
        }
        .foot a {
          color: var(--ink);
          font-weight: 600;
          text-decoration: none;
        }
        .foot a:hover {
          text-decoration: underline;
        }

        .hint {
          margin: 18px 0 0;
          text-align: center;
          font-size: 11px;
          color: #b8b8c0;
        }
        .hint code {
          background: #f3f3f5;
          padding: 2px 6px;
          border-radius: 5px;
          color: var(--body);
        }

        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          18% {
            transform: translateX(-8px);
          }
          36% {
            transform: translateX(7px);
          }
          54% {
            transform: translateX(-4px);
          }
          78% {
            transform: translateX(2px);
          }
        }
        .panel.shake {
          animation: shake 0.45s ease;
        }

        /* ================= characters ================= */
        /* every transform layer pivots on that character's feet, in viewBox units */
        .char,
        .breathe,
        .pose {
          transform-box: view-box;
        }
        #purple,
        #purple .breathe,
        #purple .pose {
          transform-origin: 181.5px 368px;
        }
        #black,
        #black .breathe,
        #black .pose {
          transform-origin: 235.5px 368px;
        }
        #yellow,
        #yellow .breathe,
        #yellow .pose {
          transform-origin: 287.5px 368px;
        }
        #orange,
        #orange .breathe,
        #orange .pose {
          transform-origin: 151px 368px;
        }

        .char {
          transition: transform 0.5s cubic-bezier(0.34, 1.4, 0.64, 1);
        }
        /* .pose carries the shape change; .tilt inside it is driven per-frame by JS */
        .pose {
          transition: transform 0.55s cubic-bezier(0.34, 1.35, 0.6, 1);
        }

        .breathe {
          animation: breathe 4.4s ease-in-out 1.1s infinite;
        }
        @keyframes breathe {
          0%,
          100% {
            transform: translateY(0) scaleY(1);
          }
          50% {
            transform: translateY(-2.5px) scaleY(1.012);
          }
        }
        #purple .breathe {
          animation-duration: 4.9s;
          animation-delay: 1.25s;
        }
        #black .breathe {
          animation-duration: 4.1s;
          animation-delay: 1.4s;
        }
        #yellow .breathe {
          animation-duration: 4.6s;
          animation-delay: 1.15s;
        }

        .pupil {
          transform-box: fill-box;
          transform-origin: center;
          transition: transform 0.18s ease;
        }
        .mouth {
          fill: none;
          stroke: #17171a;
          stroke-width: 5;
          stroke-linecap: round;
          stroke-linejoin: round;
          opacity: 0;
          transition: opacity 0.24s ease;
        }
        .m-smile {
          opacity: 1;
        }
        .shadow {
          transition:
            opacity 0.4s ease,
            transform 0.4s ease;
        }

        /* blink — fires on a random idle timer */
        #scene.blink .pupil {
          transform: scaleY(0.1);
          transition-duration: 0.07s;
        }

        /* ---- chat: thinking about what you are typing ----
           they lean in toward each other and the bodies squash/skew with the lean */
        #scene.chat .m-smile {
          opacity: 0;
        }
        #scene.chat .m-think {
          opacity: 1;
        }
        #scene.chat #purple .pose {
          transform: rotate(2deg) skewX(-2deg) scale(1.015, 0.978);
        }
        #scene.chat #black .pose {
          transform: rotate(-1.8deg) skewX(1.5deg) scale(1.025, 0.975);
        }
        #scene.chat #yellow .pose {
          transform: rotate(-2.6deg) skewX(2deg) scale(1.02, 0.975);
        }
        #scene.chat #orange .pose {
          transform: rotate(0.8deg) scale(1.03, 0.96);
        }

        /* ---- shy: eyes squeezed shut while a password is typed ---- */
        #scene.shy .pupil {
          transform: scaleY(0.12);
        }
        #scene.shy .m-smile {
          opacity: 0;
        }
        #scene.shy .m-flat {
          opacity: 1;
        }
        #scene.shy #purple {
          transform: translateX(-7px);
        }
        #scene.shy #yellow {
          transform: translateX(7px);
        }
        /* hunched down, shoulders up */
        #scene.shy #purple .pose {
          transform: scale(1.045, 0.94);
        }
        #scene.shy #black .pose {
          transform: scale(1.05, 0.945);
        }
        #scene.shy #yellow .pose {
          transform: scale(1.04, 0.95);
        }
        #scene.shy #orange .pose {
          transform: scale(1.03, 0.955);
        }

        /* ---- away: password is on screen, so they turn their faces off it ---- */
        #scene.away .m-smile {
          opacity: 0;
        }
        #scene.away .m-flat {
          opacity: 1;
        }
        #scene.away #purple {
          transform: translateX(-7px);
        }
        #scene.away #yellow {
          transform: translateX(-9px);
        }
        #scene.away #black {
          transform: translateX(-4px);
        }
        /* leaning back and away */
        #scene.away #purple .pose {
          transform: rotate(-2.2deg) skewX(1.8deg);
        }
        #scene.away #black .pose {
          transform: rotate(-2deg) skewX(1.5deg);
        }
        #scene.away #yellow .pose {
          transform: rotate(-2.8deg) skewX(2deg);
        }
        #scene.away #orange .pose {
          transform: rotate(-1deg) scale(1.015, 0.978);
        }

        /* ---- err: the whole group slumps ---- */
        #scene.err .m-smile,
        #scene.err .m-flat,
        #scene.err .m-peek,
        #scene.err .m-think {
          opacity: 0;
        }
        #scene.err .m-frown {
          opacity: 1;
        }
        #scene.err #purple .pose {
          transform: scale(1.06, 0.9) skewX(2deg);
        }
        #scene.err #black .pose {
          transform: scale(1.05, 0.92) skewX(1.5deg);
        }
        #scene.err #yellow .pose {
          transform: scale(1.05, 0.92) skewX(1.5deg);
        }
        #scene.err #orange .pose {
          transform: scale(1.04, 0.93);
        }
        #scene.err .shadow {
          opacity: 0.8;
          transform: scaleX(1.04);
        }

        /* ---- win: everyone stretches up and hops ---- */
        #scene.win .m-smile {
          opacity: 0;
        }
        #scene.win .m-grin {
          opacity: 1;
        }
        #scene.win .pose {
          transform: scale(0.975, 1.04);
        }
        #scene.win .breathe {
          animation: hop 0.62s cubic-bezier(0.28, 1.5, 0.5, 1);
        }
        #scene.win #black .breathe {
          animation-delay: 0.07s;
        }
        #scene.win #yellow .breathe {
          animation-delay: 0.14s;
        }
        #scene.win #orange .breathe {
          animation-delay: 0.2s;
        }
        #scene.win .shadow {
          opacity: 0.35;
          transform: scaleX(0.88);
        }
        @keyframes hop {
          0% {
            transform: translateY(0) scaleY(1);
          }
          28% {
            transform: translateY(-26px) scaleY(1.06);
          }
          62% {
            transform: translateY(0) scaleY(0.92);
          }
          100% {
            transform: translateY(0) scaleY(1);
          }
        }

        /* intro */
        @keyframes drop-in {
          0% {
            transform: translate(var(--dx), var(--dy)) rotate(var(--dr));
            opacity: 0;
          }
          55% {
            opacity: 1;
          }
          78% {
            transform: translateY(0) scale(1.05, 0.92);
          }
          100% {
            transform: none;
            opacity: 1;
          }
        }
        .char {
          animation: drop-in 0.8s cubic-bezier(0.22, 1.1, 0.36, 1) backwards;
        }
        #purple {
          --dx: -40px;
          --dy: -200px;
          --dr: -32deg;
          animation-delay: 0.05s;
        }
        #yellow {
          --dx: 70px;
          --dy: -160px;
          --dr: 28deg;
          animation-delay: 0.16s;
        }
        #black {
          --dx: 10px;
          --dy: -240px;
          --dr: 16deg;
          animation-delay: 0.27s;
        }
        #orange {
          --dx: -80px;
          --dy: 130px;
          --dr: -18deg;
          animation-delay: 0.38s;
        }
        @keyframes shadow-in {
          from {
            opacity: 0;
            transform: scaleX(0.6);
          }
        }
        .shadows {
          animation: shadow-in 0.9s ease 0.5s backwards;
        }

        @media (prefers-reduced-motion: reduce) {
          .char,
          .breathe,
          .pose,
          .pupil,
          .face,
          .mouth,
          .shadows,
          .spinner {
            animation: none !important;
            transition: none !important;
          }
        }

        @media (max-width: 880px) {
          .card {
            grid-template-columns: 1fr;
          }
          .stage {
            min-height: 320px;
            order: -1;
          }
          .panel {
            padding: 38px 28px 46px;
          }
        }
      `}</style>
    </>
  );
}

// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";

// export default function AdminLoginPage() {
//   const router = useRouter();
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const handleLogin = async () => {
//     setLoading(true);
//     setError("");

//     try {
//       const res = await fetch("/api/admin/auth/login", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email, password }),
//       });

//       const data = await res.json();

//       if (data.success) {
//         router.push("/admin");
//       } else {
//         setError(data.error || "Login failed");
//       }
//     } catch (err) {
//       setError("An error occurred. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-[#000000]">
//       <div className="bg-[#282828] rounded-3xl p-8 w-full max-w-sm shadow-lg">
//         <div className="text-center mb-6">
//           <h1 className="text-2xl font-bold text-[#defc3e] mb-2">Flowerista</h1>
//           <h2 className="text-xl text-white">Admin Login</h2>
//         </div>

//         <div className="space-y-4">
//           <input
//             type="email"
//             placeholder="Email"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             disabled={loading}
//             className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#defc3e] disabled:opacity-50"
//           />

//           <input
//             type="password"
//             placeholder="Password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             disabled={loading}
//             className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#defc3e] disabled:opacity-50"
//           />

//           <button
//             onClick={handleLogin}
//             disabled={loading}
//             className="w-full px-4 py-3 bg-[#defc3e] text-black font-semibold rounded-lg hover:bg-[#d4e838] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             {loading ? "Logging in..." : "Login"}
//           </button>

//           {error && (
//             <div className="text-red-400 text-sm text-center mt-2">{error}</div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }
