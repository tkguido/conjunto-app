import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: '/login',
  },
});

// Protect only the agency dashboard, leave /cliente (Client View) and APIs public for now
// (In a real app, API routes for mutations should also check the session)
export const config = {
  matcher: ['/dashboard/:path*'],
};
