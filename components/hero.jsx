"use client";

import { useRef, useEffect } from "react";
import { Sparkles, Calendar as CalendarIcon, Filter, Layers } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";

const HeroSection = () => {
  const imageRef = useRef(null);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const imageElement = imageRef.current;
          if (!imageElement) return;

          const scrollPosition = window.scrollY;
          const scrollThreshold = 60;

          if (scrollPosition > scrollThreshold) {
            imageElement.classList.add("scrolled");
          } else {
            imageElement.classList.remove("scrolled");
          }

          ticking = false;
        });

        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="pt-6 pb-20 px-4 relative overflow-hidden">
      {/* Background glow meshes */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-blue-600/15 via-indigo-500/15 to-purple-500/15 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="container mx-auto text-center max-w-5xl">
        {/* Floating Product Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold mb-6 shadow-xs animate-fade-in">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>FinTrack 2.0 • AI-Powered Personal Finance Platform</span>
        </div>

        {/* Main Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight pb-6 leading-[1.08]">
          Manage Your Finances <br className="hidden sm:inline" />
          <span className="gradient-title">with Intelligence</span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
          Real-time budgeting, OCR receipt scanning, recurring transaction automation, and actionable Gemini AI insights — all in one modern workspace.
        </p>

        {/* Call to Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto px-8 h-12 text-base font-semibold bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/35"
            >
              Get Started for Free
            </Button>
          </Link>
          <a href="#features" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto px-6 h-12 text-base border-border/80 hover:bg-muted/50"
            >
              Explore Features
            </Button>
          </a>
        </div>

        {/* Hero Interactive App Mockup Preview */}
        <div className="hero-image-wrapper relative max-w-5xl mx-auto">
          <div
            ref={imageRef}
            className="hero-image rounded-2xl border border-border/70 bg-card/90 shadow-2xl backdrop-blur-xl overflow-hidden transition-all duration-700 text-left"
          >
            {/* Mock Window Top Bar */}
            <div className="h-10 bg-muted/40 border-b border-border/50 px-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-xs font-mono text-muted-foreground">
                  fintrack.app/dashboard
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Financial Sync</span>
              </div>
            </div>

            {/* Mock Dashboard Interior */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Top Banner Card: Budget Progress */}
              <div className="p-5 rounded-xl border border-border/60 bg-gradient-to-r from-muted/30 via-background to-primary/5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm">Monthly Budget Target</h4>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        Default Account
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Intelligent real-time tracking against ₹75,000 monthly target
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md">
                    42% Utilized • Safe
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-card border border-border/40">
                    <span className="text-[11px] text-muted-foreground block">Allocated</span>
                    <span className="text-base sm:text-lg font-bold">₹75,000</span>
                  </div>
                  <div className="p-3 rounded-lg bg-card border border-border/40">
                    <span className="text-[11px] text-muted-foreground block">Spent So Far</span>
                    <span className="text-base sm:text-lg font-bold text-rose-500">₹31,450</span>
                  </div>
                  <div className="p-3 rounded-lg bg-card border border-border/40">
                    <span className="text-[11px] text-muted-foreground block">Remaining</span>
                    <span className="text-base sm:text-lg font-bold text-emerald-500">₹43,550</span>
                  </div>
                  <div className="p-3 rounded-lg bg-card border border-border/40">
                    <span className="text-[11px] text-muted-foreground block">Savings Projected</span>
                    <span className="text-base sm:text-lg font-bold text-blue-500">+18.5%</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 h-full w-[42%] rounded-full" />
                </div>
              </div>

              {/* Lower 2 Columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Visual Chart Card */}
                <div className="md:col-span-2 p-5 rounded-xl border border-border/60 bg-card">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h5 className="font-semibold text-sm">Income vs Expense Trends</h5>
                      <p className="text-xs text-muted-foreground">Past 30 days daily cashflow</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1 text-emerald-500 font-medium">
                        <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> Income
                      </span>
                      <span className="flex items-center gap-1 text-rose-500 font-medium">
                        <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" /> Expense
                      </span>
                    </div>
                  </div>

                  {/* SVG Bar Chart Visualization */}
                  <div className="h-40 w-full flex items-end justify-between gap-2 pt-6">
                    {[
                      { inc: 80, exp: 40 },
                      { inc: 45, exp: 30 },
                      { inc: 95, exp: 60 },
                      { inc: 30, exp: 70 },
                      { inc: 110, exp: 50 },
                      { inc: 65, exp: 35 },
                      { inc: 120, exp: 45 },
                      { inc: 75, exp: 55 },
                      { inc: 100, exp: 30 },
                    ].map((item, idx) => (
                      <div key={idx} className="flex-1 flex items-end justify-center gap-1 h-full">
                        <div
                          style={{ height: `${(item.inc / 130) * 100}%` }}
                          className="w-3 sm:w-4 bg-emerald-500/80 rounded-t-sm"
                        />
                        <div
                          style={{ height: `${(item.exp / 130) * 100}%` }}
                          className="w-3 sm:w-4 bg-rose-500/80 rounded-t-sm"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground pt-2 border-t border-border/30 mt-2 font-mono">
                    <span>Oct 01</span>
                    <span>Oct 10</span>
                    <span>Oct 20</span>
                    <span>Oct 25 (Today)</span>
                  </div>
                </div>

                {/* AI Financial Insights Badge & Recent Stream */}
                <div className="p-5 rounded-xl border border-border/60 bg-gradient-to-b from-primary/[0.04] to-card flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <h5 className="font-semibold text-sm">Gemini AI Wealth Advice</h5>
                    </div>
                    <div className="space-y-2.5 text-xs text-muted-foreground">
                      <div className="p-2.5 rounded-lg bg-card border border-border/50">
                        <p className="font-medium text-foreground">💡 Food & Dining Alert</p>
                        <p className="text-[11px] mt-0.5">Dining spending is 12% lower than last week. Great pace!</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-card border border-border/50">
                        <p className="font-medium text-foreground">📈 Automated Recurring Saved</p>
                        <p className="text-[11px] mt-0.5">Netflix & Gym subscriptions auto-verified for Nov 1st.</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Confidence Score</span>
                    <span className="font-semibold text-primary">99.4% Accurate</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
