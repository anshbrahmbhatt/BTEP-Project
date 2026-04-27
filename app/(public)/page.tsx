import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BookOpen, GraduationCap, Layout, Users, Sparkles, Zap, Trophy, MessageSquare } from "lucide-react";
import Link from "next/link";
import React from "react";
import { prisma } from "@/lib/db";

interface FeatureProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const features: FeatureProps[] = [
  {
    title: "Comprehensive Courses",
    description: "Access a wide range of carefully curated courses designed by industry experts with real-world applications.",
    icon: <BookOpen className="w-8 h-8 text-blue-500" />,
  },
  {
    title: "Interactive Learning",
    description: "Engage with interactive content, live quizzes, and practical assignments to enhance your experience.",
    icon: <Zap className="w-8 h-8 text-yellow-500" />,
  },
  {
    title: "Gamified Progress",
    description: "Monitor your progress, climb leaderboards, earn daily streaks, and celebrate achievements.",
    icon: <Trophy className="w-8 h-8 text-green-500" />,
  },
  {
    title: "Community & AI Support",
    description: "Join vibrant learners, and get instant answers anytime with our smart contextual AI assistant.",
    icon: <MessageSquare className="w-8 h-8 text-purple-500" />,
  },
];

export default async function Home() {
  const start = performance.now();
  
  // Fetch real active information
  const [learnersCount, coursesCount, instructorsCount] = await Promise.all([
    prisma.user.count(),
    prisma.course.count({ where: { status: "Published" } }),
    prisma.user.count({ where: { role: "ADMIN" } }),
  ]);

  const end = performance.now();
  const responseTime = Math.max(1, Math.round(end - start)); // Simple benchmark of DB latency

  const stats = [
    { label: "Active Learners", value: learnersCount.toLocaleString() },
    { label: "Premium Courses", value: coursesCount.toLocaleString() },
    { label: "Expert Instructors", value: instructorsCount > 0 ? instructorsCount.toLocaleString() : "1" },
    { label: "Avg. Response Time", value: `${responseTime}ms` },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute left-1/2 top-0 -z-10 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />

      <section className="relative flex justify-center pb-20 pt-24 md:pt-32">
        <div className="flex max-w-5xl flex-col items-center space-y-8 px-4 text-center">
          <div>
            <Badge
              variant="secondary"
              className="flex items-center gap-2 border border-border bg-background/75 px-4 py-1.5 text-sm font-medium shadow-sm backdrop-blur-md"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              The Future of Online Education
            </Badge>
          </div>

          <div>
            <h1 className="pb-2 text-5xl font-extrabold tracking-tight md:text-7xl">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-pink-500">
                Elevate your
              </span>{" "}
              Learning Experience
            </h1>
          </div>

          <div>
            <p className="max-w-[750px] text-muted-foreground md:text-xl font-medium leading-relaxed">
              Discover a new way to learn with our modern, interactive learning
              management system. Access high-quality courses anytime, anywhere, and master new skills faster than ever.
            </p>
          </div>

          <div className="mt-8 flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
            <Link
              className={buttonVariants({
                size: "lg",
                className: "h-12 rounded-xl px-7 text-base shadow-md group",
              })}
              href="/courses"
            >
              Explore Courses
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              className={buttonVariants({
                size: "lg",
                variant: "outline",
                className: "h-12 rounded-xl border-border/80 bg-background/70 px-7 text-base backdrop-blur-sm",
              })}
              href="/login"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-32">
        <div className="mb-16 text-center">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Why choose our platform?</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Everything you need to accelerate your learning journey in one place.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <div key={index} className="h-full">
              <Card className="group relative h-full overflow-hidden border-border/50 bg-background/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardHeader>
                  <div className="mb-4 w-fit rounded-2xl bg-secondary/60 p-3 transition-transform duration-300 group-hover:scale-105">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </section>
      
      <section className="border-y border-border/50 bg-secondary/20 py-20 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, i) => (
              <div key={i} className="space-y-2">
                <h3 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">{stat.value}</h3>
                <p className="text-muted-foreground font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
