import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { getSystemSettings } from "@/app/lib/db-utils";
import { CurrencyProvider } from "@/context/currency-context";
import SessionTimeoutWrapper from "@/components/session-timeout-wrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "WSU Financial System",
  description: "AI-Driven Automated Budgeting and Financial Management System",
};

export default async function RootLayout({ children }) {
  // Load system settings (including maintenance flag)
  const [settings, clerkUser] = await Promise.all([
    getSystemSettings().catch(() => ({})),
    currentUser(),
  ]);

  // DEBUG: log clerk user id and fetched settings for tracing
  try {
    console.log('Layout debug: clerkUser id=', clerkUser?.id);
    console.log('Layout debug: settings.system=', settings?.system);
  } catch (err) {
    console.error('Layout debug error:', err);
  }

  const maintenanceMode = settings?.system?.maintenanceMode === true;

  // Determine if current user is an admin (allowed to bypass maintenance)
  let isAdmin = false;
  if (clerkUser) {
    const dbUser = await db.user.findFirst({
      where: { clerkUserId: clerkUser.id },
      select: { role: true },
    });
    isAdmin = dbUser?.role === "admin";
  }

  const showMaintenance = maintenanceMode && !isAdmin;

  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link rel="icon" href="/logo-sm.png" sizes="any" />
        </head>
        <body className={`${inter.className}`}>
          <CurrencyProvider initialCurrency={settings?.financial?.defaultCurrency || "ETB"}>
            <SessionTimeoutWrapper timeoutMinutes={settings?.security?.sessionTimeout || 5}>
              {showMaintenance ? (
                <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-navy-900 via-navy-800 to-navy-900 text-white px-4">
                  <div className="max-w-lg text-center space-y-4">
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                      We&apos;ll be right back
                    </h1>
                    <p className="text-sm md:text-base text-blue-100">
                      The WSU Finance system is currently in{" "}
                      <span className="font-semibold">maintenance mode</span>.
                      During this time, access is temporarily disabled for regular
                      users while we apply updates and improvements.
                    </p>
                    <p className="text-xs md:text-sm text-blue-200">
                      If you are an administrator, you can sign in and disable
                      maintenance mode from the Admin Settings panel when
                      maintenance is complete.
                    </p>

                  </div>
                </div>
              ) : (
                <>
                  <Header />
                  <main className="min-h-screen">{children}</main>
                  <Toaster richColors />

                  <footer className="bg-blue-50 py-12">
                    <div className="w-full px-4 sm:px-8 lg:px-12 text-center text-gray-600">
                      <p>@WSU finance platform</p>
                    </div>
                  </footer>
                </>
              )}
            </SessionTimeoutWrapper>
          </CurrencyProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
