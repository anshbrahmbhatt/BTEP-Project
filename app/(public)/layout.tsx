import { ReactNode } from "react";
import { Navbar } from "./_components/Navbar";

export default function LayoutPublic({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      <Navbar />
      <main id="main-content" className="container mx-auto mb-24 px-4 pt-2 md:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
