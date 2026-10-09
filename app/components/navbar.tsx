import Link from "next/link";

export default function Navbar() {
  return (
    <div className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-sm">
      <div className="flex justify-between items-center gap-3 px-6 py-5 sm:gap-4 sm:px-16 max-w-6xl mx-auto w-full">
        {/* Left (Main Page) */}
        <a
          href="/"
          className="font-serif text-base text-text-primary sm:text-lg hover:text-accent transition-colors"
        >
          chanelmuir<span className="hidden min-[420px]:inline">.com</span>
        </a>
        {/* Right (Navigation Links) */}
        <div className="flex items-center gap-2.5 text-[13px] min-[375px]:gap-3 text-text-secondary sm:gap-6 sm:text-sm">
          <a href="/gallery" className="run-link hover:text-accent transition-colors">
            Gallery
          </a>
          <a href="/nrr" className="run-link hover:text-accent transition-colors">
            NRR
          </a>
          <a href="/training" className="run-link hover:text-accent transition-colors">
            Training
          </a>
          <Link href="/dsa" className="run-link hover:text-accent transition-colors">
            DSA
          </Link>
          <a
            href="https://github.com/chanelmuir"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="hover:text-accent transition-colors"
          >
            <i className="fa-brands fa-github"></i>
          </a>
          <a href="mailto:chanelkmuir@gmail.com" aria-label="Email" className="hover:text-accent transition-colors">
            <i className="fa-solid fa-envelope"></i>
          </a>
          {/* <a href="/contact" className="hover:text-accent">
            Contact
          </a> */}
        </div>
      </div>
    </div>
  );
}