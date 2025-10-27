"use client";

import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { PenBox, LayoutDashboard, Menu, X } from "lucide-react";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import Image from "next/image";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent hydration mismatch
  if (!isMounted) {
    return (
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b">
        <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="h-12 w-32 bg-gray-200 animate-pulse rounded"></div>
          <div className="h-10 w-24 bg-gray-200 animate-pulse rounded"></div>
        </nav>
      </header>
    );
  }

  return (
    <>
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? "bg-white/95 backdrop-blur-lg border-b shadow-lg" 
          : "bg-white/80 backdrop-blur-md border-b"
      }`}>
        <nav className="container mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center transition-transform duration-300 hover:scale-105"
          >
            <Image
              src={"/logo.png"}
              alt="Welth Logo"
              width={160}
              height={48}
              className="h-12 w-auto object-contain"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <SignedOut>
              <a 
                href="#features" 
                className="text-gray-600 hover:text-blue-600 transition-all duration-300 transform hover:scale-105 font-medium"
              >
                Features
              </a>
              <a
                href="#testimonials"
                className="text-gray-600 hover:text-blue-600 transition-all duration-300 transform hover:scale-105 font-medium"
              >
                Testimonials
              </a>
              <a
                href="#pricing"
                className="text-gray-600 hover:text-blue-600 transition-all duration-300 transform hover:scale-105 font-medium"
              >
                Pricing
              </a>
            </SignedOut>
          </div>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <SignedIn>
              <Link href="/dashboard" className="transition-transform duration-300 hover:scale-105">
                <Button variant="outline" className="flex items-center gap-2 transition-all duration-300 hover:shadow-md">
                  <LayoutDashboard size={18} />
                  <span>Dashboard</span>
                </Button>
              </Link>
              <Link href="/transaction/create" className="transition-transform duration-300 hover:scale-105">
                <Button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:shadow-lg">
                  <PenBox size={18} />
                  <span>Add Transaction</span>
                </Button>
              </Link>
            </SignedIn>
            <SignedOut>
              <SignInButton forceRedirectUrl="/dashboard">
                <Button variant="outline" className="transition-all duration-300 hover:shadow-md">
                  Login
                </Button>
              </SignInButton>
              <SignInButton forceRedirectUrl="/dashboard">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:shadow-lg">
                  Get Started Free
                </Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <div className="transition-transform duration-300 hover:scale-110">
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "w-10 h-10 border-2 border-white shadow-md",
                    },
                  }}
                />
              </div>
            </SignedIn>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 rounded-lg transition-all duration-300 hover:bg-gray-100"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>

        {/* Mobile Menu */}
        <div className={`md:hidden transition-all duration-300 overflow-hidden ${
          isMobileMenuOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
        }`}>
          <div className="container mx-auto px-4 pb-4 flex flex-col space-y-3">
            <SignedOut>
              <a 
                href="#features" 
                className="text-gray-600 hover:text-blue-600 transition-all duration-300 py-2 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Features
              </a>
              <a
                href="#testimonials"
                className="text-gray-600 hover:text-blue-600 transition-all duration-300 py-2 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Testimonials
              </a>
              <a
                href="#pricing"
                className="text-gray-600 hover:text-blue-600 transition-all duration-300 py-2 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Pricing
              </a>
            </SignedOut>
            
            <div className="pt-2 border-t flex flex-col space-y-3">
              <SignedIn>
                <Link 
                  href="/dashboard" 
                  className="w-full"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Button variant="outline" className="w-full justify-center">
                    <LayoutDashboard size={18} />
                    <span className="ml-2">Dashboard</span>
                  </Button>
                </Link>
                <Link 
                  href="/transaction/create" 
                  className="w-full"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Button className="w-full justify-center bg-gradient-to-r from-blue-600 to-purple-600">
                    <PenBox size={18} />
                    <span className="ml-2">Add Transaction</span>
                  </Button>
                </Link>
              </SignedIn>
              <SignedOut>
                <SignInButton forceRedirectUrl="/dashboard">
                  <Button variant="outline" className="w-full justify-center">
                    Login
                  </Button>
                </SignInButton>
                <SignInButton forceRedirectUrl="/dashboard">
                  <Button className="w-full justify-center bg-gradient-to-r from-blue-600 to-purple-600">
                    Get Started Free
                  </Button>
                </SignInButton>
              </SignedOut>
            </div>
          </div>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-16"></div>

      <style jsx>{`
        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        header {
          animation: slideDown 0.5s ease-out;
        }
      `}</style>
    </>
  );
};

export default Header;