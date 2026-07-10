import Image from "next/image";
import RouteSparkline from "./components/routeSparkline";
import { getAllPostsMeta } from './lib/posts'


async function getRecentActivities() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/recent-activities`, {
    cache: 'no-store',
  })
  if (!res.ok) return []
  const { activities } = await res.json()
  return activities
}

const PROJECTS = [
  {
    name: "SleeveMap",
    image: "/sleevemap_ss.png",
    href: "https://sleevemap.chanelmuir.com/",
    repo: "https://github.com/chanelmuir/sleevemap",
    description: "A web app for runners to track and plan running routes, with all their runs visible on one map.",
    tags: ["Next.js", "TypeScript", "PostgreSQL"],
  },
  {
    name: "Mjolnir",
    image: "/mjolnir.png",
    href: "https://mjolnir.live/login/",
    repo: "https://github.com/Dmitry-H1/Mjolnirv2",
    description: "A group project where we built a log analysis tool for businesses to gain insights into web traffic and diagnose bottlenecks & issues.",
    tags: ["Next.js", "TypeScript", "Tailwind", "BigQuery"],
  },
  {
    name: "Specific Site Blocker",
    image: "/specific_site_blocker_cropped.png",
    repo: "https://github.com/Chanelmuir/Selective-Site-Blocker",
    description: "A chrome extension that allows users to block websites, whilst allowing access to specific pages on those sites.",
    tags: ["HTML", "CSS", "JavaScript"],
  },
]

export default async function Home() {
  const recentActivities = await getRecentActivities()
  const posts = getAllPostsMeta()

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
            Computer Science graduate building web applications, mapping tools,
            and data-driven products.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a
              href="/resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm text-white transition-opacity hover:opacity-90"
            >
              <i className="fa-solid fa-file"></i>
              Resume
            </a>

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
              href="https://www.linkedin.com/in/chanelmuir/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-accent-light hover:text-accent"
            >
              <i className="fa-brands fa-linkedin"></i>
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
            {PROJECTS.map((project) => (
              <div
                key={project.name}
                className="group overflow-hidden rounded-2xl border border-border bg-surface transition-colors hover:border-accent/50"
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
                    <h3 className="font-serif text-lg text-text-primary">{project.name}</h3>
                    {project.href && (
                      <a href={project.href} target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-accent">
                        <i className="fa-solid fa-arrow-up-right-from-square text-xs" />
                      </a>
                    )}
                    <a href={project.repo} target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-accent">
                      <i className="fa-brands fa-github"></i>
                    </a>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                    {project.description}
                  </p>
                  <p className="mt-4 text-xs uppercase tracking-wide text-text-secondary">
                    {project.tags.join(" · ")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Writing & Activities */}
        <section className="grid gap-12 border-t border-border py-16 sm:grid-cols-2 sm:gap-16">
          {/* Writing */}
          <div>
            <h2 className="font-serif text-3xl text-text-primary">Writing</h2>
            {posts.length > 0 ? (
              <div className="mt-6 divide-y divide-border">
                {posts.map((post) => (
                  <a
                    key={post.slug}
                    href={`/posts/${post.slug}`}
                    className="group block py-4 first:pt-0"
                  >
                    <h3 className="font-medium text-text-primary transition-colors group-hover:text-accent">
                      {post.title}
                    </h3>
                    <p className="mt-1 text-sm text-text-secondary">
                      {new Date(post.date).toLocaleDateString('en-NZ')}
                    </p>
                  </a>
                ))}
              </div>
            ) : (
              <p className="mt-6 text-sm text-text-secondary">Nothing published yet.</p>
            )}
          </div>

          {/* Strava */}
          <div>
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-3xl text-text-primary">Recent Activities</h2>
              <Image
                src="/api_logo_pwrdBy_strava_horiz_orange.svg"
                alt="Powered by Strava"
                width={82}
                height={16}
                className="opacity-60"
              />
            </div>
            {recentActivities.length > 0 ? (
              <div className="mt-6 divide-y divide-border">
                {recentActivities.map((activity: any) => (
                  <a
                    key={activity.id}
                    href={`https://www.strava.com/activities/${activity.strava_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-4 py-4 first:pt-0"
                  >
                    <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-accent-light">
                      <RouteSparkline route={activity.route} width={112} height={112} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-medium text-text-primary transition-colors group-hover:text-accent">
                        {activity.name}
                      </h3>
                      <p className="mt-1 text-sm text-text-secondary">
                        {new Date(activity.start_date).toLocaleDateString('en-NZ', {
                          day: '2-digit',
                          month: '2-digit',
                          year: '2-digit',
                        })}
                        {' · '}
                        {(activity.distance_m / 1000).toFixed(1)} km
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <p className="mt-6 text-sm text-text-secondary">No recent activity.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
