import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: 'blue' | 'emerald' | 'rose' | 'amber' | 'violet' | 'cyan' | 'slate';
  subtext?: string;
}

export function KpiCard({ label, value, icon: Icon, color, subtext }: KpiCardProps) {
  // Mapeamento dinâmico de cores que funcionam em ambos os modos
  const colorStyles = {
    blue: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800",
    emerald: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800",
    rose: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800",
    amber: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800",
    violet: "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 border-violet-100 dark:border-violet-800",
    cyan: "text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20 border-cyan-100 dark:border-cyan-800",
    slate: "text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/20 border-slate-100 dark:border-slate-800",
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-start justify-between hover:shadow-md transition-all duration-300">
      <div className="flex-1 min-w-0">
        <p className={`text-[10px] font-black uppercase tracking-widest mb-1 opacity-80 ${colorStyles[color].split(' ')[0]}`}>
          {label}
        </p>
        <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight truncate">
          {value}
        </h3>
        {subtext && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-medium truncate">
            {subtext}
          </p>
        )}
      </div>
      
      <div className={`p-4 rounded-2xl border ${colorStyles[color]} shadow-sm`}>
        <Icon size={24} strokeWidth={2.5} />
      </div>
    </div>
  );
}