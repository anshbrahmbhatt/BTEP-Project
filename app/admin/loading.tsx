import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

export default function AdminLoading() {
  return (
    <div className="relative min-h-screen w-full flex-1" role="status" aria-live="polite" aria-busy="true">
      <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center">
        <div className="bg-background/80 backdrop-blur-sm p-4 text-primary rounded-full shadow-2xl flex items-center gap-3 animate-in fade-in zoom-in duration-500 border border-primary/20">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="font-semibold tracking-wide text-foreground">Loading Admin Portal...</span>
        </div>
      </div>

      {/* Background Admin Skeleton Structure */}
      <div className="opacity-40 pointer-events-none">
        {/* Admin Header Skeleton */}
        <div className="w-full h-72 bg-gradient-to-r from-muted/50 to-transparent border-b border-border/50 relative overflow-hidden flex items-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-4">
              <Skeleton className="h-6 w-32 rounded-full" />
              <Skeleton className="h-12 w-[350px] md:w-[500px]" />
              <Skeleton className="h-6 w-[280px] md:w-[400px]" />
            </div>
            
            <div className="hidden md:flex bg-muted/20 backdrop-blur-md rounded-2xl p-4 gap-8">
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
        </div>

        {/* Admin Content Skeleton */}
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
          
          <div className="mb-10 mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
             {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-2xl" />
             ))}
          </div>

          <div className="mb-16 bg-card rounded-3xl p-1.5 border border-border/50">
            <div className="p-4 sm:p-6 bg-card rounded-[1.35rem]">
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <Skeleton className="h-6 w-32" />
                     <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-80 w-full" />
               </div>
            </div>
          </div>

          <div className="space-y-8 pt-12 border-t border-border/50">
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
               <Skeleton className="h-10 w-[200px]" />
               <Skeleton className="h-12 w-[160px] rounded-full" />
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 xl:gap-10">
               {Array.from({ length: 3 }).map((_, i) => (
                 <div key={i} className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
                   <Skeleton className="h-48 w-full" />
                   <div className="p-4 space-y-4">
                     <Skeleton className="h-5 w-[85%]" />
                     <Skeleton className="h-4 w-[60%]" />
                     <div className="pt-4 flex items-center justify-between border-t border-border/50">
                       <Skeleton className="h-6 w-16" />
                       <Skeleton className="h-8 w-24 rounded-full" />
                     </div>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
