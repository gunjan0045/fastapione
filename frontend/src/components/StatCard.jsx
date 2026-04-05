import React from 'react';

const StatCard = ({ title, value, icon: Icon, colorClass, subtitle }) => {
  return (
    <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/30 dark:border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-center relative overflow-hidden group">
      <div className={`absolute -right-4 -top-4 w-24 h-24 bg-${colorClass}-500/10 rounded-full blur-2xl group-hover:bg-${colorClass}-500/20 transition-all`} />
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">{title}</p>
          <p className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">{value}</p>
          {subtitle && <p className="text-xs font-semibold text-cyan-500 mt-2 animate-pulse">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`p-3 rounded-2xl bg-${colorClass}-500/10 text-${colorClass}-500 shadow-sm`}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
