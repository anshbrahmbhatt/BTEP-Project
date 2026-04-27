"use client";

import Image from "next/image";

import Link from "next/link";
import Logo from "@/public/logo.png";
import { ThemeToggle } from "@/components/ui/themeToggle";
import { authClient } from "@/lib/auth-client";
import { buttonVariants } from "@/components/ui/button";
import { UserDropdown } from "./UserDropdown";

const navigationItems = [
  { name: "Home", href: "/" },
  { name: "Courses", href: "/courses" },
  { name: "Dashboard", href: "/dashboard" },
];

export function Navbar() {
  const { data: session, isPending } = authClient.useSession();
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="container mx-auto flex min-h-16 items-center px-4 md:px-6 lg:px-8">
        <Link href="/" className="mr-6 flex items-center gap-2.5">
          <Image src={Logo} alt="Logo" className="size-9 rounded-md" />
          <span className="text-base font-bold tracking-tight">AnshLMS.</span>
        </Link>

        <nav className="hidden md:flex md:flex-1 md:items-center md:justify-between">
          <div className="flex items-center gap-1 rounded-full border border-border/60 bg-muted/45 p-1">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            {isPending ? null : session ? (
              <UserDropdown
                email={session.user.email}
                image={
                  session?.user.image ??
                  `https://avatar.vercel.sh/${session?.user.email}`
                }
                name={
                  session?.user.name && session.user.name.length > 0
                    ? session.user.name
                    : session?.user.email.split("@")[0]
                }
              />
            ) : (
              <>
                <Link
                  href="/login"
                  className={buttonVariants({ variant: "secondary", className: "rounded-lg" })}
                >
                  Login
                </Link>
                <Link href="/login" className={buttonVariants({ className: "rounded-lg" })}>
                  Get Started
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
