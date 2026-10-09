"use client";

import { useEffect, useRef, useState } from "react";

const pages = [
  { href: "/gallery", label: "Gallery" },
  { href: "/nrr", label: "NRR" },
  { href: "/training", label: "Training" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the phone menu on a tap outside it or on Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

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
        <div className="flex items-center gap-5 sm:gap-6 text-sm text-text-secondary">
          {pages.map((page) => (
            <a key={page.href} href={page.href} className="hidden sm:inline run-link hover:text-accent transition-colors">
              {page.label}
            </a>
          ))}
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
          {/* Phones: pages go in a dropdown on the right */}
          <div ref={menuRef} className="relative sm:hidden">
            <button
              type="button"
              aria-label="Menu"
              aria-expanded={menuOpen}
              aria-controls="nav-menu"
              onClick={() => setMenuOpen((open) => !open)}
              className="flex items-center hover:text-accent transition-colors"
            >
              <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                {menuOpen ? <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" /> : <path d="M2 4h12M2 8h12M2 12h12" />}
              </svg>
            </button>
            {menuOpen && (
              <nav
                id="nav-menu"
                className="absolute right-0 top-full mt-3 min-w-36 rounded-md border border-border bg-surface py-2 shadow-lg"
              >
                {pages.map((page) => (
                  <a
                    key={page.href}
                    href={page.href}
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-right text-text-secondary hover:text-accent transition-colors"
                  >
                    {page.label}
                  </a>
                ))}
              </nav>
            )}
          </div>
          {/* <a href="/contact" className="hover:text-accent">
            Contact
          </a> */}
        </div>
      </div>
    </div>
  );
}
