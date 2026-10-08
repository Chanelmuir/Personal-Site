import Image from "next/image";
import { getAllProjectsMeta, type ProjectMeta } from './lib/projects'
import StreetMapHero from './components/street-map-hero'

function ProjectLinks({ project }: { project: ProjectMeta }) {
  if (!project.href && !project.repo) return null
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1 text-[15px] font-semibold text-accent">
      {project.href && (
        <a
          href={project.href}
          {...(project.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className="run-link [--rest-line:color-mix(in_srgb,currentColor_35%,transparent)] hover:text-text-primary">
          Open {project.name}
        </a>
      )}
      {project.repo && (
        <a href={project.repo} target="_blank" rel="noopener noreferrer" className="run-link [--rest-line:color-mix(in_srgb,currentColor_35%,transparent)] hover:text-text-primary">
          Source
        </a>
      )}
    </div>
  )
}

function Screenshot({ project, wide }: { project: ProjectMeta; wide?: boolean }) {
  return (
    <a
      href={`/projects/${project.slug}`}
      tabIndex={-1}
      aria-hidden="true"
      className={`block overflow-hidden border border-border bg-surface ${wide ? 'aspect-[16/10]' : 'aspect-[4/3]'}`}
    >
      <Image
        src={project.image}
        alt=""
        width={wide ? 1200 : 600}
        height={wide ? 750 : 450}
        className="h-full w-full object-cover object-left-top"
      />
    </a>
  )
}

export default function Home() {
  const [lead, ...rest] = getAllProjectsMeta()

  return (
    <div className="overflow-x-hidden">
      <StreetMapHero intro="A site for hosting hobby projects." />

      <main className="mx-auto w-full max-w-6xl px-6 pt-18 pb-24 sm:px-16">
        <h2 className="font-serif text-3xl text-text-primary">Projects</h2>

        {lead && (
          <article className="mt-9 grid items-end gap-5 md:grid-cols-[1.55fr_1fr] md:gap-9">
            <Screenshot project={lead} wide />
            <div className="flex min-w-0 flex-col gap-3">
              <h3 className="text-[clamp(30px,4vw,44px)] font-bold leading-none tracking-[-0.02em] text-text-primary [font-stretch:125%]">
                <a href={`/projects/${lead.slug}`} className="hover:text-accent">{lead.name}</a>
              </h3>
              <p className="max-w-[46ch] text-lg leading-relaxed text-text-primary">{lead.tagline}</p>
              <ProjectLinks project={lead} />
            </div>
          </article>
        )}

        <div className="mt-14 grid gap-12 md:grid-cols-3 md:gap-9">
          {rest.map((project) => (
            <article key={project.slug} className="flex min-w-0 flex-col gap-3">
              <Screenshot project={project} />
              <h3 className="mt-1.5 font-serif text-[22px] text-text-primary">
                <a href={`/projects/${project.slug}`} className="hover:text-accent">{project.name}</a>
              </h3>
              <p className="leading-relaxed text-text-secondary">{project.tagline}</p>
              <ProjectLinks project={project} />
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
