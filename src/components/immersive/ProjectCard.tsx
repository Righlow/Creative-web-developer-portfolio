import type { Project } from "./projects";
import { ExternalLink } from "lucide-react";

// Rightopia's Lab portal color — one consistent accent across every project
const ACCENT = "#CF2626";

export function ProjectCard({ project, index }: { project: Project; index: number }) {
  const reverse = index % 2 === 1;
  const accent = ACCENT;
  const onDark = "#ffffff";
  return (
    <article
      className={`group grid gap-6 md:gap-10 items-center md:grid-cols-2 ${
        reverse ? "md:[&>*:first-child]:order-2" : ""
      }`}
    >
      {/* Visual — portal frame */}
      <div className="relative">
        <div
          className={`relative w-full overflow-hidden rounded-2xl glass noise transition-shadow duration-300 ${project.aspect ?? "aspect-[16/9]"}`}
          style={{
            border: `1px solid ${accent}55`,
            boxShadow: `0 20px 50px -22px ${accent}66`,
          }}
        >
          {/* Replace src with your screenshot / gif. Recommended drop folder: public/projects/ */}
          <img
            src={project.placeholder}
            alt={`${project.title} preview`}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            style={{ objectPosition: project.objectPosition ?? "center" }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{ boxShadow: `inset 0 0 0 1px ${accent}, inset 0 0 36px ${accent}40` }}
          />
        </div>

        {/* portal number badge */}
        <div
          className="absolute -top-3 -left-3 flex h-10 w-10 items-center justify-center rounded-full font-mono text-xs font-bold backdrop-blur-lg"
          style={{
            backgroundColor: "rgba(10,10,18,0.85)",
            border: `1.5px solid ${accent}`,
            color: accent,
            boxShadow: `0 0 16px ${accent}70`,
          }}
        >
          {String(index + 1).padStart(2, "0")}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        <div
          className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono uppercase tracking-[0.25em]"
          style={{ color: accent }}
        >
          <span>{project.category}</span>
          <span className="text-muted-foreground">{project.date}</span>
        </div>
        <h3 className="text-3xl md:text-4xl font-semibold leading-tight">{project.title}</h3>
        <p className="text-muted-foreground leading-relaxed max-w-prose">{project.description}</p>
        <ul className="flex flex-wrap gap-2 pt-1">
          {project.tags.map((t) => (
            <li
              key={t}
              className="rounded-full px-3 py-1 text-xs font-mono"
              style={{
                border: `1px solid ${accent}44`,
                backgroundColor: `${accent}14`,
                color: accent,
              }}
            >
              {t}
            </li>
          ))}
        </ul>
        {project.link && (
          <a
            href={project.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-2 rounded-full px-5 py-2.5 text-sm font-bold transition hover:opacity-90"
            style={{ backgroundColor: accent, color: onDark }}
          >
            View project <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>
    </article>
  );
}
