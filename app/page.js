import HeroSection from "@/components/hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { featuresData, howItWorksData } from "@/data/landing";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export default function Home() {
  return (
    <div className="space-y-24">
      {/* Hero Section */}
      <HeroSection />

      {/* Feature Highlights Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary uppercase tracking-wider">
              Powerful Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-3">
              Everything you need to master your wealth
            </h2>
            <p className="text-muted-foreground mt-3 text-base">
              Smart budgets, automated receipts, recurring scheduled actions, and AI-driven financial insights.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuresData.map((feature, index) => (
              <Card
                key={index}
                className="group hover:border-primary/50 hover:shadow-lg transition-all duration-300 bg-card/60 backdrop-blur-sm"
              >
                <CardContent className="space-y-4 p-6">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold tracking-tight text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-muted/40 border-y border-border/50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary uppercase tracking-wider">
              Seamless Workflow
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-3">
              How FinTrack Simplifies Your Finances
            </h2>
            <p className="text-muted-foreground mt-3 text-base">
              Three effortless steps to financial transparency and peace of mind.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorksData.map((step, index) => (
              <div
                key={index}
                className="text-center p-6 rounded-2xl bg-card border border-border/50 shadow-sm relative group hover:shadow-md transition-shadow"
              >
                <div className="h-16 w-16 bg-primary/10 text-primary flex items-center rounded-2xl justify-center mx-auto mb-5 group-hover:scale-105 transition-transform">
                  {step.icon}
                </div>
                <div className="inline-block text-xs font-bold text-muted-foreground mb-2">
                  Step 0{index + 1}
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modern CTA */}
      <section className="container mx-auto px-4 pb-12">
        <div className="rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 p-8 sm:p-14 text-center text-white relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Ready to Take Complete Control of Your Finances?
            </h2>
            <p className="text-blue-100 text-base sm:text-lg">
              Join thousands of smart planners tracking budgets, analyzing trends, and automating reports with FinTrack.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="bg-white text-blue-700 hover:bg-blue-50 font-semibold px-8 shadow-lg hover:shadow-xl transition-all gap-2"
                >
                  <span>Open FinTrack Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
