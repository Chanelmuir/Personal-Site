export default function Navbar() {
  return (
    <div className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-sm">
      <div className="flex justify-between items-center gap-4 px-6 py-5 sm:px-16 max-w-6xl mx-auto w-full">
        {/* Left (Main Page) */}
        <a
          href="/"
          className="font-serif text-lg italic tracking-tight text-text-primary hover:text-accent transition-colors"
        >
          chanelmuir.com
        </a>
        {/* Right (Navigation Links) */}
        <div className="flex gap-6 text-sm text-text-secondary">
          <a href="/gallery" className="hover:text-accent transition-colors">
            Gallery
          </a>
          {/* <a href="/contact" className="hover:text-accent">
            Contact
          </a> */}
        </div>
      </div>
    </div>
  );
}