import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, UserCircle, Briefcase, GraduationCap, 
  Code2, Users, Award, Languages, Trophy, 
  FolderGit2, FileText, Download, Trash2,
  Mail, Phone, MapPin, Code, Link
} from 'lucide-react';

const SectionHeader = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-3 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
    <div className="p-2 bg-blue-50 dark:bg-cyan-500/10 rounded-lg text-blue-600 dark:text-cyan-400">
      <Icon className="w-5 h-5" />
    </div>
    <h3 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">{title}</h3>
  </div>
);

const ResumeDetailsModal = ({ isOpen, onClose, resume, onDelete }) => {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!resume) return null;

  const parsed = resume.parsed_data || resume.extracted_data || {};
  
  const renderList = (items, fallback = "Not specified") => {
    if (!items || !Array.isArray(items) || items.length === 0) {
      if (typeof items === 'string' && items.trim() !== '') return <p className="text-sm text-slate-600 dark:text-slate-300">{items}</p>;
      return <p className="text-sm text-slate-400 italic">{fallback}</p>;
    }
    return (
      <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 dark:text-slate-300">
        {items.map((item, idx) => (
          <li key={idx}>
            {typeof item === 'object' ? item.name || item.title || JSON.stringify(item) : item}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-100 flex items-start justify-center p-4 sm:p-6 pb-6"
          style={{ paddingTop: '100px' }} // 100px explicit top padding to fully clear the navbar
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal Content container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl relative flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden"
            style={{ maxHeight: 'calc(100vh - 120px)' }} // Ensures it completely fits visible area below navbar
          >
            {/* STICKY HEADER */}
            <div className="flex flex-col border-b border-slate-100 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md z-10 shrink-0">
              
              {/* Top Row: Resume Name & Close */}
              <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 w-full">
                  <div className="p-2.5 bg-blue-600 dark:bg-cyan-500 text-white rounded-xl shadow-md hidden sm:block shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white truncate">
                      {resume.name || resume.filename || 'Resume Overview'}
                    </h2>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Uploaded: {new Date(resume.created_at || Date.now()).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 ml-4 text-slate-400 hover:text-slate-700 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Personal Info Grid: Candidate Details */}
              <div className="px-6 py-4 bg-white dark:bg-slate-800/40">
                <div className="flex items-center gap-2 mb-3">
                  <UserCircle className="w-5 h-5 text-blue-500 shrink-0" />
                  <h3 className="text-lg font-bold dark:text-white truncate">
                    {parsed.name || parsed.fullName || "Candidate Name Not Found"}
                  </h3>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{parsed.email || "No email"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{parsed.phone || "No phone"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <Link className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{parsed.linkedin || "No LinkedIn"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <Code className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{parsed.github || "No GitHub"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SCROLLABLE BODY */}
            <div className="overflow-y-auto flex-1 p-6 sm:p-8 space-y-8 custom-scrollbar bg-white dark:bg-slate-900">
              
              {/* Summary */}
              {parsed.summary && (
                <div className="glass-card">
                  <SectionHeader icon={FileText} title="Career Objective / Summary" />
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {parsed.summary}
                  </p>
                </div>
              )}

              {/* Grid for structured sections */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Experience */}
                <div>
                  <SectionHeader icon={Briefcase} title="Experience" />
                  <div className="space-y-4">
                    {Array.isArray(parsed.experience) && parsed.experience.length > 0 ? (
                      parsed.experience.map((exp, idx) => (
                        <div key={idx} className="border-l-2 border-blue-500/30 dark:border-cyan-500/30 pl-4 py-1">
                          <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                            {exp.title || exp.role}
                          </h4>
                          <p className="text-xs text-blue-600 dark:text-cyan-400 font-medium">{exp.company}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{exp.date || exp.duration}</p>
                          {exp.description && <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-3">{exp.description}</p>}
                        </div>
                      ))
                    ) : (
                      renderList(parsed.experience, "No experience details parsed")
                    )}
                  </div>
                </div>
                
                {/* Education */}
                <div>
                  <SectionHeader icon={GraduationCap} title="Education" />
                  <div className="space-y-4">
                    {Array.isArray(parsed.education) && parsed.education.length > 0 ? (
                      parsed.education.map((edu, idx) => (
                        <div key={idx} className="border-l-2 border-slate-200 dark:border-slate-700 pl-4 py-1">
                          <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                            {edu.degree || edu.title}
                          </h4>
                          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">{edu.institution || edu.school}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{edu.date || edu.year}</p>
                        </div>
                      ))
                    ) : (
                      renderList(parsed.education, "No education details parsed")
                    )}
                  </div>
                </div>

                {/* Skills Grid */}
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-8 bg-slate-50 dark:bg-slate-800/30 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                  <div>
                    <SectionHeader icon={Code2} title="Technical Skills" />
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(parsed.technical_skills) || Array.isArray(parsed.skills) ? (
                         (parsed.technical_skills || parsed.skills).map((skill, idx) => (
                           <span key={idx} className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-sm">
                             {typeof skill === 'object' ? skill.name : skill}
                           </span>
                         ))
                      ) : (
                        <p className="text-sm text-slate-400 italic">No technical skills parsed</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <SectionHeader icon={Users} title="Personal Skills" />
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(parsed.personal_skills) || Array.isArray(parsed.soft_skills) ? (
                         (parsed.personal_skills || parsed.soft_skills).map((skill, idx) => (
                           <span key={idx} className="px-2.5 py-1 bg-blue-50 dark:bg-cyan-900/20 text-blue-700 dark:text-cyan-300 border border-blue-100 dark:border-cyan-800/30 rounded-lg text-xs font-semibold shadow-sm">
                             {typeof skill === 'object' ? skill.name : skill}
                           </span>
                         ))
                      ) : (
                        <p className="text-sm text-slate-400 italic">No personal skills parsed</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Projects */}
                <div>
                  <SectionHeader icon={FolderGit2} title="Projects" />
                  {renderList(parsed.projects, "No projects parsed")}
                </div>

                {/* Certifications & Achievements */}
                <div className="space-y-8">
                  <div>
                    <SectionHeader icon={Award} title="Certifications" />
                    {renderList(parsed.certifications, "No certifications parsed")}
                  </div>
                  <div>
                     <SectionHeader icon={Trophy} title="Achievements" />
                     {renderList(parsed.achievements, "No achievements parsed")}
                  </div>
                </div>

                {/* Languages */}
                <div className="lg:col-span-2">
                  <SectionHeader icon={Languages} title="Languages" />
                  <div className="flex flex-wrap gap-3">
                    {Array.isArray(parsed.languages) ? (
                      parsed.languages.map((lang, idx) => (
                        <span key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-medium dark:text-slate-200">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                          {typeof lang === 'object' ? lang.name : lang}
                        </span>
                      ))
                    ) : (
                      renderList(parsed.languages, "No languages parsed")
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* STICKY FOOTER ACTIONS */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md flex justify-end gap-3 rounded-b-3xl shrink-0 z-10">
              <button 
                onClick={() => {
                  onDelete(resume.id);
                  onClose();
                }}
                className="px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Delete Resume
              </button>
              <button 
                className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-2 border border-slate-200 dark:border-slate-700"
              >
                <Download className="w-4 h-4" /> Download
              </button>
              <button 
                onClick={onClose}
                className="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-cyan-600 dark:hover:bg-cyan-500 rounded-xl shadow-lg transition-colors"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ResumeDetailsModal;
