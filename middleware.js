// middleware.js
import arcjet, { createMiddleware, detectBot, shield } from "@arcjet/next";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedPageRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/account(.*)",
  "/admin(.*)",
]);

const isProtectedApiRoute = createRouteMatcher([
  "/api/transaction(.*)",
  "/api/account(.*)",
  "/api/admin(.*)",
]);

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhook(.*)",
  "/api/inngest(.*)",
  // Add Server Actions routes here (they handle auth internally)
  "/transaction/create", // Server Action route - don't protect
]);

const isAdminRoute = createRouteMatcher([
  "/admin(.*)",
  "/api/admin(.*)",
]);

// Create Arcjet middleware
const aj = arcjet({
  key: process.env.ARCJET_KEY,
  rules: [
    shield({
      mode: "DRY_RUN", // Was LIVE - monitoring only to prevent 403s in dev
    }),
    detectBot({
      mode: "DRY_RUN", // Was LIVE - monitoring only to prevent 403s in dev
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
  const method = req.method;

  console.log('Middleware checking:', url, 'Method:', method, 'User ID:', userId);

  // Allow public routes to pass through
  if (isPublicRoute(req)) {
    console.log('Public route - allowing access');
    return NextResponse.next();
  }

  // Special handling for Server Action routes (POST requests)
  // Server Actions handle auth internally, so don't block them
  if (method === 'POST' && url === '/transaction/create') {
    console.log('Server Action route - allowing through');
    return NextResponse.next();
  }

  // For protected API routes, require authentication
  if (isProtectedApiRoute(req) && !userId) {
    console.log('Unauthorized API access attempt:', url);
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // For protected page routes, redirect to sign-in
  if (isProtectedPageRoute(req) && !userId) {
    console.log('Redirecting to sign in for protected page:', url);
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }

  // For authenticated users accessing admin routes
  if (userId && isAdminRoute(req)) {
    console.log('Admin route accessed by authenticated user:', userId);
    // Admin role verification will happen in the server component/API route
  }

  return NextResponse.next();
});

// Chain middlewares - ArcJet runs first, then Clerk
export default createMiddleware(aj, clerk);

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};