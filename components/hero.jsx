"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const HeroSection = () => {
  const [currentWord, setCurrentWord] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const rotatingWords = ["Intelligence", "AI", "Ease", "Confidence"];

  useEffect(() => {
    // Word rotation effect
    const wordInterval = setInterval(() => {
      setCurrentWord((prev) => (prev + 1) % rotatingWords.length);
    }, 2000);

    // Fade in animation
    setIsVisible(true);

    return () => {
      clearInterval(wordInterval);
    };
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/hero1.jpg')",
        }}
      >
        {/* Dark gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900/90 to-teal-900/80"></div>

        {/* Subtle animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-aqua-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-turquoise-500/5 rounded-full blur-2xl animate-pulse delay-500"></div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-8 lg:px-12 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 50 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl pb-6 font-bold leading-tight text-white">
            Manage Your Finances <br />
            with{" "}
            <span className="relative inline-block">
              <AnimatePresence mode="wait">
                <motion.span
                  key={currentWord}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="bg-gradient-to-r from-cyan-400 to-aqua-500 bg-clip-text text-transparent"
                >
                  {rotatingWords[currentWord]}
                </motion.span>
              </AnimatePresence>
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto leading-relaxed"
          >

          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 40 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row justify-center gap-4 mb-12"
          >
            <Link href="/dashboard">
              <Button
                size="lg"
                className="px-8 py-3 text-lg bg-gradient-to-r from-cyan-500 to-aqua-600 hover:from-cyan-600 hover:to-aqua-700 border-0 text-white transition-all duration-300 transform hover:scale-105 shadow-lg shadow-cyan-500/25"
              >
                Get Started
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Feature Highlights */}
        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isVisible ? 1 : 0 }}
          transition={{ duration: 1, delay: 1.5 }}
          className="mt-16 flex flex-col items-center"
        >
          <span className="text-cyan-300 text-sm mb-2">Scroll to explore</span>
          <div className="w-6 h-10 border-2 border-cyan-400/50 rounded-full flex justify-center">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1 h-3 bg-cyan-400 rounded-full mt-2"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;