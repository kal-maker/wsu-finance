"use client";

import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { PenBox, LayoutDashboard, Menu, X } from "lucide-react";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import useFetch from "@/hooks/use-fetch";
import { getUserProfile } from "@/actions/dashboard";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { user: clerkUser } = useUser();

  const {
    data: userProfile,
    fn: fetchUserProfile,
  } = useFetch(getUserProfile);

  useEffect(() => {
    setIsMounted(true);
    if (clerkUser) {
      fetchUserProfile();
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Mobile Navigation Item Component
  const MobileNavItem = ({ href, icon, label, onClick }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Link
        href={href}
        className="flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-cyan-500/10 transition-all duration-200 text-cyan-100 hover:text-cyan-300"
        onClick={onClick}
      >
        <div className="text-cyan-400">
          {icon}
        </div>
        <span className="font-medium text-lg">{label}</span>
      </Link>
    </motion.div>
  );

  // Prevent hydration mismatch
  if (!isMounted) {
    return (
      <header className="fixed top-0 w-full bg-navy-900/80 backdrop-blur-md z-50 border-b border-cyan-500/20">
        <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="h-12 w-32 bg-gray-200 animate-pulse rounded"></div>
          <div className="h-10 w-24 bg-gray-200 animate-pulse rounded"></div>
        </nav>
      </header>
    );
  }

  return (
    <>
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled
        ? "bg-navy-900/95 backdrop-blur-lg border-b border-cyan-500/30 shadow-lg shadow-cyan-500/10"
        : "bg-navy-900/80 backdrop-blur-md border-b border-cyan-500/20"
        }`}>
        <nav className="w-full px-4 sm:px-8 lg:px-12 py-3 flex items-center justify-between">
          {/* Logo - Mobile optimized */}
          <Link
            href="/"
            className="flex items-center gap-2 transition-transform duration-300 hover:scale-105 min-w-0"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-aqua-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <span className="text-lg font-bold text-navy-900">W</span>
            </div>
            <span className="text-lg sm:text-xl font-bold tracking-tight bg-gradient-to-r from-cyan-300 to-aqua-300 bg-clip-text text-transparent truncate">
              wsu finance
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4 lg:space-x-8">
            <SignedOut>
              <motion.a
                href="#features"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="text-cyan-100 hover:text-cyan-300 transition-all duration-300 font-medium px-3 py-2 rounded-lg hover:bg-cyan-500/10"
              >
                Features
              </motion.a>
              <motion.a
                href="#how-it-works"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="text-cyan-100 hover:text-cyan-300 transition-all duration-300 font-medium px-3 py-2 rounded-lg hover:bg-cyan-500/10"
              >
                How it Works
              </motion.a>
            </SignedOut>
          </div>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center space-x-3 lg:space-x-4">
            <SignedIn>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link href={userProfile?.role === "admin" ? "/admin" : "/dashboard"}>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 transition-all duration-300 border-cyan-400/50 text-cyan-300 hover:bg-cyan-400/10 hover:border-cyan-400 whitespace-nowrap"
                  >
                    <LayoutDashboard size={18} />
                    <span>Dashboard</span>
                  </Button>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link href="/transaction/create">
                  <Button className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-aqua-600 hover:from-cyan-600 hover:to-aqua-700 border-0 text-white transition-all duration-300 shadow-lg shadow-cyan-500/25 whitespace-nowrap">
                    <PenBox size={18} />
                    <span>Add Transaction</span>
                  </Button>
                </Link>
              </motion.div>
            </SignedIn>
            <SignedOut>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <SignInButton forceRedirectUrl="/onboarding">
                  <Button
                    variant="outline"
                    className="transition-all duration-300 border-cyan-400/50 text-cyan-300 hover:bg-cyan-400/10 hover:border-cyan-400 whitespace-nowrap"
                  >
                    Login
                  </Button>
                </SignInButton>
              </motion.div>
            </SignedOut>
            <SignedIn>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "w-9 h-9 lg:w-10 lg:h-10 border-2 border-cyan-400/50 shadow-lg shadow-cyan-500/20",
                    },
                  }}
                />
              </motion.div>
            </SignedIn>
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="md:hidden p-2 rounded-lg transition-all duration-300 hover:bg-cyan-500/10 active:bg-cyan-500/20"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <X size={24} className="text-cyan-300" />
            ) : (
              <Menu size={24} className="text-cyan-300" />
            )}
          </motion.button>
        </nav>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="md:hidden overflow-hidden bg-navy-900/98 backdrop-blur-xl border-t border-cyan-500/30 shadow-xl shadow-cyan-500/5"
            >
              <div className="w-full px-4 sm:px-8 lg:px-12 py-4 flex flex-col space-y-1 text-center">
                {/* Mobile Navigation Links */}
                <SignedOut>
                  <MobileNavItem
                    href="#features"
                    icon={<LayoutDashboard size={20} />}
                    label="Features"
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                  <MobileNavItem
                    href="#how-it-works"
                    icon={<PenBox size={20} />}
                    label="How it Works"
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                </SignedOut>

                <SignedIn>
                  <MobileNavItem
                    href={userProfile?.role === "admin" ? "/admin" : "/dashboard"}
                    icon={<LayoutDashboard size={20} />}
                    label="Dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                </SignedIn>

                <div className="pt-3 mt-3 border-t border-cyan-500/20 flex flex-col space-y-2">
                  <SignedIn>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Link
                        href="/transaction/create"
                        className="w-full"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Button className="w-full justify-center bg-gradient-to-r from-cyan-500 to-aqua-600 hover:from-cyan-600 hover:to-aqua-700 border-0 text-white shadow-lg shadow-cyan-500/25 py-5">
                          <PenBox size={20} />
                          <span className="ml-3">Add Transaction</span>
                        </Button>
                      </Link>
                    </motion.div>
                  </SignedIn>

                  <SignedOut>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <SignInButton forceRedirectUrl="/dashboard">
                        <Button
                          className="w-full justify-center bg-gradient-to-r from-cyan-500 to-aqua-600 hover:from-cyan-600 hover:to-aqua-700 border-0 text-white shadow-lg shadow-cyan-500/25 py-5"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Login
                        </Button>
                      </SignInButton>
                    </motion.div>
                  </SignedOut>

                  <SignedIn>
                    <div className="pt-2">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-navy-800/50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-aqua-600 flex items-center justify-center">
                            <span className="font-bold text-navy-900">U</span>
                          </div>
                          <div>
                            <p className="text-cyan-100 font-medium">User Account</p>
                            <p className="text-sm text-cyan-300/70">View Profile</p>
                          </div>
                        </div>
                        <UserButton afterSignOutUrl="/" />
                      </div>
                    </div>
                  </SignedIn>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Spacer for fixed header - responsive height */}
      <div className="h-16 md:h-20"></div>
    </>
  );
};

export default Header;