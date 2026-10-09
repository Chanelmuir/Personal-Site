export default function Navbar() {
  return (
    <div className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-sm">
      <div className="flex justify-between items-center gap-4 px-6 py-5 sm:px-16 max-w-6xl mx-auto w-full">
        {/* Left (Main Page) */}
        <a
          href="/"
          className="font-serif text-lg text-text-primary hover:text-accent transition-colors"
        >
          chanelmuir.com
        </a>
        {/* Right (Navigation Links) */}
        <div className="flex items-center gap-6 text-sm text-text-secondary">
          <a href="/gallery" className="run-link hover:text-accent transition-colors">
            Gallery
          </a>
          <a href="/nrr" className="run-link hover:text-accent transition-colors">
            NRR
          </a>
          <a href="/training" className="run-link hover:text-accent transition-colors">
            Training
          </a>
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