import React from 'react';
import { AlertTriangle, Users, Target, Activity } from 'lucide-react';

// Mock data structure
interface AttemptData {
  id: string;
  studentName: string;
  integrityScore: number;
  confidence: 'HIGH' | 'MODERATE' | 'LOW';
  flags: string[];
  duration: string;
}

export function AIEEInstructorDashboard() {
  // Mock Data for demonstration
  const recentAttempts: AttemptData[] = [
    {
      id: '1',
      studentName: 'Alice Johnson',
      integrityScore: 95,
      confidence: 'HIGH',
      flags: [],
      duration: '45 mins'
    },
    {
      id: '2',
      studentName: 'Bob Smith',
      integrityScore: 72,
      confidence: 'MODERATE',
      flags: ['2 tab switches detected'],
      duration: '42 mins'
    },
    {
      id: '3',
      studentName: 'Charlie Davis',
      integrityScore: 40,
      confidence: 'LOW',
      flags: ['Lost focus 5 times', 'Abnormal answering speed'],
      duration: '18 mins'
    }
  ];

  const averageScore = 69;
  const flaggedCount = 1;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto w-full">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">AIEE Dashboard</h2>
        <p className="text-slate-500">Assessment Integrity & Engagement Engine</p>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg dark:bg-blue-900/30 dark:text-blue-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Total Submissions</p>
            <p className="text-2xl font-bold">124</p>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg dark:bg-green-900/30 dark:text-green-400">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Avg Integrity Score</p>
            <p className="text-2xl font-bold">{averageScore}/100</p>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-lg dark:bg-red-900/30 dark:text-red-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Flagged Attempts</p>
            <p className="text-2xl font-bold">{flaggedCount}</p>
          </div>
        </div>
      </div>

      {/* Roster Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h3 className="font-semibold text-lg text-slate-800 dark:text-white">Recent Attempts</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="p-4 text-sm font-medium text-slate-500">Student</th>
                <th className="p-4 text-sm font-medium text-slate-500">Score</th>
                <th className="p-4 text-sm font-medium text-slate-500">Confidence</th>
                <th className="p-4 text-sm font-medium text-slate-500">Flags</th>
                <th className="p-4 text-sm font-medium text-slate-500">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {recentAttempts.map((attempt) => (
                <tr key={attempt.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-4 font-medium text-slate-900 dark:text-white">{attempt.studentName}</td>
                  <td className="p-4">
                    <span className={`font-bold ${
                      attempt.confidence === 'HIGH' ? 'text-green-500' :
                      attempt.confidence === 'MODERATE' ? 'text-yellow-500' : 'text-red-500'
                    }`}>
                      {attempt.integrityScore}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      attempt.confidence === 'HIGH' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      attempt.confidence === 'MODERATE' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {attempt.confidence}
                    </span>
                  </td>
                  <td className="p-4">
                    {attempt.flags.length === 0 ? (
                      <span className="text-slate-400 text-sm">None</span>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {attempt.flags.map((f, i) => (
                          <span key={i} className="text-xs flex items-center gap-1 text-slate-600 dark:text-slate-400">
                            <Activity className="w-3 h-3 text-red-400" />
                            {f}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-sm text-slate-500">{attempt.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}
