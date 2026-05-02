import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { env } from "@/lib/env";
import { bootstrap } from "@/lib/bootstrap";
import { users } from "@/lib/collections";

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: env().NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) {
          console.log("[auth] schema parse failed");
          return null;
        }
        const adminEmail = env().ADMIN_EMAIL;
        const adminPassword = env().ADMIN_PASSWORD;
        if (parsed.data.email !== adminEmail) return null;
        if (parsed.data.password !== adminPassword) return null;

        try {
          await bootstrap();
          const user = await (await users()).findOne({ email: parsed.data.email });
          if (user) return { id: user._id.toString(), email: user.email, name: user.name };
        } catch {
          // DB unreachable — still allow admin login
        }

        return { id: "admin", email: adminEmail, name: "Admin" };
      },
    }),
  ],
  pages: { signIn: "/login" },
  callbacks: {
    authorized: ({ auth, request }) => {
      if (request.nextUrl.pathname.startsWith("/api/v1/")) return true;
      return !!auth?.user;
    },
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token?.id) session.user.id = token.id as string;
      return session;
    },
  },
});
