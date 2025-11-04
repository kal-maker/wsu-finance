// middleware.js
import arcjet, { createMiddleware, detectBot, shield } from "@arcjet/next";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/account(.*)",
  "/transaction(.*)",
  "/admin(/.*)?", // Add admin routes to protected routes
]);

const isAdminRoute = createRouteMatcher([
  "/admin(/.*)?", // All admin routes
  "/api/admin(/.*)?", // All admin API routes
]);

// Create Arcjet middleware
const aj = arcjet({
  key: process.env.ARCJET_KEY,
  rules: [
    shield({
      mode: "LIVE",
    }),
    detectBot({
      mode: "LIVE",
      allow: [
        "CATEGORY:SEARCH_ENGINE",
        "GO_HTTP",
      ],
    }),
  ],
});

// Create base Clerk middleware
const clerk = clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const url = req.nextUrl.pathname;

  console.log('Middleware checking:', url, 'User ID:', userId);
  console.log('Is protected route?', isProtectedRoute(req));
  console.log('Is admin route?', isAdminRoute(req));

  // Redirect unauthenticated users from protected routes
  if (!userId && isProtectedRoute(req)) {
    console.log('Redirecting to sign in for:', url);
    const { redirectToSignIn } = await auth();
    return redirectToSignIn();
  }

  // For admin routes, we'll check admin status in the server components/API routes
  // The middleware ensures authentication, then server-side checks verify admin role
  if (userId && isAdminRoute(req)) {
    console.log('Admin route accessed by user:', userId);
    // The actual admin role check will happen in server components and API routes
  }

  return NextResponse.next();
});

// Chain middlewares - ArcJet runs first, then Clerk
export default createMiddleware(aj, clerk);

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};