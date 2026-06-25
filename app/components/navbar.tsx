import Image from "next/image";

export default function Navbar() {
  return (
    <div className="fixed w-full">
      <div className="flex justify-between gap-4 p-4 bg-surface border-b border-border">
        {/* Left (Main Page) */}
        <div>
          <h1 className="font-extrabold font-serif text-slate-600 hover:text-accent"><a href="/">chanelmuir.com</a></h1>
        </div>
        {/* Right (Navigation Links) */}
        <div className="flex gap-4 align-end mr-5 text-text-secondary">
          <a href="/projects" className="hover:text-accent">
            Projects
          </a>
          <a href="/training" className="hover:text-accent">
            Training
          </a>
          <a href="/blog" className="hover:text-accent">
            Blog
          </a>
          <a href="/contact" className="hover:text-accent">
            Contact
          </a>
        </div>
      </div>
    </div>
  );
}