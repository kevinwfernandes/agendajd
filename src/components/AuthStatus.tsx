"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function AuthStatus() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";

  if (isLoading) {
    return <div className="text-jd-secondary animate-pulse">Carregando...</div>;
  }

  if (session) {
    return (
      <div className="flex items-center gap-4">
        <div className="text-jd-light">
          Olá, {session.user.name}
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="bg-jd-accent hover:bg-jd-accent-dark text-jd-primary px-4 py-2 rounded transition-colors"
        >
          Sair
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className="bg-jd-accent hover:bg-jd-accent-dark text-jd-primary px-4 py-2 rounded transition-colors"
    >
      Entrar
    </Link>
  );
} 