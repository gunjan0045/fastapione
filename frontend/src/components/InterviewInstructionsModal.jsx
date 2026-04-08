import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, CheckCircle2, Video, Mic, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const InterviewInstructionsModal = ({ onAccept, isOpen }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className="bg-slate-800 border border-slate-700 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden"
        >
          <div className="p-6 md:p-8">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-700">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <ShieldAlert className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Interview Instructions</h2>
                <p className="text-slate-400 text-sm mt-1">Please read carefully before starting</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <InstructionItem 
                icon={<Video className="w-5 h-5 text-blue-400" />}
                text="Keep your camera and microphone enabled. Sit properly and keep your face visible."
              />
              <InstructionItem 
                icon={<CheckCircle2 className="w-5 h-5 text-red-400" />}
                text="Stay on the interview tab during the full interview. Do not switch browser tabs or minimize the browser."
                highlight
              />
              <InstructionItem 
                icon={<ShieldAlert className="w-5 h-5 text-red-500" />}
                text="If you leave the tab, the interview will automatically end and be marked as abandoned."
                highlight
              />
              <InstructionItem 
                icon={<Mic className="w-5 h-5 text-emerald-400" />}
                text="Answer clearly and completely. Wait for the AI to finish generating the next question before answering again."
              />
              <InstructionItem 
                icon={<CheckCircle2 className="w-5 h-5 text-purple-400" />}
                text="Coding editor will appear automatically if a coding question is asked."
              />
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-8">
              <p className="text-amber-200/80 text-sm flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                By clicking "Start Interview", your camera and microphone will activate immediately.
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-4 border-t border-slate-700">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 rounded-xl border border-slate-600 text-slate-300 font-semibold hover:bg-slate-700 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onAccept}
                className="flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-colors shadow-lg"
              >
                Start Interview <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const InstructionItem = ({ icon, text, highlight }) => (
  <div className="flex items-start gap-4">
    <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${highlight ? 'bg-red-500/10' : 'bg-slate-700/50'}`}>
      {icon}
    </div>
    <p className={`text-sm leading-relaxed pt-1 ${highlight ? 'text-slate-200 font-medium' : 'text-slate-300'}`}>
      {text}
    </p>
  </div>
);

export default InterviewInstructionsModal;
