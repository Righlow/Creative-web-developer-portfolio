import type { Project } from "./projects";
import { ExternalLink } from "lucide-react";

export function ProjectCard({ project, index }: { project: Project; index: number }) {
  const reverse = index % 2 === 1;
  return (
    <article
      className={`group grid gap-6 md:gap-10 items-center md:grid-cols-2 ${
        reverse ? "md:[&>*:first-child]:order-2" : ""
      }`}
    >
      {/* Visual placeholder */}
      <div
        className={`relative w-full overflow-hidden rounded-2xl glass noise ${project.aspect ?? "aspect-[16/9]"}`}
      >
        {/* Replace src with your screenshot / gif. Recommended drop folder: public/projects/ */}
        <img
          src={project.placeholder}
          alt={`${project.title} preview`}
          className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-105"
          style={{ objectPosition: project.objectPosition ?? "center" }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />

        <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl" />
      </div>

      {/* Content */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono uppercase tracking-[0.25em] text-primary">
          <span>
            {String(index + 1).padStart(2, "0")} · {project.category}
          </span>
          <span className="text-muted-foreground">{project.date}</span>
        </div>
        <h3 className="text-3xl md:text-4xl font-semibold leading-tight">{project.title}</h3>
        <p className="text-muted-foreground leading-relaxed max-w-prose">{project.description}</p>
        <ul className="flex flex-wrap gap-2 pt-1">
          {project.tags.map((t) => (
            <li
              key={t}
              className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-mono text-foreground/90"
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
            className="inline-flex items-center gap-2 mt-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            View project <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>
    </article>
  );
}
