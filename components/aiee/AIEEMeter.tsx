import React from 'react';
import { Shield, ShieldAlert, ShieldCheck, AlertCircle } from 'lucide-react';

interface AIEEMeterProps {
  integrityScore: number;
  confidenceLevel: 'HIGH' | 'MODERATE' | 'LOW';
  flags: string[];
  message: string;
}

export function AIEEMeter({ integrityScore, confidenceLevel, flags, message }: AIEEMeterProps) {
  // Determine colors based on score (0-39 Red, 40-69 Yellow, 70-100 Green)
  let colorClass = 'text-green-500';
  let bgClass = 'bg-green-500/10';
  let borderClass = 'border-green-500/20';
  let fillClass = 'bg-green-500';
  let Icon = ShieldCheck;

  if (integrityScore < 40) {
    colorClass = 'text-red-500';
    bgClass = 'bg-red-500/10';
    borderClass = 'border-red-500/20';
    fillClass = 'bg-red-500';
    Icon = Shield;
  } else if (integrityScore < 70) {
    colorClass = 'text-yellow-500';
    bgClass = 'bg-yellow-500/10';
    borderClass = 'border-yellow-500/20';
    fillClass = 'bg-yellow-500';
    Icon = ShieldAlert;
  }

  return (
    <div className={`p-6 rounded-xl border ${borderClass} ${bgClass} flex flex-col gap-4 max-w-md w-full`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon className={`w-8 h-8 ${colorClass}`} />
          <div>
            <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-100">Assessment Integrity</h3>
            <p className={`text-sm font-medium ${colorClass}`}>
              {confidenceLevel} CONFIDENCE
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-3xl font-bold ${colorClass}`}>{integrityScore}</span>
          <span className="text-slate-500 text-sm">/100</span>
        </div>
      </div>

      <div className="flex flex-col gap-1 mt-1">
        <div className="flex justify-between text-[10px] font-bold text-slate-400 px-1">
          <span>0</span>
          <span>40</span>
          <span>70</span>
          <span>100</span>
        </div>
        <div className="relative h-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          {/* 3-shade background zones (optional, or just use solid fill) */}
          <div className="absolute top-0 left-0 h-full w-full flex opacity-20">
            <div className="h-full w-[40%] bg-red-500 border-r border-white/50"></div>
            <div className="h-full w-[30%] bg-yellow-500 border-r border-white/50"></div>
            <div className="h-full w-[30%] bg-green-500"></div>
          </div>
          {/* Actual score fill */}
          <div 
            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out shadow-inner ${fillClass}`}
            style={{ width: `${integrityScore}%` }}
          />
        </div>
      </div>

      <div className="h-px w-full bg-slate-200 dark:bg-slate-700 my-2" />

      {/* Flags / Explanations */}
      {flags.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Detected Signals:</p>
          <ul className="space-y-1">
            {flags.map((flag, idx) => (
              <li key={idx} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
                <span>{flag}</span>
              </li>
            ))}
          </ul>
        </div>
      )}


    </div>
  );
}
