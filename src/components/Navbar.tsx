import React from 'react';
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-jd-primary shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-jd-accent text-xl font-bold">AgendaJD</span>
            </div>
            <div className="hidden md:block ml-10">
              <div className="flex items-center space-x-4">
                <Link href="/" className="nav-link">
                  Início
                </Link>
                <Link href="/eventos" className="nav-link">
                  Eventos
                </Link>
                <Link href="/recados" className="nav-link">
                  Recados
                </Link>
                <Link href="/calendario" className="nav-link">
                  Calendário
                </Link>
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="flex items-center">
              <button type="button" className="btn-accent">
                Entrar
              </button>
            </div>
          </div>
          <div className="md:hidden flex items-center">
            <button
              type="button"
              className="text-jd-secondary hover:text-jd-cyan"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Abrir menu</span>
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Menu mobile */}
      <div className="md:hidden hidden" id="mobile-menu">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <Link href="/" className="nav-link block px-3 py-2">
            Início
          </Link>
          <Link href="/eventos" className="nav-link block px-3 py-2">
            Eventos
          </Link>
          <Link href="/recados" className="nav-link block px-3 py-2">
            Recados
          </Link>
          <Link href="/calendario" className="nav-link block px-3 py-2">
            Calendário
          </Link>
        </div>
      </div>
    </nav>
  );
} 