import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Painel da Agência',
      credentials: {
        username: { label: "Usuário", type: "text", placeholder: "admin" },
        password: { label: "Senha", type: "password" }
      },
      async authorize(credentials, req) {
        // Mock authentication for MVP. Em prod, isso deve checar contra o banco de dados.
        const user = { id: "1", name: "Agência Admin", email: "admin@agencia.com" };
        
        // Verifica contra o .env ou usa admin/admin como fallback pro dev
        const validUser = process.env.ADMIN_USER || "admin";
        const validPass = process.env.ADMIN_PASS || "admin";

        if (credentials?.username === validUser && credentials?.password === validPass) {
          return user;
        } else {
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "super-secret-jwt-key-do-not-use-in-prod"
});

export { handler as GET, handler as POST }
