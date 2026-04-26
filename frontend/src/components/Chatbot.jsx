import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hi! I'm CoachBot. How can I help you with your mock interviews today?", isBot: true }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input.trim();
    setMessages(prev => [...prev, { text: userText, isBot: false }]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.post('/interview/chat', { message: userText });
      const botReply = response.data.reply;
      setMessages(prev => [...prev, { text: botReply, isBot: true }]);
    } catch {
      setMessages(prev => [...prev, { text: "Sorry, I'm having trouble connecting right now.", isBot: true }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-100 flex flex-col items-end">
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="mb-4 w-[calc(100vw-3rem)] sm:w-96 h-130 max-h-[calc(100vh-120px)] bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col origin-bottom-right"
          >
            {/* Header */}
            <div className="bg-linear-to-r from-blue-600 to-indigo-600 dark:from-cyan-600 dark:to-blue-700 p-4 flex justify-between items-center text-white relative overflow-hidden shrink-0">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
              <div className="flex items-center gap-3 relative z-10">
                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold tracking-tight">CoachBot</h3>
                  <p className="text-[10px] text-blue-100 uppercase tracking-widest font-semibold flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> Online
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="hover:bg-white/20 p-2 rounded-full transition text-white/90 hover:text-white relative z-10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50 dark:bg-slate-900/50 custom-scrollbar">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`max-w-[85%] p-3.5 rounded-2xl text-sm whitespace-pre-wrap shadow-sm leading-relaxed ${
                      msg.isBot 
                        ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-sm border border-slate-200 dark:border-slate-700/80 shadow-slate-200/50 dark:shadow-none' 
                        : 'bg-linear-to-br from-blue-600 to-indigo-600 dark:from-cyan-600 dark:to-blue-600 text-white rounded-tr-sm shadow-blue-500/20'
                    }`}
                  >
                    {msg.text}
                  </motion.div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl rounded-tl-sm p-4 shadow-sm flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-blue-500/50 dark:bg-cyan-500/50 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-blue-500/50 dark:bg-cyan-500/50 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-blue-500/50 dark:bg-cyan-500/50 rounded-full animate-bounce"></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-2 items-end shrink-0">
              <div className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/50 dark:focus-within:ring-cyan-500/50 transition-all">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e);
                    }
                  }}
                  placeholder="Ask a question..."
                  className="w-full px-4 py-3 bg-transparent text-slate-900 dark:text-white focus:outline-none text-sm resize-none h-12 max-h-24 custom-scrollbar"
                  rows="1"
                />
              </div>
              <button 
                type="submit" 
                disabled={loading || !input.trim()}
                className="p-3 bg-blue-600 hover:bg-blue-700 dark:bg-cyan-600 dark:hover:bg-cyan-500 disabled:bg-slate-400 dark:disabled:bg-slate-700 text-white rounded-xl transition-colors flex items-center justify-center shrink-0 disabled:cursor-not-allowed shadow-lg active:scale-95"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 -ml-0.5 mt-px" />}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="w-16 h-16 bg-linear-to-br from-blue-600 to-indigo-600 dark:from-cyan-500 dark:to-blue-600 rounded-full shadow-[0_10px_35px_-5px_rgba(37,99,235,0.6)] dark:shadow-[0_10px_35px_-5px_rgba(34,211,238,0.5)] flex items-center justify-center text-white relative group"
          >
            <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity blur-md" />
            <MessageSquare className="w-7 h-7 relative z-10" />
            
            {/* Notification Dot */}
            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Chatbot;
