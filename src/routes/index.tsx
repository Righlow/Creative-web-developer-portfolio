import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { projects } from "../components/immersive/projects";
import { ProjectCard } from "../components/immersive/ProjectCard";
import {
  Github,
  Linkedin,
  Mail,
  MapPin,
  Download,
  ArrowDown,
  Menu,
  X,
  Plane,
  BadgeCheck,
} from "lucide-react";

const ImmersiveScene = lazy(() =>
  import("../components/immersive/ImmersiveScene").then((m) => ({ default: m.ImmersiveScene })),
);

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Rorisang Kedijang — Portfolio" },
      {
        name: "description",
        content: "Portfolio of Rorisang Kedijang — Creative Web Developer & UI/UX Designer.",
      },
    ],
  }),
});

const sections = [
  { id: "hero", label: "Home" },
  { id: "about", label: "About" },
  { id: "what-i-do", label: "What I Do" },
  { id: "skills", label: "Skills" },
  { id: "projects", label: "Work" },
  { id: "education", label: "Education" },
  { id: "contact", label: "Contact" },
];

/*
  COLOR SYSTEM — Rightopia's Lab palette, used on every section
  W  #ffffff   white  — headings, body text
  R  #CF2626   pop red      — section labels, nav, CTAs, energy
  G  #498C40   jungle green — secondary accent, growth, balance
  Y  #FFD700   electric yellow — highlights, stats, warmth
*/

const W = "#ffffff";
const R = "#CF2626";
const G = "#498C40";
const Y = "#FFD700";

function Index() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState("hero");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const max = el.scrollHeight - el.clientHeight;
      progressRef.current = max > 0 ? Math.min(1, Math.max(0, el.scrollTop / max)) : 0;
      const mid = el.scrollTop + el.clientHeight * 0.35;
      for (const s of sections) {
        const node = document.getElementById(s.id);
        if (!node) continue;
        if (mid >= node.offsetTop && mid < node.offsetTop + node.offsetHeight) {
          setActive(s.id);
          break;
        }
      }
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) => {
    const node = document.getElementById(id);
    const el = scrollRef.current;
    if (node && el) el.scrollTo({ top: node.offsetTop, behavior: "smooth" });
    setMenuOpen(false);
  };

  return (
    <div
      suppressHydrationWarning
      className="relative h-screen w-screen overflow-hidden"
      style={{ backgroundColor: "#0a0a12" }}
    >
      {/* ── WebGL background ── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        {mounted && (
          <Suspense fallback={null}>
            <ImmersiveScene progress={progressRef} />
          </Suspense>
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 30%, rgba(10,10,18,0.42) 100%)",
          }}
        />
      </div>

      {/* ── Nav ── */}
      <header className="fixed top-0 inset-x-0 z-50 px-5 md:px-10 py-4 flex items-center justify-between">
        <a
          href="#hero"
          onClick={(e) => {
            e.preventDefault();
            scrollTo("hero");
          }}
          className="flex items-center gap-2 font-mono text-xs tracking-widest font-bold"
          style={{ color: W }}
        >
          <span
            className="inline-block h-2 w-2 rounded-full animate-pulse"
            style={{ backgroundColor: Y }}
          />
          RORISANG.K
        </a>

        {/* Desktop nav */}
        <nav
          className="hidden md:flex items-center gap-1 rounded-full px-2 py-1.5 backdrop-blur-xl"
          style={{
            backgroundColor: "rgba(10,10,18,0.75)",
            border: "1px solid rgba(255,255,255,0.10)",
          }}
        >
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => scrollTo(s.id)}
              className="px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] rounded-full transition-all duration-200 font-semibold"
              style={
                active === s.id
                  ? { backgroundColor: R, color: W }
                  : { color: "rgba(255,255,255,0.50)" }
              }
            >
              {s.label}
            </button>
          ))}
        </nav>

        {/* Desktop contact */}
        <a
          href="mailto:Rorisangkedijang14@gmail.com"
          className="hidden md:inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] uppercase tracking-[0.18em] font-medium transition hover:opacity-80"
          style={{ border: `1px solid ${Y}44`, backgroundColor: `${Y}0a`, color: W }}
        >
          <Mail className="h-3 w-3" /> Contact
        </a>

        {/* Mobile burger button */}
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="md:hidden flex items-center justify-center w-10 h-10 rounded-full transition-all"
          style={{
            backgroundColor: menuOpen ? R : "rgba(255,255,255,0.06)",
            border: `1px solid ${menuOpen ? R : "rgba(255,255,255,0.12)"}`,
            color: W,
          }}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </header>

      {/* ── Mobile fullscreen menu ── */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden flex flex-col"
          style={{ backgroundColor: "rgba(10,10,18,0.97)", backdropFilter: "blur(20px)" }}
        >
          {/* top bar spacer */}
          <div className="h-16" />
          {/* nav items */}
          <nav className="flex flex-col items-center justify-center flex-1 gap-2 px-6">
            {sections.map((s, i) => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className="w-full max-w-xs text-center py-4 rounded-2xl text-lg font-bold uppercase tracking-[0.18em] transition-all duration-200"
                style={
                  active === s.id
                    ? { backgroundColor: R, color: W }
                    : {
                        color: "rgba(255,255,255,0.55)",
                        backgroundColor: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }
                }
              >
                <span className="text-[10px] font-mono mr-2" style={{ color: Y }}>
                  0{i + 1}
                </span>
                {s.label}
              </button>
            ))}
          </nav>
          {/* bottom actions */}
          <div className="flex flex-col items-center gap-3 px-6 pb-12">
            <a
              href="mailto:Rorisangkedijang14@gmail.com"
              className="w-full max-w-xs inline-flex items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold transition hover:opacity-90"
              style={{ backgroundColor: R, color: W }}
            >
              <Mail className="h-4 w-4" /> Get in touch
            </a>
            <a
              href="/cv.pdf"
              className="w-full max-w-xs inline-flex items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold transition hover:opacity-90"
              style={{ backgroundColor: Y, color: "#0a0a12" }}
            >
              <Download className="h-4 w-4" /> Download CV
            </a>
          </div>
        </div>
      )}

      {/* ── Side dots ── */}
      <aside className="fixed left-5 top-1/2 z-40 -translate-y-1/2 hidden md:flex flex-col gap-3">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => scrollTo(s.id)}
            aria-label={s.label}
            className="rounded-full transition-all duration-300"
            style={
              active === s.id
                ? { height: "8px", width: "32px", backgroundColor: Y }
                : { height: "8px", width: "8px", backgroundColor: "rgba(255,255,255,0.32)" }
            }
          />
        ))}
      </aside>

      {/* ════════ SCROLL CONTAINER ════════ */}
      <main
        ref={scrollRef}
        className="immersive-scroll relative z-10 h-screen w-screen overflow-y-auto overflow-x-hidden snap-y snap-mandatory"
        style={{ textShadow: "0 1px 3px rgba(0,0,0,0.85), 0 2px 14px rgba(0,0,0,0.55)" }}
      >
        {/* ━━━━ HERO — W R Y ━━━━ */}
        <section
          id="hero"
          className="snap-start relative min-h-screen flex items-center justify-center px-4 md:px-12"
        >
          <div
            className="max-w-lg text-center space-y-4 rounded-[2.25rem] px-6 py-6 md:px-9 md:py-7 backdrop-blur-xl"
            style={{
              backgroundColor: "rgba(8,8,14,0.34)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {/* eyebrow — yellow border */}
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] uppercase tracking-[0.28em] backdrop-blur-lg"
              style={{
                border: `1px solid ${Y}55`,
                backgroundColor: "rgba(10,10,18,0.55)",
                color: "rgba(255,255,255,0.65)",
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: R }}
              />
              Available for web applications &amp; e-commerce
            </div>

            {/* name row — LinkedIn-style: name + verified badge + pronouns */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span
                className="font-mono text-xs md:text-sm tracking-[0.35em] uppercase font-semibold"
                style={{ color: Y }}
              >
                Rorisang Kedijang
              </span>
              <BadgeCheck className="h-4 w-4 md:h-[18px] md:w-[18px]" style={{ color: Y }} />
              <span
                className="text-[11px] md:text-xs font-medium tracking-wide"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                He/Him
              </span>
            </div>

            {/* headline — white + yellow "Technologist," + red descriptor */}
            <h1
              className="text-3xl sm:text-4xl md:text-5xl font-bold leading-[1.15] tracking-tight"
              style={{ color: W }}
            >
              Creative <span style={{ color: Y }}>Technologist,</span>
            </h1>
            <p
              className="text-base sm:text-lg md:text-xl font-semibold"
              style={{ color: R }}
            >
              Specialising in web development.
            </p>

            {/* location — matches LinkedIn header */}
            <div
              className="flex items-center justify-center gap-1.5 text-xs md:text-sm"
              style={{ color: "rgba(255,255,255,0.55)" }}
            >
              <MapPin className="h-3.5 w-3.5" style={{ color: Y }} />
              Bath, England, United Kingdom
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              {/* primary CTA — red */}
              <button
                onClick={() => scrollTo("projects")}
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition-opacity hover:opacity-90"
                style={{ backgroundColor: R, color: W }}
              >
                View work <ArrowDown className="h-3.5 w-3.5" />
              </button>
              {/* secondary CTA — yellow border */}
              <a
                href="mailto:Rorisangkedijang14@gmail.com"
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition hover:opacity-90"
                style={{
                  border: `1px solid ${Y}55`,
                  backgroundColor: "rgba(10,10,18,0.40)",
                  color: W,
                }}
              >
                Get in touch <Mail className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          <div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[10px] uppercase tracking-[0.3em]"
            style={{ color: "rgba(255,255,255,0.60)", textShadow: "0 1px 8px rgba(0,0,0,0.6)" }}
          >
            Scroll
            <span className="block h-8 w-px animate-pulse" style={{ backgroundColor: `${Y}90` }} />
          </div>
        </section>

        {/* ━━━━ 01 ABOUT ME — W R Y ━━━━ */}
        <section
          id="about"
          className="snap-start relative min-h-screen flex items-center px-4 md:px-12 py-20 md:py-24"
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(to right, rgba(10,10,18,0.52) 0%, rgba(10,10,18,0.34) 55%, rgba(10,10,18,0.05) 100%)",
            }}
          />

          <div className="relative mx-auto max-w-6xl w-full">
            {/* label — blue */}
            <div className="flex items-center gap-3 mb-10">
              <span
                className="text-[10px] font-mono uppercase tracking-[0.4em] font-semibold"
                style={{ color: Y }}
              >
                01 — About Me
              </span>
              <span className="h-px w-10" style={{ backgroundColor: `${Y}55` }} />
            </div>

            <div className="grid md:grid-cols-5 gap-8 md:gap-16">
              <div className="md:col-span-2 space-y-6">
                {/* headline — white + red accent */}
                <h2
                  className="text-3xl md:text-5xl font-bold leading-[1.06] tracking-tight"
                  style={{ color: W }}
                >
                  Design that tells
                  <br />
                  your story
                  <br />
                  <span style={{ color: R }}>Seamlessly.</span>
                </h2>
                {/* tags — yellow border */}
                <div className="flex flex-wrap gap-2">
                  {["Web Development", "Creative Code", "Visual Design", "E-Commerce"].map(
                    (tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.18em]"
                        style={{
                          border: `1px solid ${Y}44`,
                          color: "rgba(255,255,255,0.60)",
                          backgroundColor: `${Y}08`,
                        }}
                      >
                        {tag}
                      </span>
                    ),
                  )}
                </div>
              </div>

              <div className="md:col-span-3 space-y-8">
                {/* bio — blue left border */}
                <div className="pl-5 space-y-4" style={{ borderLeft: `2px solid ${Y}66` }}>
                  <p
                    className="text-base md:text-lg leading-relaxed font-medium"
                    style={{ color: W }}
                  >
                    I'm Rorisang — a{" "}
                    <span className="font-bold" style={{ color: Y }}>
                      BSc (Hons) Creative Computing
                    </span>{" "}
                    graduate from Bath Spa University. I blend emerging web technologies and creative
                    concepts to build responsive, functional web experiences people actually want to
                    use.
                  </p>
                  <p
                    className="text-sm md:text-base leading-relaxed"
                    style={{ color: "rgba(255,255,255,0.80)" }}
                  >
                    With experience across Graphic Design and Web Development, I bring a unique
                    blend of creativity and technical precision to every problem I solve.
                  </p>
                </div>

                {/* stats — yellow numbers, yellow border */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { k: "3+", v: "Years creative coding" },
                    { k: "2", v: "Universities, 2 countries" },
                    { k: "∞", v: "Curiosity" },
                  ].map((s) => (
                    <div
                      key={s.v}
                      className="rounded-xl p-4 backdrop-blur-sm"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.04)",
                        border: `1px solid ${Y}33`,
                      }}
                    >
                      <div
                        className="text-2xl md:text-3xl font-bold leading-none"
                        style={{ color: Y }}
                      >
                        {s.k}
                      </div>
                      <div
                        className="text-[10px] uppercase tracking-[0.18em] mt-2 leading-snug"
                        style={{ color: "rgba(255,255,255,0.62)" }}
                      >
                        {s.v}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ━━━━ 02 WHAT I DO — W R Y ━━━━ */}
        <section
          id="what-i-do"
          className="snap-start relative min-h-screen flex items-center px-4 md:px-12 py-20 md:py-24"
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(135deg, rgba(10,10,18,0.52) 0%, rgba(10,10,18,0.32) 55%, rgba(10,10,18,0.05) 100%)",
            }}
          />

          <div className="relative mx-auto max-w-6xl w-full">
            <div className="flex items-center gap-3 mb-10">
              <span
                className="text-[10px] font-mono uppercase tracking-[0.4em] font-semibold"
                style={{ color: Y }}
              >
                02 — What I Do
              </span>
              <span className="h-px w-10" style={{ backgroundColor: `${Y}55` }} />
            </div>

            {/* headline — white + red */}
            <h2
              className="text-3xl md:text-5xl font-bold leading-tight mb-8 md:mb-12"
              style={{ color: W }}
            >
              Where code meets <span style={{ color: R }}>creativity.</span>
            </h2>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  num: "01",
                  title: "UI / UX Design",
                  color: R,
                  bg: `${R}18`,
                  border: `${R}33`,
                  body: "From wireframes to high-fidelity prototypes — interfaces that feel intuitive and look sharp, grounded in user research and real interaction patterns.",
                },
                {
                  num: "02",
                  title: "Creative Web Dev",
                  color: G,
                  bg: `${G}18`,
                  border: `${G}44`,
                  body: "Immersive, interactive experiences using Three.js and React Three Fibre — blending generative art, motion, and code into something memorable.",
                },
                {
                  num: "03",
                  title: "Brand & Visual Design",
                  color: Y,
                  bg: `${Y}0f`,
                  border: `${Y}33`,
                  body: "Logo design, visual identity, and digital brand work using Figma and Illustrator — branding as visual storytelling with purpose.",
                },
              ].map((card) => (
                <div
                  key={card.num}
                  className="rounded-2xl p-6 backdrop-blur-sm flex flex-col gap-3 hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: card.bg, border: `1px solid ${card.border}` }}
                >
                  <span
                    className="font-mono text-[10px] tracking-[0.3em] font-bold"
                    style={{ color: card.color }}
                  >
                    {card.num}
                  </span>
                  <h3 className="text-base font-bold" style={{ color: card.color }}>
                    {card.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "rgba(255,255,255,0.82)" }}
                  >
                    {card.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ━━━━ 03 SKILLS — W R Y ━━━━ */}
        <section
          id="skills"
          className="snap-start relative min-h-screen flex items-center px-4 md:px-12 py-20 md:py-24"
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(to right, rgba(10,10,18,0.52) 0%, rgba(10,10,18,0.34) 55%, rgba(10,10,18,0.05) 100%)",
            }}
          />

          <div className="relative mx-auto max-w-6xl w-full">
            <div className="flex items-center gap-3 mb-10">
              <span
                className="text-[10px] font-mono uppercase tracking-[0.4em] font-semibold"
                style={{ color: Y }}
              >
                03 — Skills
              </span>
              <span className="h-px w-10" style={{ backgroundColor: `${Y}55` }} />
            </div>

            <h2
              className="text-3xl md:text-5xl font-bold leading-tight mb-8 md:mb-12"
              style={{ color: W }}
            >
              Tools I think with.
            </h2>

            <div className="grid gap-4 md:grid-cols-3">
              {/* Creative — yellow */}
              <div
                className="rounded-2xl p-6 backdrop-blur-sm"
                style={{ backgroundColor: `${Y}0a`, border: `1px solid ${Y}33` }}
              >
                <div className="flex items-center gap-3 mb-5">
                  <span className="h-0.5 w-5" style={{ backgroundColor: Y }} />
                  <h3
                    className="text-xs font-bold uppercase tracking-[0.22em]"
                    style={{ color: Y }}
                  >
                    Creative
                  </h3>
                </div>
                <ul className="space-y-3">
                  {[
                    "Creative Coding & Visual Storytelling",
                    "Curious & Purpose Driven",
                    "Attention to Detail",
                    "Performance-Focused Design",
                  ].map((it) => (
                    <li
                      key={it}
                      className="flex items-start gap-2.5 text-sm"
                      style={{ color: "rgba(255,255,255,0.85)" }}
                    >
                      <span className="mt-0.5 flex-shrink-0 font-bold" style={{ color: Y }}>
                        ›
                      </span>
                      {it}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Technical — red */}
              <div
                className="rounded-2xl p-6 backdrop-blur-sm"
                style={{ backgroundColor: `${R}12`, border: `1px solid ${R}33` }}
              >
                <div className="flex items-center gap-3 mb-5">
                  <span className="h-0.5 w-5" style={{ backgroundColor: R }} />
                  <h3
                    className="text-xs font-bold uppercase tracking-[0.22em]"
                    style={{ color: R }}
                  >
                    Technical
                  </h3>
                </div>
                <ul className="space-y-3">
                  {[
                    "Sharp Problem Solving",
                    "Critical & Analytical Thinking",
                    "Curious & Self-Directed",
                    "High-Fidelity Prototyping",
                  ].map((it) => (
                    <li
                      key={it}
                      className="flex items-start gap-2.5 text-sm"
                      style={{ color: "rgba(255,255,255,0.85)" }}
                    >
                      <span className="mt-0.5 flex-shrink-0 font-bold" style={{ color: R }}>
                        ›
                      </span>
                      {it}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tech Stack — green back-end, yellow front-end */}
              <div
                className="rounded-2xl p-6 backdrop-blur-sm"
                style={{ backgroundColor: `${G}12`, border: `1px solid ${G}44` }}
              >
                <div className="flex items-center gap-3 mb-5">
                  <span className="h-0.5 w-5" style={{ backgroundColor: G }} />
                  <h3
                    className="text-xs font-bold uppercase tracking-[0.22em]"
                    style={{ color: G }}
                  >
                    Tech Stack
                  </h3>
                </div>
                <div className="space-y-5">
                  <div>
                    <p
                      className="text-[10px] uppercase tracking-[0.22em] mb-2.5"
                      style={{ color: `${Y}99` }}
                    >
                      Back-end
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {["Node.js", "Express", "MongoDB", "Mongoose", "EJS", "Cloudflare"].map(
                        (t) => (
                          <span
                            key={t}
                            className="px-2.5 py-1 rounded-md text-[11px]"
                            style={{
                              backgroundColor: `${G}18`,
                              border: `1px solid ${G}44`,
                              color: G,
                            }}
                          >
                            {t}
                          </span>
                        ),
                      )}
                    </div>
                  </div>
                  <div>
                    <p
                      className="text-[10px] uppercase tracking-[0.22em] mb-2.5"
                      style={{ color: `${Y}99` }}
                    >
                      Front-end
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {["Three.js", "React Three Fibre", "Bootstrap", "EJS"].map((t) => (
                        <span
                          key={t}
                          className="px-2.5 py-1 rounded-md text-[11px]"
                          style={{
                            backgroundColor: `${Y}12`,
                            border: `1px solid ${Y}44`,
                            color: Y,
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ━━━━ 04 PROJECTS — W R Y ━━━━ */}
        <section
          id="projects"
          className="snap-start relative min-h-screen px-4 md:px-12 py-20 md:py-24"
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundColor: "rgba(10,10,18,0.32)" }}
          />
          <div className="relative mx-auto max-w-6xl">
            <div className="mb-14 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <img
                    src="/rightopia-mark.svg"
                    alt="Rightopia's Lab mark"
                    className="h-7 w-7"
                    style={{ filter: `drop-shadow(0 0 6px ${R}80)` }}
                  />
                  <span
                    className="text-[10px] font-mono uppercase tracking-[0.4em] font-semibold"
                    style={{ color: Y }}
                  >
                    04 — Rightopia&apos;s Lab
                  </span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold leading-tight" style={{ color: W }}>
                  Portals into <span style={{ color: Y }}>the lab</span>{" "}
                  <span style={{ color: R }}>where art meets tech.</span>
                </h2>
              </div>
              <p
                className="max-w-xs text-sm leading-relaxed"
                style={{ color: "rgba(255,255,255,0.80)" }}
              >
                Rightopia&apos;s Lab is my creative lab for experiments in web development, brand
                design and motion. Four projects, four portals.
              </p>
            </div>
            <div className="space-y-24 md:space-y-32">
              {projects.map((p, i) => (
                <ProjectCard key={p.id} project={p} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* ━━━━ 05 EDUCATION — W R Y ━━━━ */}
        <section
          id="education"
          className="snap-start relative min-h-screen flex items-center px-4 md:px-12 py-20 md:py-24"
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(to right, rgba(10,10,18,0.52) 0%, rgba(10,10,18,0.34) 55%, rgba(10,10,18,0.05) 100%)",
            }}
          />

          <div className="relative mx-auto max-w-5xl w-full">
            <div className="flex items-center gap-3 mb-10">
              <span
                className="text-[10px] font-mono uppercase tracking-[0.4em] font-semibold"
                style={{ color: Y }}
              >
                05 — Education
              </span>
              <span className="h-px w-10" style={{ backgroundColor: `${Y}55` }} />
            </div>

            <h2
              className="text-3xl md:text-5xl font-bold leading-tight mb-8 md:mb-10"
              style={{ color: W }}
            >
              <span style={{ color: R }}>Bath Spa</span> University, UK.
            </h2>

            <div className="relative pl-6 md:pl-8 space-y-10">
              {/* flight path — animated plane replaces the plain timeline line */}
              <div
                className="absolute left-0 top-0 bottom-0 border-l border-dashed pointer-events-none"
                style={{ borderColor: "rgba(255,255,255,0.20)" }}
              />
              <Plane
                aria-hidden
                className="fly-plane absolute left-0 top-0 h-4 w-4 md:h-5 md:w-5 -translate-x-1/2 pointer-events-none"
                style={{ color: Y, filter: `drop-shadow(0 0 5px ${Y}90)` }}
              />
              {[
                {
                  school: "Bath Spa University, UK",
                  date: "Oct 2023 — May 2026",
                  status: "Graduated · 2:1",
                  degree: "BSc (Hons) Creative Computing — Web Technologies",
                  notes: [
                    "Responsive Web Design & Creative Coding",
                    "App Dev with React Native & JavaScript",
                    "UX/UI Design, Prototyping & Interactive Media",
                    "GUI Programming with C++",
                  ],
                },
                {
                  school: "Eastern Mediterranean University, North Cyprus",
                  date: "Feb 2022 — Jun 2023",
                  status: "Transferred with 120+ credits",
                  degree: "BSc Game Design",
                  notes: [
                    "Vector drawing with Adobe Illustrator",
                    "Computer graphics with Photoshop & Illustrator",
                    "Perception and design concepts",
                  ],
                },
                {
                  school: "Hilton College, South Africa",
                  date: "Jan 2017 — Nov 2021",
                  status: "NSC (IEB)",
                  degree: "National Senior Certificate",
                  notes: [
                    "Art, English, isiZulu",
                    "Life Orientation, Life Science",
                    "Mathematics, Physical Science",
                  ],
                },
              ].map((e) => (
                <div key={e.school} className="relative">
                  {/* dot — yellow */}
                  <span
                    className="absolute rounded-full"
                    style={{
                      left: "-34px",
                      top: "6px",
                      height: "10px",
                      width: "10px",
                      backgroundColor: Y,
                      boxShadow: `0 0 0 4px ${Y}22`,
                    }}
                  />
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-lg md:text-xl font-semibold" style={{ color: W }}>
                      {e.school}
                    </h3>
                    <span
                      className="text-[10px] font-mono uppercase tracking-[0.2em]"
                      style={{ color: "rgba(255,255,255,0.55)" }}
                    >
                      {e.date}
                    </span>
                  </div>
                  {/* status — blue */}
                  <div className="mt-1 text-xs tracking-wide font-semibold" style={{ color: Y }}>
                    {e.status} · {e.degree}
                  </div>
                  <ul
                    className="mt-3 grid gap-1.5 text-sm sm:grid-cols-2"
                    style={{ color: "rgba(255,255,255,0.78)" }}
                  >
                    {e.notes.map((n) => (
                      <li key={n} className="flex gap-2">
                        {/* arrows — red */}
                        <span className="mt-0.5 flex-shrink-0 font-bold" style={{ color: R }}>
                          ›
                        </span>
                        {n}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ━━━━ 06 CONTACT — W R Y ━━━━ */}
        <section
          id="contact"
          className="snap-start relative min-h-screen flex items-center px-4 md:px-12 py-20 md:py-24"
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(to top, rgba(10,10,18,0.52) 0%, rgba(10,10,18,0.32) 60%, rgba(10,10,18,0.07) 100%)",
            }}
          />

          <div className="relative mx-auto max-w-3xl w-full text-center space-y-8">
            {/* label — blue */}
            <div
              className="text-[10px] font-mono uppercase tracking-[0.4em] font-semibold"
              style={{ color: Y }}
            >
              06 — Contact
            </div>

            {/* headline — white + red */}
            <h2 className="text-3xl md:text-6xl font-bold leading-tight" style={{ color: W }}>
              Let&apos;s build something
              <br />
              <span style={{ color: R }}>that feels alive.</span>
            </h2>

            <p
              className="mx-auto max-w-sm text-sm leading-relaxed"
              style={{ color: "rgba(255,255,255,0.80)" }}
            >
              Open to creative collaborations and logo design. Reach out and let&apos;s talk.
            </p>

            {/* cards — yellow icon accent */}
            <div className="grid gap-3 sm:grid-cols-2 w-full max-w-md mx-auto">
              <a
                href="mailto:Rorisangkedijang14@gmail.com"
                className="rounded-2xl p-5 text-left backdrop-blur-sm transition-opacity hover:opacity-80"
                style={{ backgroundColor: "rgba(255,255,255,0.04)", border: `1px solid ${Y}33` }}
              >
                <Mail className="h-4 w-4" style={{ color: Y }} />
                <div
                  className="mt-3 text-[10px] uppercase tracking-[0.2em]"
                  style={{ color: "rgba(255,255,255,0.55)" }}
                >
                  Email
                </div>
                <div className="mt-1 text-xs break-all" style={{ color: "rgba(255,255,255,0.78)" }}>
                  Rorisangkedijang14@gmail.com
                </div>
              </a>
              <div
                className="rounded-2xl p-5 text-left backdrop-blur-sm"
                style={{ backgroundColor: "rgba(255,255,255,0.04)", border: `1px solid ${Y}33` }}
              >
                <MapPin className="h-4 w-4" style={{ color: Y }} />
                <div
                  className="mt-3 text-[10px] uppercase tracking-[0.2em]"
                  style={{ color: "rgba(255,255,255,0.55)" }}
                >
                  Based in
                </div>
                <div className="mt-1 text-xs" style={{ color: "rgba(255,255,255,0.78)" }}>
                  Bath, United Kingdom
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center flex-wrap gap-2 md:gap-3">
              {[
                {
                  href: "https://github.com/Righlow",
                  label: "GitHub",
                  icon: <Github className="h-4 w-4" />,
                },
                {
                  href: "https://www.linkedin.com/in/rorisang-kedijang",
                  label: "LinkedIn",
                  icon: <Linkedin className="h-4 w-4" />,
                },
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-80"
                  style={{
                    border: "1px solid rgba(255,255,255,0.20)",
                    backgroundColor: "rgba(255,255,255,0.05)",
                    color: "rgba(255,255,255,0.70)",
                  }}
                >
                  {link.icon} {link.label}
                </a>
              ))}
              {/* Download CV — yellow */}
              <a
                href="/cv.pdf"
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-opacity hover:opacity-90"
                style={{ backgroundColor: Y, color: "#0a0a12" }}
              >
                <Download className="h-4 w-4" /> Download CV
              </a>
            </div>

            <footer
              className="pt-12 text-[10px] font-mono uppercase tracking-[0.3em]"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              © {new Date().getFullYear()} Rorisang Kedijang
            </footer>
          </div>
        </section>
      </main>
    </div>
  );
}
