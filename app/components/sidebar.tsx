import Image from "next/image";

export default function Sidebar() {
  return (
    <div className="fixed">
      <div className="flex flex-col items-left gap-4 p-4 bg-slate-100 h-screen">
        {/* <div className="relative size-12 text-center">
          <Image
              className="rounded-full"
              src="/the_sleeve_pfp.jpg"
              alt="Chanel Muir"
              priority
              fill
            />
        </div> */}
        <div>
          <h1 className="font-extrabold font-serif text-slate-600 hover:underline"><a href="/">chanelmuir.com</a></h1>
        </div>
        <a href="/projects" className="hover:underline">
          Projects
        </a>
        <a href="/training" className="hover:underline">
          Training
        </a>
        <a href="/gallery" className="hover:underline">
          Gallery Game
        </a>
        <a href="/blog" className="hover:underline">
          Blog
        </a>
        <a href="/contact" className="hover:underline">
          Contact
        </a>
      </div>
    </div>
  );
}