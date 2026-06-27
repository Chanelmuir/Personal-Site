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

export default async function Home() {
  const recentActivities = await getRecentActivities()
  const posts = getAllPostsMeta()
  console.log('posts found:', posts)


  return (
    <div className="relative overflow-x-hidden flex flex-col items-center justify-center">
      <div className="absolute inset-x-0 top-0 -z-10 h-125 pointer-events-none bg-[radial-gradient(circle_at_top_left,var(--color-accent-light)_0%,transparent_70%)] opacity-70 blur-3xl" />
      <main className="flex w-full flex-col items-start justify-between px-16 py-8 sm:items-start">
        
        {/* Intro */}
        <section className="max-w-8xl py-20">
          <h1 className="text-5xl font-bold tracking-tight">
            Chanel Muir
          </h1>

          <p className="mt-6 text-xl text-text-secondary max-w-2xl">
            Computer Science graduate from La Salle University, former NCAA Division I runner,
            building web applications, mapping tools, and data-driven products.
          </p>

          <div className="mt-8 flex gap-4">
            <a
              href="/resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-3 text-white hover:opacity-90">
              <i className="fa-solid fa-file"></i>
              Resume
            </a>

            <a
              href="https://github.com/chanelmuir"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-lg border border-border p-4 hover:border-accent"
            >
              <i className="fa-brands fa-github"></i>
            </a>

            <a
              href="https://www.linkedin.com/in/chanelmuir/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-lg border border-border p-4 hover:border-accent"
            >
              <i className="fa-brands fa-linkedin"></i>
            </a>

            <a
              href="mailto:chanelkmuir@gmail.com"
              className="inline-flex items-center rounded-lg border border-border p-4 hover:border-accent"
            >
              <i className="fa-solid fa-envelope text-sm" /> 
            </a>

          </div>
        </section>
        {/* Projects & Blog */}
        <div className="grid gap-16 sm:grid-cols-4">
          {/* Projects */}
          <div className="sm:col-span-2 flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
            <h2 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
              Projects:
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-surface rounded-xl border border-border shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
                <Image src="/sleevemap_ss.png" alt="SleeveMap" width={600} height={400} className="rounded-t-xl" />
                <div className="p-4">
                <span className="flex items-left items-center">
                  <h2 className="font-bold">SleeveMap</h2>
                  <a href="https://sleevemap.chanelmuir.com/" target="_blank" rel="noopener noreferrer" className="pl-1">
                    <i className="fa-solid fa-arrow-up-right-from-square" />
                  </a>
                  <a href="https://github.com/chanelmuir/sleevemap" target="_blank" rel="noopener noreferrer" className="pl-1 pr-0">
                    <i className="fa-brands fa-github"></i>
                  </a>
                </span>
                <p className="text-sm text-gray-500">
                  A web app for runners to track and plan running routes, with all their runs visible on one map. 
                </p>
                <div className="mt-4 flex gap-2">
                  <span className="rounded-full bg-accent-light px-3 py-1 text-sm text-accent">
                    Next.js
                  </span>

                  <span className="rounded-full bg-accent-light px-3 py-1 text-sm text-accent">
                    TypeScript
                  </span>

                  <span className="rounded-full bg-accent-light px-3 py-1 text-sm text-accent">
                    PostgreSQL
                  </span>
                </div>
                </div>
              </div>

              {/* Mjolnir */}
              <div className="bg-surface rounded-xl border border-border shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
                <Image src="/mjolnir.png" alt="Mjolnir" width={600} height={400} className="rounded-t-xl" />
                <div className="p-4">
                  <span className="flex items-left items-center">
                    <h2 className="font-bold">Mjolnir</h2>
                    <a href="https://mjolnir.live/login/" target="_blank" rel="noopener noreferrer" className="pl-1">
                      <i className="fa-solid fa-arrow-up-right-from-square" />
                    </a>
                    <a href="https://github.com/Dmitry-H1/Mjolnirv2" target="_blank" rel="noopener noreferrer" className="pl-1 pr-0">
                      <i className="fa-brands fa-github"></i>
                    </a>
                  </span>
                  <p className="text-sm text-gray-500">
                    A group project where we built a log analysis tool for businesses to gain insights into web traffic and diagnose bottlenecks & issues.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-accent-light px-3 py-1 text-sm text-accent">
                      Next.js
                    </span>
                    <span className="rounded-full bg-accent-light px-3 py-1 text-sm text-accent">
                      TypeScript
                    </span>
                    <span className="rounded-full bg-accent-light px-3 py-1 text-sm text-accent">
                      Tailwind
                    </span>
                    <span className="rounded-full bg-accent-light px-3 py-1 text-sm text-accent">
                      BigQuery
                    </span>
                  </div>
                </div>
              </div>


              {/* Selective Site Blocker */}
              <div className="bg-surface rounded-xl border border-border shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
                <Image src="/specific_site_blocker_cropped.png" alt="Specific Site Blocker" width={600} height={400} className="rounded-t-xl" />
                <div className="p-4">
                  <span className="flex items-left items-center">
                    <h2 className="font-bold">Specific Site Blocker</h2>
                    <a href="https://github.com/Chanelmuir/Selective-Site-Blocker" target="_blank" rel="noopener noreferrer" className="pl-1 pr-0">
                      <i className="fa-brands fa-github"></i>
                    </a>
                  </span>
                  <p className="text-sm text-gray-500">
                    A chrome extension that allows users to block websites, whilst allowing access to specific pages on those sites.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-accent-light px-3 py-1 text-sm text-accent">
                      HTML
                    </span>
                    <span className="rounded-full bg-accent-light px-3 py-1 text-sm text-accent">
                      CSS
                    </span>
                    <span className="rounded-full bg-accent-light px-3 py-1 text-sm text-accent">
                      JavaScript
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
          {/* Blog */}
          <div className="sm:col-span-1">
            <h2 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
              Posts:
            </h2>
            {posts.map((post) => (
              <div key={post.slug} className="flex bg-surface rounded-xl border border-border shadow-sm hover:shadow-md hover:-translate-y-1 transition-all justify-between mt-4">
                <span className="p-4">
                  <a href={`/posts/${post.slug}`} className="font-bold hover:text-accent">
                    {post.title}
                  </a>
                  <p className="text-sm text-gray-500">
                    Posted: {new Date(post.date).toLocaleDateString('en-NZ')}
                  </p>
                </span>
              </div>
            ))}
          </div>
          {/* Strava */}
          <div className="sm:col-span-1">
            <h2 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
              Strava Activities:
            </h2>
            <div className="flex flex-col gap-4">
              {recentActivities.map((activity: any) => (
                <div
                  key={activity.id}
                  className="flex bg-surface rounded-xl border border-border shadow-sm hover:shadow-md hover:-translate-y-1 transition-all justify-between mt-4"
                >
                  <span className="p-4">
                    <a
                      href={`https://www.strava.com/activities/${activity.strava_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold hover:text-accent hover:shadow-md"
                    >
                      {activity.name}
                    </a>
                    <p className="text-sm text-gray-500">
                      {new Date(activity.start_date).toLocaleDateString('en-NZ', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                      })}
                      {' · '}
                      {(activity.distance_m / 1000).toFixed(1)} km
                    </p>
                  </span>
                  <span className="flex items-center pr-4">
                    <RouteSparkline route={activity.route} />
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
