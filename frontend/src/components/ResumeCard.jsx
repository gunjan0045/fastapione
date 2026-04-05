import React from 'react';
import { FileText, Trash2, Calendar, FileType, CheckCircle } from 'lucide-react';

const ResumeCard = ({ resume, isSelected, onSelect, onDelete }) => {
  return (
    <div 
      onClick={() => onSelect(resume)} 
      className={`group relative p-4 rounded-2xl cursor-pointer border-2 transition-all duration-300 flex items-center justify-between ${
        isSelected 
        ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)] dark:bg-cyan-500/10 dark:border-cyan-400 dark:shadow-[0_0_15px_rgba(34,211,238,0.15)]' 
        : 'bg-white dark:bg-slate-800/80 border-slate-100 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md'
      }`}
    >
      <div className="flex items-center gap-4 overflow-hidden">
        <div className={`p-3 rounded-xl flex-shrink-0 ${isSelected ? 'bg-blue-600 dark:bg-cyan-500 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 group-hover:bg-blue-50 dark:group-hover:bg-slate-600'}`}>
          <FileText className="w-5 h-5" />
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className={`text-sm font-bold truncate pr-2 ${isSelected ? 'text-blue-700 dark:text-cyan-400' : 'text-slate-800 dark:text-white'}`}>
            {resume.name || resume.filename || 'Untitled Resume'}
          </span>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(resume.created_at || Date.now()).toLocaleDateString()}
            </span>
            {resume.parsed && (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle className="w-3 h-3" /> Parsed
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(resume.id); }} 
          className={`p-2 rounded-lg transition-colors ${isSelected ? 'text-blue-400 hover:text-red-500 hover:bg-red-500/10' : 'text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-700'} opacity-0 group-hover:opacity-100 focus:opacity-100`}
          title="Delete Resume"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default ResumeCard;
