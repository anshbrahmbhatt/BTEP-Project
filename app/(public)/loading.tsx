import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

export default function PublicLoading() {
  return (
    <div className="relative min-h-screen w-full flex-1" role="status" aria-live="polite" aria-busy="true">
      <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center">
        <div className="bg-background/80 backdrop-blur-sm p-4 text-primary rounded-full shadow-2xl flex items-center gap-3 animate-in fade-in zoom-in duration-500 border border-primary/20">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="font-semibold tracking-wide text-foreground">Loading content...</span>
        </div>
      </div>

      <div className="opacity-40 pointer-events-none overflow-hidden">
        {/* Hero Skeleton */}
        <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 flex justify-center">
           <div className="flex flex-col items-center text-center space-y-8 px-4 max-w-5xl w-full">
              <Skeleton className="h-8 w-64 rounded-full" />
              <div className="space-y-4 flex flex-col items-center w-full">
                 <Skeleton className="h-16 md:h-20 w-[80%] md:w-[600px]" />
                 <Skeleton className="h-16 md:h-20 w-[60%] md:w-[450px]" />
              </div>
              <Skeleton className="h-6 w-[90%] md:w-[700px]" />
              <Skeleton className="h-6 w-[70%] md:w-[500px]" />
              
              <div className="flex flex-col sm:flex-row gap-4 mt-8 w-full sm:w-auto justify-center">
                 <Skeleton className="h-14 w-48 rounded-full" />
                 <Skeleton className="h-14 w-32 rounded-full" />
              </div>
           </div>
        </section>

        {/* Features Skeleton */}
        <section className="container mx-auto px-4 pb-32">
           <div className="text-center mb-16 flex flex-col items-center space-y-4">
              <Skeleton className="h-12 w-[350px]" />
              <Skeleton className="h-6 w-[250px]" />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                 <div key={i} className="h-full">
                    <Skeleton className="h-64 w-full rounded-xl" />
                 </div>
              ))}
           </div>
        </section>
      </div>
    </div>
  );
}
