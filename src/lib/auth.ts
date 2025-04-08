import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient, TipoUsuario } from "@prisma/client";
import { compare } from "bcryptjs";
import { JWT } from "next-auth/jwt";
import { Session } from "next-auth";
import type { NextAuthOptions } from "next-auth";

// Criar nova instância do Prisma
const prisma = new PrismaClient();

// Estendendo os tipos para incluir campos customizados
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string | null;
      tipoUsuario?: string | null;
      classeId?: number | null;
    }
  }

  interface User {
    id: string;
    email: string;
    name: string;
    image?: string | null;
    tipoUsuario?: string | null;
    classeId?: number | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    tipoUsuario?: string | null;
    classeId?: number | null;
  }
}

// Lista de tipos de usuário admin
export const ADMIN_TYPES = [
  'MACOM_ADMIN_GERAL', 
  'ADMIN_DM', 
  'ADMIN_FDJ', 
  'ADMIN_FRATERNA'
];

// Função auxiliar para verificar se um usuário é administrador
export const isUserAdmin = (tipoUsuario: string | null | undefined): boolean => {
  if (!tipoUsuario) return false;
  return ADMIN_TYPES.includes(tipoUsuario);
};

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            passwordHash: true,
            tipoUsuario: true,
            classeId: true
          }
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await compare(credentials.password, user.passwordHash);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          tipoUsuario: user.tipoUsuario ? String(user.tipoUsuario) : null,
          classeId: user.classeId
        };
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string;
        session.user.tipoUsuario = token.tipoUsuario;
        session.user.classeId = token.classeId;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.tipoUsuario = user.tipoUsuario;
        token.classeId = user.classeId;
      }
      return token;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

export default authOptions; 