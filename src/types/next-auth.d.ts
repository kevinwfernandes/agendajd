import NextAuth from "next-auth";
import { TipoUsuario } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string;
      tipoUsuario?: TipoUsuario;
      classeId?: number;
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    tipoUsuario?: TipoUsuario;
    classeId?: number;
  }
} 