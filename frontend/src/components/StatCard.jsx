import React from 'react';

const StatCard = ({ title, value, icon: Icon, colorClass, subtitle }) => {
  const colorMap = {
    emerald: {
      tint: 'bg-emerald-500/12',
      text: 'text-emerald-400',
      bubble: 'bg-emerald-500/10'
    },
    blue: {
      tint: 'bg-blue-500/12',
      text: 'text-cyan-300',
      bubble: 'bg-blue-500/10'
    },
    violet: {
      tint: 'bg-violet-500/12',
      text: 'text-violet-300',
      bubble: 'bg-violet-500/10'
    }
  };
  const style = colorMap[colorClass] || colorMap.blue;

  return (
    <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/30 dark:border-indigo-200/10 rounded-3xl p-6 shadow-xl flex flex-col justify-center relative overflow-hidden group">
      <div className={`absolute -right-4 -top-4 w-24 h-24 ${style.bubble} rounded-full blur-2xl group-hover:scale-110 transition-all`} />
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">{title}</p>
          <p className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">{value}</p>
          {subtitle && <p className={`text-xs font-semibold ${style.text} mt-2 animate-pulse`}>{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`p-3 rounded-2xl ${style.tint} ${style.text} shadow-sm`}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
