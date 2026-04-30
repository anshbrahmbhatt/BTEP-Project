import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
import { AIEEMeter } from "@/components/aiee/AIEEMeter";
import { ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ConfidencePage() {
  const user = await requireUser();
  
  const dbUser = await prisma.user.findUnique({ 
    where: { id: user.id }, 
    select: { integrityScore: true, integrityFlags: true } 
  });
  
  const score = dbUser?.integrityScore || 100;
  
  const confidenceLevel = 
    score >= 70 ? "HIGH" :
    score >= 40 ? "MODERATE" : "LOW";

  return (
    <div className="p-6 max-w-5xl mx-auto flex flex-col items-center">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <ShieldCheck className="w-10 h-10 text-green-500" />
          Assessment Integrity
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-lg mx-auto">
          Your overall integrity score reflects your testing behavior. It increases by 10 points for every daily login, and goes down if suspicious activity is detected during quizzes.
        </p>
      </div>

      <div className="w-full max-w-3xl flex justify-center">
        <AIEEMeter 
          integrityScore={score}
          confidenceLevel={confidenceLevel}
          flags={dbUser?.integrityFlags || []}
          message=""
        />
      </div>
    </div>
  );
}
