import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

// Onboarding/redirect page:
// - Called after sign-in
// - Looks up the user's role in the database
// - Sends admins to /admin and regular users to /dashboard
// - Also respects ?redirect_url=/some/path when appropriate
export default async function OnboardingPage({ searchParams }) {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    redirect("/sign-in");
  }

  // Fetch role from your Prisma-backed users table
  const dbUser = await db.user.findFirst({
    where: { clerkUserId: clerkUser.id },
    select: { role: true },
  });

  const userRole = dbUser?.role || "user";
  const redirectUrl = searchParams?.redirect_url;

  // If there's a redirect URL and it's an admin path, only allow admins
  if (redirectUrl && redirectUrl.startsWith("/admin") && userRole === "admin") {
    redirect(redirectUrl);
  }

  // If there's a redirect URL and it's not an admin path, allow it for any signed-in user
  if (redirectUrl && !redirectUrl.startsWith("/admin")) {
    redirect(redirectUrl);
  }

  // Default: admins → /admin, everyone else → /dashboard
  if (userRole === "admin") {
    redirect("/admin");
  }

  redirect("/dashboard");
}


