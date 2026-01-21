"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    featuresData,
    howItWorksData,
} from "@/data/landing";
import HeroSection from "@/components/hero";
import Link from "next/link";
import { motion } from "framer-motion";
import { Brain, Activity, Shield } from "lucide-react";

const LandingClient = () => {
    const featureHighlights = [
        { icon: <Brain className="h-8 w-8 text-cyan-400" />, title: "AI Powered", desc: "Smart categorization & insights" },
        { icon: <Activity className="h-8 w-8 text-cyan-400" />, title: "Real-time Analytics", desc: "Live budget tracking" },
        { icon: <Shield className="h-8 w-8 text-cyan-400" />, title: "Secure & Private", desc: "Bank-level encryption" }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-navy-900 to-cyan-900 text-white">
            {/* Hero Section */}
            <HeroSection />

            {/* Feature Highlights Section */}
            <section className="py-20 bg-gradient-to-br from-navy-900/95 to-cyan-900/95">
                <div className="w-full px-4 sm:px-8 lg:px-12">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto"
                    >
                        {featureHighlights.map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-cyan-500/20 hover:border-cyan-400/40 transition-all duration-300 hover:transform hover:scale-105"
                            >
                                <div className="mb-4 flex justify-center">{feature.icon}</div>
                                <h3 className="text-cyan-300 font-semibold text-xl mb-3">{feature.title}</h3>
                                <p className="text-gray-300 text-base">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 bg-gradient-to-br from-navy-800 to-cyan-800">
                <div className="w-full px-4 sm:px-8 lg:px-12">
                    <motion.h2
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-cyan-400 to-aqua-400 bg-clip-text text-transparent"
                    >
                        Everything you need to manage your finances
                    </motion.h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {featuresData.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                viewport={{ once: true }}
                            >
                                <Card className="p-6 bg-white/5 backdrop-blur-sm border border-cyan-500/20 hover:border-cyan-400/40 hover:bg-white/10 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10">
                                    <CardContent className="space-y-4 pt-4">
                                        {feature.icon}
                                        <h3 className="text-xl font-semibold text-cyan-100">{feature.title}</h3>
                                        <p className="text-gray-300">{feature.description}</p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="py-20 bg-gradient-to-br from-navy-700 to-cyan-700">
                <div className="w-full px-4 sm:px-8 lg:px-12">
                    <motion.h2
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-cyan-400 to-aqua-400 bg-clip-text text-transparent"
                    >
                        How It Works
                    </motion.h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {howItWorksData.map((step, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="text-center"
                            >
                                <div className="w-20 h-20 bg-gradient-to-r from-cyan-500 to-aqua-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-500/25">
                                    {step.icon}
                                </div>
                                <h3 className="text-xl font-semibold mb-4 text-cyan-100">{step.title}</h3>
                                <p className="text-gray-300">{step.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-r from-cyan-600 to-aqua-600">
                <div className="container mx-auto px-4 text-center">
                    <motion.h2
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="text-4xl font-bold text-white mb-4"
                    >
                        Ready to Take Control of Your Finances?
                    </motion.h2>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        viewport={{ once: true }}
                    >
                        <Link href="/dashboard">
                            <Button
                                size="lg"
                                className="bg-white text-cyan-600 hover:bg-cyan-50 px-8 py-3 text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/25 font-semibold"
                            >
                                Start Now
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </section>
        </div>
    );
};

export default LandingClient;
