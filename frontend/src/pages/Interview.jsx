import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Camera, Mic, MicOff, CameraOff, Square, Play, Pause, MessageSquare, AlertCircle, Loader2, Send, Code2, CheckCircle2, Bot } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import CodingInterviewPanel from '../components/CodingInterviewPanel';
import { motion, AnimatePresence } from 'framer-motion';

const Interview = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  
  const resumeId = searchParams.get('resumeId');
  const type = searchParams.get('type') || 'Mixed';
  const initialDiff = searchParams.get('diff') || 'Medium';

  // Core State
  const [difficulty, setDifficulty] = useState(initialDiff);
  const [question, setQuestion] = useState(null);
  const [history, setHistory] = useState([]);
  const [chatLog, setChatLog] = useState([]);
  
  // UI State
  const [userAnswer, setUserAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [codingMode, setCodingMode] = useState(type === 'Coding');
  const [codeLanguage, setCodeLanguage] = useState('python');
  const [status, setStatus] = useState('Ready'); // Ready, Running, Paused, Completed

  // AV State & Controls
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const recognitionRef = useRef(null);
  const pollingInterval = useRef(null);
  const [stream, setStream] = useState(null);
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);

  // Advanced Scoring
  const [scores, setScores] = useState({
    technical: 0,
    communication: 0,
    problem_solving: 0,
    confidence: 0,
    body_language: 0
  });

  // Separate unmount cleanup to avoid killing camera on status change
  useEffect(() => {
    return () => {
      stopAV();
      if (recognitionRef.current) recognitionRef.current.stop();
      if (pollingInterval.current) clearInterval(pollingInterval.current);
    };
  }, []);

  // Protect back navigation mapping
  useEffect(() => {
    if (!resumeId) {
      navigate('/dashboard');
      return;
    }

    const unblock = () => {
       if (status === 'Running' || status === 'Paused') {
         if(!window.confirm("Are you sure you want to leave this interview?")) {
            window.history.pushState(null, "", window.location.href);
         } else {
            endInterview(true);
         }
       }
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener('popstate', unblock);

    const handleBeforeUnload = (e) => {
      if (status === 'Running' || status === 'Paused') {
        const msg = "Interview in progress! Are you sure you want to leave?";
        e.returnValue = msg;
        return msg;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('popstate', unblock);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [status, navigate, resumeId]);

  // Handle AV Init
  useEffect(() => {
    const initAV = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(s);
      } catch (e) {
        console.warn("Camera/Mic restricted", e);
      }
    };

    if(status === 'Ready') {
      initAV();
      initSpeech();
    }
  }, []); // Run ONLY once on mount

  // Auto-bind stream to video tag to prevent black screens on re-renders
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, camOn]);

  const stopAV = () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
    }
    setStream(null);
  };

  const toggleCamera = () => {
    if (stream) {
      stream.getVideoTracks().forEach(t => t.enabled = !camOn);
    }
    setCamOn(!camOn);
  };

  const toggleMic = () => {
    if (stream) {
      stream.getAudioTracks().forEach(t => t.enabled = !micOn);
    }
    setMicOn(!micOn);
  };

  const initSpeech = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = (e) => {
        let final = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
            if (e.results[i].isFinal) {
                final += e.results[i][0].transcript;
            }
        }
        if(final.trim()) setUserAnswer(prev => prev + (prev ? ' ' : '') + final.trim());
      };
      recognitionRef.current = recognition;
    }
  };

  const handleStartInterview = async (retryCount = 0) => {
    setStatus('Running');
    setLoading(true);
    try {
      const res = await api.post('/interview/start-dynamic', {
        resume_id: parseInt(resumeId),
        mode: type
      });
      setQuestion(res.data);
      addLog('ai', res.data.question);
      
      // Setup Body Language Polling Every 10s
      if(!pollingInterval.current) {
        pollingInterval.current = setInterval(pollBodyLanguage, 10000);
      }
    } catch (e) {
      if (retryCount < 1) {
         addLog('system', 'Failed to initialize AI Engine. Retrying once in 3 seconds...');
         setTimeout(() => handleStartInterview(retryCount + 1), 3000);
      } else {
         addLog('system', 'AI Engine failed repeatedly. Please check your backend properties or wait. Backend returned 500.');
         setStatus('Ready');
      }
    } finally {
      if (retryCount >= 1 || status === 'Running') {
         setLoading(false);
      }
    }
  };

  const pollBodyLanguage = async () => {
    if (!videoRef.current || !canvasRef.current || status !== 'Running') return;
    
    // Draw to canvas
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.videoWidth > 0 && video.videoHeight > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      
      try {
        const res = await api.post('/interview/evaluate-body-language', {
          frame_base64: dataUrl
        });
        if(res.data && res.data.feedback) {
           addLog('system', `[Body Language Alert] ${res.data.feedback}`);
           // Update average body score silently
           setScores(s => ({
              ...s, 
              body_language: s.body_language === 0 ? res.data.body_language_score : Math.round((s.body_language + res.data.body_language_score) / 2)
           }));
        }
      } catch (err) {
        console.warn("Body Language Polling failed", err);
      }
    }
  };

  const addLog = (speaker, text, feedback=null) => {
    setChatLog(prev => [...prev, { speaker, text, feedback }]);
  };

  const handleAnswerSubmit = async () => {
    if (!userAnswer.trim()) return;

    const currentQ = question.question;
    const currentA = userAnswer;
    
    addLog('user', currentA);
    setUserAnswer('');
    setLoading(true);

    try {
      const res = await api.post('/interview/evaluate-dynamic', {
        question: currentQ,
        answer: currentA,
        difficulty: difficulty,
        history: history
      });

      const data = res.data;
      
      setHistory(prev => [...prev, { q: currentQ, a: currentA, f: data.feedback }]);
      setDifficulty(data.next_difficulty || difficulty);
      
      // Update dynamic scores
      setScores(s => ({
         technical: data.technical_score ? Math.round((s.technical + data.technical_score)/(s.technical ? 2 : 1)) : s.technical,
         communication: data.communication_score ? Math.round((s.communication + data.communication_score)/(s.communication ? 2 : 1)) : s.communication,
         problem_solving: data.problem_solving_score ? Math.round((s.problem_solving + data.problem_solving_score)/(s.problem_solving ? 2 : 1)) : s.problem_solving,
         confidence: data.confidence_score ? Math.round((s.confidence + data.confidence_score)/(s.confidence ? 2 : 1)) : s.confidence,
         body_language: s.body_language || 80 // fallback if tracking failed
      }));

      // Append instant feedback to the AI history visually
      if(data.feedback) {
         addLog('system', `Feedback: ${data.feedback}`);
      }
      
      // Update UI with follow up
      if(data.follow_up_question) {
        setQuestion({ question: data.follow_up_question });
        addLog('ai', data.follow_up_question);
      } else {
         // Ended gracefully based on backend? (Fallback)
      }
      
    } catch (err) {
      addLog('system', 'Error processing answer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = (result) => {
    const currentQ = question.question;
    const currentA = `[Code Submission: ${result.is_correct ? 'Accepted' : 'Needs Work'}] Space: ${result.space_complexity}`;
    
    setHistory(prev => [...prev, { q: currentQ, a: currentA, f: result.feedback }]);
    addLog('system', `Code evaluated. ${result.feedback}`);
    
    if (result.follow_up_question) {
       setQuestion({ question: result.follow_up_question });
       addLog('ai', result.follow_up_question);
       setCodingMode(false); // Drop back to chat
    }
  };

  const endInterview = async (abandoned = false) => {
    setStatus('Completed');
    stopAV();
    if (pollingInterval.current) clearInterval(pollingInterval.current);
    
    if(abandoned) {
       navigate('/dashboard');
       return;
    }

    try {
       const technical_score = scores.technical || 50;
       const communication_score = scores.communication || 50;
       const problem_solving_score = scores.problem_solving || 50;
       const confidence_score = scores.confidence || 50;
       const body_language_score = scores.body_language || 50;
       
       const final_score = Math.round(
          (technical_score * 0.4) + 
          (communication_score * 0.2) + 
          (problem_solving_score * 0.2) + 
          (confidence_score * 0.1) + 
          (body_language_score * 0.1)
       );

       await api.post('/interview/history', {
         resume_id: parseInt(resumeId),
         questions: JSON.stringify(history.map(h => h.q)),
         answers: JSON.stringify(history.map(h => h.a)),
         per_question_feedback: JSON.stringify(history.map(h => h.f)),
         technical_score,
         communication_score,
         body_language_score,
         final_score,
         final_feedback: "Dynamic Interview synthesis.",
         body_language_feedback: "Body language analysis complete."
       });
    } catch(e){
       console.error("Failed to save history", e);
    }
  };

  if (status === 'Completed') {
    return (
      <div className="min-h-screen pt-24 bg-slate-900 flex flex-col justify-center items-center px-4">
        <CheckCircle2 className="w-20 h-20 text-green-500 mb-6" />
        <h1 className="text-4xl font-bold text-white mb-4">Interview Completed</h1>
        <p className="text-slate-400 mb-8 max-w-md text-center">
          The AI has synthesized your session and calculated comprehensive dynamic scores, assessing technical knowledge, communication, confidence, and body language.
        </p>
        <button onClick={() => window.location.replace('/dashboard')} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xl">
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 pt-20 flex flex-col pb-6">
      
      {/* Hidden canvas for taking snapshot */}
      <canvas ref={canvasRef} style={{display: 'none'}} />

      <div className="flex-1 max-w-[1600px] mx-auto w-full px-4 lg:px-8 flex flex-col lg:flex-row gap-8 relative items-start">
        
        {/* TWO-COLUMN LAYOUT */}
        
        {/* LEFT COLUMN: Sticky AV & Controls (Fixed 420px width) */}
        <div className="lg:w-[420px] w-full shrink-0 lg:sticky lg:top-[90px] flex flex-col gap-5">
          
          {/* Status Header */}
          <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 flex justify-between items-center shadow-lg">
             <div>
                <p className="text-xs text-slate-400 mb-1 font-semibold uppercase tracking-wider">Status</p>
                <div className="flex items-center gap-2">
                   <span className={`w-3 h-3 rounded-full ${status === 'Running' ? 'bg-red-500 animate-pulse' : status === 'Paused' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                   <span className="text-white font-bold">{status}</span>
                </div>
             </div>
             <span className="px-3 py-1 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400 text-xs font-bold self-end">
               {difficulty}
             </span>
          </div>

          <div className="bg-slate-800 rounded-3xl overflow-hidden border border-slate-700 aspect-video relative shadow-2xl">
            {stream ? (
              <video autoPlay playsInline muted ref={videoRef} className="w-full h-full object-cover transform scale-x-[-1]" />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 bg-slate-800/50">
                <CameraOff className="w-10 h-10 mb-2 opacity-40" />
                <span className="text-xs">Camera Disabled</span>
              </div>
            )}
            {!micOn && (
               <div className="absolute top-4 left-4 p-2 bg-red-500/80 rounded-full text-white backdrop-blur-md">
                 <MicOff className="w-4 h-4" />
               </div>
            )}
          </div>

          {/* Restored Controls Panel */}
          <div className="bg-slate-800 rounded-3xl p-5 border border-slate-700 shadow-xl space-y-4">
             <div className="grid grid-cols-2 gap-3">
               {status === 'Ready' && (
                 <button onClick={handleStartInterview} className="col-span-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex justify-center items-center gap-2 transition">
                   <Play className="w-4 h-4 fill-current"/> Start Interview
                 </button>
               )}
               {status === 'Running' && (
                 <button onClick={() => setStatus('Paused')} className="col-span-2 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold flex justify-center items-center gap-2 transition">
                   <Pause className="w-4 h-4 fill-current"/> Pause Interview
                 </button>
               )}
               {status === 'Paused' && (
                 <button onClick={() => setStatus('Running')} className="col-span-2 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex justify-center items-center gap-2 transition">
                   <Play className="w-4 h-4 fill-current"/> Resume Interview
                 </button>
               )}
             </div>

             <div className="grid grid-cols-2 gap-3">
               <button onClick={toggleCamera} className="py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-semibold flex flex-col justify-center items-center gap-1 transition">
                 {camOn ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4 text-red-400" />} 
                 Toggle Cam
               </button>
               <button onClick={toggleMic} className="py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-semibold flex flex-col justify-center items-center gap-1 transition">
                 {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4 text-red-400" />} 
                 Toggle Mic
               </button>
             </div>

             <div className="pt-2 border-t border-slate-700">
               <button onClick={() => endInterview(false)} disabled={status === 'Ready'} className="w-full py-3 bg-red-600/90 hover:bg-red-500 text-white rounded-xl font-bold flex justify-center items-center gap-2 disabled:opacity-40 transition">
                 <Square className="w-4 h-4 fill-current"/> Stop Session
               </button>
             </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Chat / Questions / Code (Scrollable) */}
        <div className="flex-1 w-full flex flex-col gap-6 h-[calc(100vh-140px)]">
           {codingMode ? (
              <div className="flex-1 rounded-3xl overflow-hidden border border-slate-700 shadow-xl">
                 <CodingInterviewPanel 
                   question={question?.question || "Awaiting Question..."} 
                   language={codeLanguage} 
                   setLanguage={setCodeLanguage}
                   onCodeSubmit={handleCodeSubmit}
                 />
              </div>
           ) : (
                <div className="flex-1 bg-slate-800 rounded-3xl border border-slate-700 flex flex-col overflow-hidden shadow-xl">
                  <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-800/80 sticky top-0 z-10 shadow-sm backdrop-blur">
                     <h3 className="font-bold text-white flex items-center gap-2 text-lg">
                       <Bot className="w-6 h-6 text-blue-400" /> Live Interview Log
                     </h3>
                     <button 
                       onClick={() => setCodingMode(true)}
                       className="px-3 py-1.5 rounded-lg border border-slate-600 text-slate-400 hover:text-white hover:border-slate-400 transition flex gap-2 items-center text-sm"
                     >
                       <Code2 className="w-4 h-4" /> Switch to Coding
                     </button>
                  </div>
                  
                  {/* Chat scrolling container */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar scroll-smooth">
                    {status === 'Ready' && (
                       <div className="flex-1 flex flex-col items-center justify-center text-slate-500 h-full">
                          <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
                          <p>Click 'Start Interview' to initialize the AI model</p>
                       </div>
                    )}
                    
                    <AnimatePresence>
                      {chatLog.map((log, idx) => (
                        <motion.div key={idx} initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className={`flex ${log.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] rounded-[1.5rem] p-4 text-sm leading-relaxed shadow-md
                             ${log.speaker === 'ai' ? 'bg-blue-900/40 border border-blue-500/40 text-blue-50' 
                             : log.speaker === 'system' ? 'bg-slate-800 border border-slate-700 text-amber-200' 
                             : 'bg-indigo-600 text-white rounded-br-sm'}`}>
                            
                            {/* Render System Badges conditionally */}
                            {log.speaker === 'system' && log.text.includes('[Body Language') && <AlertCircle className="w-4 h-4 inline mr-2 text-amber-400" />}
                            
                            {log.text}
                          </div>
                        </motion.div>
                      ))}
                      
                      {loading && (
                         <motion.div initial={{opacity:0}} animate={{opacity:1}} className="flex justify-start">
                           <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 text-slate-400 text-sm flex gap-3 items-center">
                             <Loader2 className="w-5 h-5 animate-spin text-blue-400" /> Analysing semantics and preparing next topic... (May take up to 40s on high AI load)
                           </div>
                         </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  {/* Input Sticky Footer */}
                  {status === 'Running' && (
                    <div className="p-4 bg-slate-800/80 border-t border-slate-700 backdrop-blur shrink-0">
                      <div className="relative">
                        <textarea 
                          value={userAnswer}
                          onChange={(e) => setUserAnswer(e.target.value)}
                          placeholder="Type or dictate your answer..."
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-5 py-3 pr-14 text-sm text-white resize-none outline-none focus:border-blue-500 transition shadow-inner h-[80px]"
                        />
                        <button
                          onClick={handleAnswerSubmit}
                          disabled={loading || !userAnswer.trim()}
                          className="absolute right-3 bottom-3 p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 transition shadow-md"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex justify-between items-center mt-2 px-1">
                        <button 
                          onClick={() => {
                            const rec = recognitionRef.current;
                            if(rec) { rec.start(); addLog('system', 'Microphone recording enabled...'); }
                          }}
                          className="text-xs text-slate-400 hover:text-white flex gap-1.5 items-center bg-slate-700/50 px-3 py-1.5 rounded-lg"
                        >
                          <Mic className="w-3.5 h-3.5 text-blue-400" /> Dictate Answer
                        </button>
                      </div>
                    </div>
                  )}
                </div>
           )}
        </div>

      </div>
    </div>
  );
};

export default Interview;