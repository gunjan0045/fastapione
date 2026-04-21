import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Camera, Mic, MicOff, CameraOff, Square, Play, Pause, MessageSquare, AlertCircle, Loader2, Send, Code2, CheckCircle2, Bot, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import CodingInterviewPanel from '../components/CodingInterviewPanel';
import InterviewInstructionsModal from '../components/InterviewInstructionsModal';
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
  const [loadingRetries, setLoadingRetries] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [codingMode, setCodingMode] = useState(type === 'Coding');
  const [codeLanguage, setCodeLanguage] = useState('python');
  const [status, setStatus] = useState('Instructions'); // Instructions, Ready, Running, Paused, Completed
  const [errorToast, setErrorToast] = useState(null);
  const [isDictating, setIsDictating] = useState(false);

  // AV State & Controls
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const recognitionRef = useRef(null);
  const pollingInterval = useRef(null);
  const abortTimerRef = useRef(null);
  const inactiveTimerRef = useRef(null);
  const typingTimerRef = useRef(null);
  const chatLogIdRef = useRef(0);
  const hasShownInactiveWarningRef = useRef(false);
  const preferredVoiceRef = useRef(null);
  const ttsWarnedRef = useRef(false);
  const shouldKeepDictatingRef = useRef(false);
  const dictationBaseRef = useRef('');
  const dictationCommittedRef = useRef('');
  const userAnswerRef = useRef('');
  const statusRef = useRef('Instructions');
  const micOnRef = useRef(true);
  const loadingRef = useRef(false);
  const isSubmittingRef = useRef(false);
  const lastBodyFeedbackLogAtRef = useRef(0);
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
    userAnswerRef.current = userAnswer;
  }, [userAnswer]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    micOnRef.current = micOn;
  }, [micOn]);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    isSubmittingRef.current = isSubmitting;
  }, [isSubmitting]);

  useEffect(() => {
    return () => {
      stopAV();
      shouldKeepDictatingRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {
          // Ignore stop errors when recognizer is already inactive.
        }
      }
      if (pollingInterval.current) clearInterval(pollingInterval.current);
      if (abortTimerRef.current) clearTimeout(abortTimerRef.current);
      if (inactiveTimerRef.current) clearTimeout(inactiveTimerRef.current);
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Protect back navigation mapping
  useEffect(() => {
    if (!resumeId) {
      navigate('/dashboard', { replace: true });
      return;
    }

    const unblock = () => {
       if (status === 'Running' || status === 'Paused') {
         if(!window.confirm("Leaving now will end your interview. Are you sure?")) {
            window.history.pushState(null, "", window.location.href);
         } else {
            endInterview(true);
         }
       } else if (status === 'Instructions' || status === 'Ready') {
            navigate('/dashboard', { replace: true });
       }
    };

    window.history.replaceState(null, "", window.location.href);
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

  // Tab switch protection with a generous inactivity window.
  // This avoids accidental auto-end when browser permission dialogs briefly blur the tab.
  useEffect(() => {
    const clearInactiveTimer = () => {
      if (inactiveTimerRef.current) {
        clearTimeout(inactiveTimerRef.current);
        inactiveTimerRef.current = null;
      }
    };

    const handleVisibilityChange = () => {
      const interviewActive = status === 'Running' || status === 'Paused';

      if (!interviewActive) {
        clearInactiveTimer();
        hasShownInactiveWarningRef.current = false;
        return;
      }

      if (document.hidden) {
        if (!hasShownInactiveWarningRef.current) {
          addLog('system', 'You switched tabs. Return within 45 seconds to continue interview.');
          hasShownInactiveWarningRef.current = true;
        }
        clearInactiveTimer();
        inactiveTimerRef.current = setTimeout(() => {
          setErrorToast('Interview ended because the tab remained inactive for too long.');
          endInterview(true);
        }, 45000);
      } else {
        clearInactiveTimer();
        hasShownInactiveWarningRef.current = false;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInactiveTimer();
    };
  }, [status]);

  // Handle AV Init
  useEffect(() => {
    const initAV = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorToast('Camera API is not available in this browser. Use latest Chrome or Edge.');
        addLog('system', 'Camera API is unavailable in this browser environment.');
        return;
      }

      try {
        // Try full AV first.
        const fullStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: true,
        });

        setStream(fullStream);
        setCamOn(fullStream.getVideoTracks().some(track => track.enabled));
        setMicOn(fullStream.getAudioTracks().some(track => track.enabled));
      } catch (e) {
        console.warn('Camera+Mic init failed. Retrying with video only.', e);

        try {
          // If microphone permission fails, still allow camera-based interview.
          const videoOnlyStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
            audio: false,
          });

          setStream(videoOnlyStream);
          setCamOn(videoOnlyStream.getVideoTracks().some(track => track.enabled));
          setMicOn(false);
          addLog('system', 'Microphone access denied/unavailable. Camera-only mode enabled.');
        } catch (videoErr) {
          console.warn('Camera initialization failed.', videoErr);
          setStream(null);
          setCamOn(false);
          setMicOn(false);
          setErrorToast('Camera permission blocked. Allow camera access in browser settings and retry.');
          addLog('system', 'Camera permission is blocked. Enable camera access and refresh this page.');
        }
      }
    };

    if(status === 'Ready') {
      initAV();
      initSpeech();
    }
  }, [status]); // Run when status changes to Ready

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
    if (videoRef.current) {
      videoRef.current.srcObject = null;
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
    const turningMicOff = micOn;
    if (stream) {
      stream.getAudioTracks().forEach(t => t.enabled = !micOn);
    }
    if (turningMicOff) {
      shouldKeepDictatingRef.current = false;
      setIsDictating(false);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {
          // Ignore stop errors.
        }
      }
    }
    setMicOn(!micOn);
  };

  const initSpeech = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-IN';
      recognition.maxAlternatives = 1;

      recognition.onresult = (e) => {
        let finalized = '';
        let interim = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const transcript = String(e.results[i]?.[0]?.transcript || '').trim();
          if (!transcript) continue;

          if (e.results[i].isFinal) {
            finalized += `${transcript} `;
          } else {
            interim += `${transcript} `;
          }
        }

        if (finalized.trim()) {
          dictationCommittedRef.current = `${dictationCommittedRef.current} ${finalized}`.replace(/\s+/g, ' ').trim();
        }

        const nextAnswer = [
          dictationBaseRef.current,
          dictationCommittedRef.current,
          interim.trim(),
        ].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();

        setUserAnswer(nextAnswer);
      };

      recognition.onstart = () => {
        setIsDictating(true);
      };

      recognition.onerror = (event) => {
        const code = event?.error;

        if (code === 'not-allowed' || code === 'service-not-allowed') {
          shouldKeepDictatingRef.current = false;
          setIsDictating(false);
          addLog('system', 'Microphone permission blocked. Allow mic access and try again.');
          return;
        }

        if (code === 'aborted') {
          return;
        }

        if (code === 'audio-capture') {
          addLog('system', 'No microphone device detected. Check your input device.');
        }
      };

      recognition.onend = () => {
        setIsDictating(false);

        const shouldRestart =
          shouldKeepDictatingRef.current &&
          statusRef.current === 'Running' &&
          micOnRef.current &&
          !loadingRef.current &&
          !isSubmittingRef.current;

        if (shouldRestart) {
          window.setTimeout(() => {
            try {
              recognition.start();
            } catch (_) {
              // Ignore invalid state errors when the recognizer is restarting.
            }
          }, 180);
        }
      };

      recognitionRef.current = recognition;
    }

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const assignPreferredVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        if (!voices || voices.length === 0) return;

        preferredVoiceRef.current =
          voices.find(v => /en(-|_)?in/i.test(v.lang) && /female|woman|girl|zira|google/i.test(v.name)) ||
          voices.find(v => /en(-|_)?in/i.test(v.lang)) ||
          voices.find(v => /hi(-|_)?in/i.test(v.lang) && /female|woman|girl|google/i.test(v.name)) ||
          voices.find(v => /hi(-|_)?in/i.test(v.lang)) ||
          voices.find(v => /female|woman|girl|zira|aria|google/i.test(v.name)) ||
          voices.find(v => /in/i.test(v.lang)) ||
          voices[0];
      };

      assignPreferredVoice();
      window.speechSynthesis.onvoiceschanged = assignPreferredVoice;
    }
  };

  function addLog(speaker, text, feedback = null) {
    const id = ++chatLogIdRef.current;
    setChatLog(prev => [...prev, { id, speaker, text, feedback, displayedText: text, isTyping: false }]);
  }

  function clearAiPresentation() {
    if (typingTimerRef.current) {
      clearInterval(typingTimerRef.current);
      typingTimerRef.current = null;
    }
  }

  function speakAiQuestion(text) {
    const content = String(text || '').trim();
    if (!content) return;

    if (typeof window === 'undefined' || !window.speechSynthesis || !window.SpeechSynthesisUtterance) {
      if (!ttsWarnedRef.current) {
        addLog('system', 'Voice output is not supported in this browser.');
        ttsWarnedRef.current = true;
      }
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new window.SpeechSynthesisUtterance(content.replace(/\s+/g, ' ').trim());
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.volume = 1;
      utterance.lang = 'en-US';

      if (preferredVoiceRef.current) {
        utterance.voice = preferredVoiceRef.current;
        utterance.lang = preferredVoiceRef.current.lang || utterance.lang;
      }

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('TTS failed', err);
    }
  }

  function animateAiMessage(text) {
    const content = String(text || '').trim();
    if (!content) return;

    clearAiPresentation();
    const normalizedText = content.replace(/\s+/g, ' ').trim();
    const messageId = ++chatLogIdRef.current;

    setChatLog(prev => [...prev, { id: messageId, speaker: 'ai', text: normalizedText, feedback: null, displayedText: '', isTyping: true }]);

    let index = 0;
    const typingSpeed = Math.max(24, Math.min(55, Math.round(1800 / Math.max(normalizedText.length, 1))));

    typingTimerRef.current = setInterval(() => {
      index += 1;
      setChatLog(prev => prev.map((log) => {
        if (log.id !== messageId) {
          return log;
        }

        const nextText = normalizedText.slice(0, index);
        return {
          ...log,
          displayedText: nextText,
          isTyping: index < normalizedText.length,
        };
      }));

      if (index >= normalizedText.length) {
        if (typingTimerRef.current) {
          clearInterval(typingTimerRef.current);
          typingTimerRef.current = null;
        }
      }
    }, typingSpeed);

    speakAiQuestion(normalizedText);
  }

  function startWithFallbackQuestion(reason = 'AI service temporarily unavailable.') {
    const fallbackQuestion = {
      question: 'Let us begin. Tell me about yourself and one project where you solved a difficult technical problem.',
      concept_tested: 'Communication & Problem Solving',
    };

    setQuestion(fallbackQuestion);
    addLog('system', `${reason} Continuing with fallback interview mode.`);
    animateAiMessage(fallbackQuestion.question);

    if (!pollingInterval.current) {
      pollingInterval.current = setInterval(pollBodyLanguage, 10000);
    }
  }

  const handleStartInterview = async () => {
    setStatus('Running');
    setLoading(true);
    setLoadingRetries(0);

    const parsedResumeId = Number.parseInt(resumeId, 10);
    if (!Number.isFinite(parsedResumeId) || parsedResumeId <= 0) {
      startWithFallbackQuestion('Resume context missing in URL.');
      setLoading(false);
      setLoadingRetries(0);
      return;
    }

    let completed = false;

    try {
      for (let attempt = 0; attempt <= 1; attempt += 1) {
        setLoadingRetries(attempt);
        let timeoutFinished = false;

        try {
          const resPromise = api.post('/interview/start-dynamic', {
            resume_id: parsedResumeId,
            mode: type
          });
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => {
              timeoutFinished = true;
              reject(new Error('TIMEOUT'));
            }, 35000)
          );

          const res = await Promise.race([resPromise, timeoutPromise]);
          const firstQuestion = String(res?.data?.question || '').trim();
          if (!firstQuestion) {
            throw new Error('INVALID_START_QUESTION');
          }

          setQuestion(res.data);
          animateAiMessage(firstQuestion);

          if (!pollingInterval.current) {
            pollingInterval.current = setInterval(pollBodyLanguage, 10000);
          }

          completed = true;
          break;
        } catch (e) {
          const isTimeout = timeoutFinished || e?.message === 'TIMEOUT';
          if (isTimeout && attempt < 1) {
            addLog('system', 'Unable to generate next question. Retrying...');
            continue;
          }

          if (isTimeout) {
            startWithFallbackQuestion('AI response timeout.');
          } else {
            const apiDetail = e?.response?.data?.detail;
            const errMsg =
              typeof apiDetail === 'string'
                ? apiDetail
                : e?.message || 'System error initializing AI engine.';

            if (e?.message === 'INVALID_START_QUESTION') {
              startWithFallbackQuestion('AI returned an empty question.');
            } else {
              startWithFallbackQuestion(errMsg);
            }
          }

          completed = true;
          break;
        }
      }

      if (!completed) {
        startWithFallbackQuestion('Unable to initialize interview.');
      }
    } finally {
      setLoading(false);
      setLoadingRetries(0);
    }
  };

  const pollBodyLanguage = async () => {
    if (!videoRef.current || !canvasRef.current || status !== 'Running') return;
    
    // Draw to canvas
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.videoWidth > 0 && video.videoHeight > 0) {
      const maxWidth = 640;
      const scale = Math.min(1, maxWidth / video.videoWidth);
      canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
      canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
      
      try {
        const res = await api.post('/interview/evaluate-body-language', {
          frame_base64: dataUrl
        });
        if(res.data && res.data.feedback) {
           const now = Date.now();
           if (now - lastBodyFeedbackLogAtRef.current > 30000) {
             addLog('system', `[Body Language Alert] ${res.data.feedback}`);
             lastBodyFeedbackLogAtRef.current = now;
           }
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

  const handleAnswerSubmit = async () => {
    const currentA = String(userAnswerRef.current || '').trim();
    if (!currentA || isSubmittingRef.current) return;

    shouldKeepDictatingRef.current = false;
    setIsDictating(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {
        // Ignore stop errors.
      }
    }

    addLog('user', currentA);
    setUserAnswer('');
    
    setIsSubmitting(true);
    setLoading(true);
    setLoadingRetries(0);

    try {
      let handled = false;

      for (let attempt = 0; attempt <= 1; attempt += 1) {
        setLoadingRetries(attempt);
        let timeoutFinished = false;

        try {
          const resPromise = api.post('/interview/evaluate-dynamic', {
            question: question.question,
            answer: currentA,
            difficulty: difficulty,
            history: history
          });

          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => {
              timeoutFinished = true;
              reject(new Error('TIMEOUT'));
            }, 35000)
          );

          const res = await Promise.race([resPromise, timeoutPromise]);
          const data = res.data;

          setHistory(prev => [...prev, { q: question.question, a: currentA, f: data.feedback }]);
          setDifficulty(data.next_difficulty || difficulty);

          setScores(s => ({
            technical: data.technical_score ? Math.round((s.technical + data.technical_score) / (s.technical ? 2 : 1)) : s.technical,
            communication: data.communication_score ? Math.round((s.communication + data.communication_score) / (s.communication ? 2 : 1)) : s.communication,
            problem_solving: data.problem_solving_score ? Math.round((s.problem_solving + data.problem_solving_score) / (s.problem_solving ? 2 : 1)) : s.problem_solving,
            confidence: data.confidence_score ? Math.round((s.confidence + data.confidence_score) / (s.confidence ? 2 : 1)) : s.confidence,
            body_language: s.body_language || 80
          }));

          if (data.feedback) {
            addLog('system', `Feedback: ${data.feedback}`);
          }

          if (data.follow_up_question) {
            setQuestion({ question: data.follow_up_question });
            animateAiMessage(data.follow_up_question);
          }

          handled = true;
          break;
        } catch (err) {
          const isTimeout = timeoutFinished || err?.message === 'TIMEOUT';
          if (isTimeout && attempt < 1) {
            addLog('system', 'Unable to generate next question. Retrying...');
            continue;
          }

          if (isTimeout) {
            setErrorToast('Interview ended because the AI service did not respond.');
            endInterview(true);
          } else {
            addLog('system', 'Error processing answer. Please try again.');
          }

          handled = true;
          break;
        }
      }

      if (!handled) {
        addLog('system', 'Unable to process answer right now. Please try again.');
      }
    } finally {
      setLoading(false);
      setIsSubmitting(false);
      setLoadingRetries(0);
    }
  };

  const handleCodeSubmit = (result) => {
    const currentQ = question.question;
    const currentA = `[Code Submission: ${result.is_correct ? 'Accepted' : 'Needs Work'}] Space: ${result.space_complexity}`;
    
    setHistory(prev => [...prev, { q: currentQ, a: currentA, f: result.feedback }]);
    addLog('system', `Code evaluated. ${result.feedback}`);
    
    if (result.follow_up_question) {
       setQuestion({ question: result.follow_up_question });
       animateAiMessage(result.follow_up_question);
       setCodingMode(false); // Drop back to chat
    }
  };

  const persistHistory = async (isAbandoned = false) => {
    if (!resumeId || history.length === 0) return null;

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

    const response = await api.post('/interview/history', {
      resume_id: parseInt(resumeId),
      questions: JSON.stringify(history.map(h => h.q)),
      answers: JSON.stringify(history.map(h => h.a)),
      per_question_feedback: JSON.stringify(history.map(h => h.f)),
      technical_score,
      communication_score,
      problem_solving_score,
      body_language_score,
      final_score,
      final_feedback: isAbandoned ? 'Interview ended early due inactivity. Partial report saved.' : 'Dynamic Interview synthesis.',
      body_language_feedback: 'Body language analysis complete.'
    });

    return response?.data?.id || null;
  };

  const endInterview = async (abandoned = false) => {
    setStatus('Completed');
    shouldKeepDictatingRef.current = false;
    setIsDictating(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {
        // Ignore stop errors.
      }
    }
    stopAV();
    if (pollingInterval.current) clearInterval(pollingInterval.current);
    if (abortTimerRef.current) clearTimeout(abortTimerRef.current);
    if (inactiveTimerRef.current) clearTimeout(inactiveTimerRef.current);
    clearAiPresentation();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    try {
       await persistHistory(abandoned);
    } catch(e){
       console.error("Failed to save history", e);
       if (abandoned) {
         setErrorToast('Interview ended and could not be saved. Please retry.');
       }
    }

    if(abandoned) {
       navigate('/dashboard', { replace: true });
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#121c4b_0%,#060b20_45%,#040614_100%)] pt-20 flex flex-col pb-6">
      <InterviewInstructionsModal 
         isOpen={status === 'Instructions'} 
         onAccept={() => setStatus('Ready')} 
      />
      {errorToast && (
         <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-red-400/50">
            <AlertCircle className="w-5 h-5" />
            <span className="font-bold">{errorToast}</span>
            <button onClick={() => setErrorToast(null)} className="ml-4 hover:opacity-75"><X className="w-4 h-4" /></button>
         </div>
      )}
      
      {/* Hidden canvas for taking snapshot */}
      <canvas ref={canvasRef} style={{display: 'none'}} />

      <div className="flex-1 max-w-400 mx-auto w-full px-4 lg:px-8 flex flex-col lg:flex-row gap-8 relative items-start">
        
        {/* TWO-COLUMN LAYOUT */}
        
        {/* LEFT COLUMN: Sticky AV & Controls (Fixed 420px width) */}
        <div className="lg:w-105 w-full shrink-0 lg:sticky lg:top-22.5 flex flex-col gap-5">
          
          {/* Status Header */}
          <div className="bg-slate-900/70 backdrop-blur-xl rounded-2xl p-4 border border-indigo-200/10 flex justify-between items-center shadow-lg">
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

          <div className="bg-slate-900/70 backdrop-blur-xl rounded-3xl overflow-hidden border border-indigo-200/10 aspect-video relative shadow-2xl">
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
          <div className="bg-slate-900/70 backdrop-blur-xl rounded-3xl p-5 border border-indigo-200/10 shadow-xl space-y-4">
             <div className="grid grid-cols-2 gap-3">
               {status === 'Ready' && (
                 <button onClick={handleStartInterview} className="col-span-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex justify-center items-center gap-2 transition">
                   <Play className="w-4 h-4 fill-current"/> Start Interview
                 </button>
               )}
               {status === 'Running' && (
                 <button onClick={() => {
                   shouldKeepDictatingRef.current = false;
                   setIsDictating(false);
                   if (recognitionRef.current) {
                     try {
                       recognitionRef.current.stop();
                     } catch (_) {
                       // Ignore stop errors.
                     }
                   }
                   setStatus('Paused');
                 }} className="col-span-2 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold flex justify-center items-center gap-2 transition">
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
                <div className="flex-1 bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-indigo-200/10 flex flex-col overflow-hidden shadow-xl">
                  <div className="p-5 border-b border-indigo-200/10 flex justify-between items-center bg-slate-900/80 sticky top-0 z-10 shadow-sm backdrop-blur">
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
                      {chatLog.map((log) => (
                        <motion.div key={log.id} initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className={`flex ${log.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] rounded-3xl p-4 text-sm leading-relaxed shadow-md
                             ${log.speaker === 'ai' ? 'bg-blue-900/40 border border-blue-500/40 text-blue-50' 
                             : log.speaker === 'system' ? 'bg-slate-800 border border-slate-700 text-amber-200' 
                             : 'bg-indigo-600 text-white rounded-br-sm'}`}>
                            
                            {/* Render System Badges conditionally */}
                            {log.speaker === 'system' && log.text.includes('[Body Language') && <AlertCircle className="w-4 h-4 inline mr-2 text-amber-400" />}
                            
                            {log.speaker === 'ai' ? (log.displayedText || '') : log.text}
                            {log.speaker === 'ai' && log.isTyping && <span className="ml-1 inline-block h-4 w-2 animate-pulse rounded-full bg-blue-300 align-middle" />}
                          </div>
                        </motion.div>
                      ))}
                      
                      {loading && (
                         <motion.div initial={{opacity:0}} animate={{opacity:1}} className="flex justify-start">
                           <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 text-slate-400 text-sm flex gap-3 items-center">
                             <Loader2 className="w-5 h-5 animate-spin text-blue-400" /> Generating your next interview question... {loadingRetries > 0 && `(Retry ${loadingRetries})`}
                           </div>
                         </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  {/* Input Sticky Footer */}
                  {status === 'Running' && (
                    <div className="p-4 bg-slate-900/80 border-t border-indigo-200/10 backdrop-blur shrink-0">
                      <div className="relative">
                        <textarea 
                          value={userAnswer}
                          onChange={(e) => setUserAnswer(e.target.value)}
                          placeholder="Type or dictate your answer..."
                          disabled={isSubmitting || loading}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-5 py-3 pr-14 text-sm text-white resize-none outline-none focus:border-blue-500 transition shadow-inner h-20 disabled:opacity-50"
                        />
                        <button
                          onClick={handleAnswerSubmit}
                          disabled={isSubmitting || loading || !userAnswer.trim()}
                          className="absolute right-3 bottom-3 p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 transition shadow-md flex items-center justify-center"
                        >
                          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="flex justify-between items-center mt-2 px-1">
                        <button 
                          onClick={() => {
                            const rec = recognitionRef.current;
                            if (!rec) {
                              addLog('system', 'Voice dictation is not supported in this browser.');
                              return;
                            }
                            if (!micOn) {
                              addLog('system', 'Microphone is muted. Please enable mic first.');
                              return;
                            }

                            if (isDictating) {
                              shouldKeepDictatingRef.current = false;
                              setIsDictating(false);
                              try {
                                rec.stop();
                              } catch (_) {
                                // Ignore stop errors.
                              }
                              addLog('system', 'Microphone dictation paused.');
                              return;
                            }

                            dictationBaseRef.current = String(userAnswerRef.current || '').trim();
                            dictationCommittedRef.current = '';
                            shouldKeepDictatingRef.current = true;
                            try {
                              rec.start();
                              addLog('system', 'Microphone recording enabled...');
                            } catch (_) {
                              addLog('system', 'Could not start microphone dictation. Please retry.');
                            }
                          }}
                          className="text-xs text-slate-400 hover:text-white flex gap-1.5 items-center bg-slate-700/50 px-3 py-1.5 rounded-lg"
                        >
                          {isDictating ? <MicOff className="w-3.5 h-3.5 text-red-400" /> : <Mic className="w-3.5 h-3.5 text-blue-400" />} {isDictating ? 'Stop Dictation' : 'Dictate Answer'}
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