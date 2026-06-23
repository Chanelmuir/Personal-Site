import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="grid gap-16 sm:grid-cols-2">
          {/* Projects */}
          <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
            <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
              Projects:
            </h1>
            <div className="grid sm:grid-cols-2">
              <div>
                <Image src="/sleevemap_ss.png" alt="SleeveMap" width={300} height={200} className="border-5 border-gray-500" />
                <span className="flex items-left items-center mt-2">
                  <h2>SleeveMap</h2>
                  <a href="https://sleevemap.chanelmuir.com/" target="_blank" rel="noopener noreferrer" className="pl-1">
                    <i className="fa-solid fa-arrow-up-right-from-square" />
                  </a>
                  <a href="https://github.com/chanelmuir/sleevemap" target="_blank" rel="noopener noreferrer" className="pl-1 pr-0"><Image src="/github_logo.svg" alt="GitHub Icon" width={16} height={16} className="align-middle" /></a>
                </span>
                <p className="text-sm text-gray-500">
                  A web app for runners to track and plan running routes, with all their runs visible on one map. Built with Next.js, TypeScript, and Postgres.
                </p>
              </div>
              <div>
                <Image src="/sleevemap_ss.png" alt="SleeveMap" width={300} height={200} className="border-2 border-gray-300" />
                <span className="flex items-left items-center">
                  <h2>SleeveMap</h2>
                  <a href="https://sleevemap.chanelmuir.com/" target="_blank" rel="noopener noreferrer" className="pl-1">
                    <i className="fa-solid fa-arrow-up-right-from-square" />
                  </a>
                  <a href="https://github.com/chanelmuir/sleevemap" target="_blank" rel="noopener noreferrer" className="pl-1 pr-0"><Image src="/github_logo.svg" alt="GitHub Icon" width={16} height={16} className="align-middle" /></a>
                </span>
                <p className="text-sm text-gray-500">
                  A web app for runners to track and plan running routes, with all their runs visible on one map. Built with Next.js, TypeScript, and Postgres.
                </p>
              </div>
            </div>
          </div>
          {/* Blog */}
          <div>
            <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
              Blog:
            </h1>
          </div>
        </div>
      </main>
    </div>
  );
}
