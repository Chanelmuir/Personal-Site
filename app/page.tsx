import Image from "next/image";
import { getAllProjectsMeta } from './lib/projects'


export default function Home() {
  const projects = getAllProjectsMeta()

  return (
    <div className="relative overflow-x-hidden">
      <div className="absolute inset-x-0 top-0 -z-10 h-100 pointer-events-none bg-[radial-gradient(circle_at_top_left,var(--color-accent-light)_0%,transparent_65%)] opacity-40 blur-3xl" />

      <main className="mx-auto flex w-full max-w-6xl flex-col px-6 py-8 sm:px-16">

        {/* Intro */}
        <section className="py-20 sm:py-28">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-secondary">
            Christchurch, New Zealand
          </p>
          <h1 className="mt-4 font-serif text-6xl tracking-tight text-text-primary sm:text-7xl">
            Chanel Muir
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-text-secondary">
            A site for hosting hobby projects.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a
              href="https://github.com/chanelmuir"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-accent-light hover:text-accent"
            >
              <i className="fa-brands fa-github"></i>
            </a>

            <a
              href="mailto:chanelkmuir@gmail.com"
              aria-label="Email"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-accent-light hover:text-accent"
            >
              <i className="fa-solid fa-envelope text-sm" />
            </a>
          </div>
        </section>

        {/* Projects */}
        <section className="border-t border-border py-16">
          <h2 className="font-serif text-3xl text-text-primary">Projects</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {projects.map((project) => (
              <div
                key={project.slug}
                className="group relative overflow-hidden rounded-2xl border border-border bg-surface transition-colors hover:border-accent/50"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <Image
                    src={project.image}
                    alt={project.name}
                    width={600}
                    height={450}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-lg text-text-primary">
                      {/* Stretched link: the whole card opens the project page */}
                      <a href={`/projects/${project.slug}`} className="after:absolute after:inset-0">
                        {project.name}
                      </a>
                    </h3>
                    {project.href && (
                      <a href={project.href} target="_blank" rel="noopener noreferrer" aria-label={`Open ${project.name}`} className="relative z-10 text-text-secondary hover:text-accent">
                        <i className="fa-solid fa-arrow-up-right-from-square text-xs" />
                      </a>
                    )}
                    {project.repo && (
                      <a href={project.repo} target="_blank" rel="noopener noreferrer" aria-label={`${project.name} source`} className="relative z-10 text-text-secondary hover:text-accent">
                        <i className="fa-brands fa-github"></i>
                      </a>
                    )}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                    {project.tagline}
                  </p>
                  <p className="mt-4 text-xs uppercase tracking-wide text-text-secondary">
                    {project.tags.join(" · ")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
