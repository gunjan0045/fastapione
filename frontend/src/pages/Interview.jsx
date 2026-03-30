import React, { useState, useEffect, useRef } from 'react';
import { Camera, Mic, Play, Square, MessageSquare, AlertCircle, Loader2, Send, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const Interview = () => {
  const auth = useAuth();
  const token = auth?.token || localStorage.getItem('token');
  
  // Interview state
  const [isInterviewing, setIsInterviewing] = useState(false);
  const [stream, setStream] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  
  // Resume selection
  const [resumes, setResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState(null);
  const [loadingResumes, setLoadingResumes] = useState(false);
  
  // AI Interview state
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [userAnswer, setUserAnswer] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);
  const [feedback, setFeedback] = useState([]);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [interviewSummary, setInterviewSummary] = useState('');
  
  // Question/Answer history
  const [questionsAndAnswers, setQuestionsAndAnswers] = useState([]);

  const videoRef = useRef(null);
  const wsRef = useRef(null);
  const intervalRef = useRef(null);
  const recognitionRef = useRef(null);

  // Load resumes on mount
  useEffect(() => {
    fetchResumes();
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          finalTranscript += event.results[i][0].transcript + ' ';
        }
        if (finalTranscript) {
          setUserAnswer((prev) => prev + ' ' + finalTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech Recognition Error:", event.error);
      };

      recognitionRef.current = recognition;
    } else {
      console.warn("Speech Recognition not supported in this browser.");
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      stopInterview();
    };
  }, []);

  // Fetch user's resumes
  const fetchResumes = async () => {
    try {
      setLoadingResumes(true);
      const response = await api.get('/resume/');
      setResumes(response.data);
      if (response.data.length > 0) {
        setSelectedResume(response.data[0]);
      }
    } catch (err) {
      console.error("Error fetching resumes:", err);
      setError("Failed to load resumes. Please upload a resume first.");
    } finally {
      setLoadingResumes(false);
    }
  };

  // Get the first question
  const getFirstQuestion = async () => {
    if (!selectedResume) {
      setError("Please select a resume first");
      return;
    }

    try {
      setLoadingQuestion(true);
      setError('');
      const response = await api.post('/interview/question/generate', {
        resume_id: selectedResume.id,
        question_number: 1
      });
      setCurrentQuestion(response.data);
      setQuestionNumber(1);
      setUserAnswer('');
      setQuestionsAndAnswers([]);
      
      // Add feedback message
      setFeedback([{
        type: 'system',
        text: 'Interview started! Answer the question with your microphone or type below.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (err) {
      console.error("Error getting question:", err);
      setError("Failed to load interview question. Check if API key is set.");
    } finally {
      setLoadingQuestion(false);
    }
  };

  // Get next question
  const getNextQuestion = async () => {
    try {
      setLoadingQuestion(true);
      const nextQuestionNumber = questionNumber + 1;
      const response = await api.post('/interview/question/generate', {
        resume_id: selectedResume.id,
        question_number: nextQuestionNumber
      });
      setCurrentQuestion(response.data);
      setQuestionNumber(nextQuestionNumber);
      setUserAnswer('');
    } catch (err) {
      console.error("Error getting next question:", err);
      setError("Failed to load next question.");
    } finally {
      setLoadingQuestion(false);
    }
  };

  // Submit answer and get feedback
  const submitAnswer = async () => {
    if (!userAnswer.trim()) {
      setError("Please provide an answer before submitting.");
      return;
    }

    try {
      setLoadingFeedback(true);
      const response = await api.post('/interview/answer/feedback', {
        resume_id: selectedResume.id,
        question: currentQuestion.question,
        answer: userAnswer
      });

      // Store Q&A
      setQuestionsAndAnswers([
        ...questionsAndAnswers,
        {
          question: currentQuestion.question,
          answer: userAnswer
        }
      ]);

      // Add feedback to display
      setFeedback([
        ...feedback,
        {
          type: 'answer',
          text: `Your Answer: ${userAnswer}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        {
          type: 'feedback',
          text: response.data.feedback,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);

      // Ask if user wants to continue (max 8 questions)
      if (questionNumber < 8) {
        await getNextQuestion();
      } else {
        // Generate summary
        generateInterviewSummary();
      }
    } catch (err) {
      console.error("Error submitting answer:", err);
      setError("Failed to process your answer. Please try again.");
    } finally {
      setLoadingFeedback(false);
    }
  };

  // Generate interview summary
  const generateInterviewSummary = async () => {
    try {
      const response = await api.post('/interview/summary', {
        resume_id: selectedResume.id,
        questions_and_answers: questionsAndAnswers
      });
      setInterviewSummary(response.data.summary);
      setShowSummary(true);
    } catch (err) {
      console.error("Error generating summary:", err);
      setError("Failed to generate interview summary.");
    }
  };

  // Start Interview (with camera and speech)
  const startInterview = async () => {
    setError('');
    setTranscript('');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      const wsUrl = `ws://localhost:8000/interview/ws?token=${token}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'start_session' }));
        
        const canvas = document.createElement('canvas');
        intervalRef.current = setInterval(() => {
          if (videoRef.current && ws.readyState === WebSocket.OPEN) {
            canvas.width = 320;
            canvas.height = 240;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            
            ws.send(JSON.stringify({ 
              type: 'video_frame', 
              frame: canvas.toDataURL('image/jpeg', 0.5) 
            }));
          }
        }, 1000);
      };

      ws.onerror = (err) => {
        setError("WebSocket connection failed.");
      };

      wsRef.current = ws;

      // Start speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }

      setIsInterviewing(true);
      
      // Get first question
      await getFirstQuestion();

    } catch (err) {
      console.error("Media Error", err);
      setError("Camera/Mic access denied. Check browser permissions.");
    }
  };

  // Stop Interview
  const stopInterview = async () => {
    setIsInterviewing(false);

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }
  };

  // Reset interview
  const resetInterview = () => {
    setCurrentQuestion(null);
    setQuestionNumber(1);
    setUserAnswer('');
    setFeedback([]);
    setQuestionsAndAnswers([]);
    setShowSummary(false);
    setInterviewSummary('');
  };

  if (loadingResumes) {
    return (
      <div className="pt-24 p-6 max-w-7xl mx-auto min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="pt-24 p-6 max-w-7xl mx-auto min-h-screen animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Video Feed Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-950 rounded-4xl overflow-hidden shadow-2xl relative aspect-video border border-slate-800 ring-1 ring-white/5">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-500 ${!stream ? 'opacity-0' : 'opacity-100'}`} 
            />
            
            {!stream && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-700 bg-slate-900/50">
                <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-4 border border-white/5">
                  <Camera className="w-10 h-10 opacity-20" />
                </div>
                <p className="text-sm">Start interview to begin</p>
              </div>
            )}
          </div>

          {/* Resume Selection */}
          {!isInterviewing && (
            <div className="bg-slate-900/50 rounded-lg border border-slate-800 p-4">
              <label className="block text-sm font-semibold text-white mb-2">Select Resume:</label>
              <select
                value={selectedResume?.id || ''}
                onChange={(e) => {
                  const resume = resumes.find(r => r.id === parseInt(e.target.value));
                  setSelectedResume(resume);
                }}
                className="w-full bg-slate-800 text-white rounded-lg px-4 py-2 border border-slate-700 focus:border-blue-600 focus:outline-none"
              >
                {resumes.map(resume => (
                  <option key={resume.id} value={resume.id}>
                    {resume.name || resume.filename}
                  </option>
                ))}
              </select>
              {resumes.length === 0 && (
                <p className="text-slate-400 text-sm mt-2">No resumes found. Please upload a resume first.</p>
              )}
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={startInterview}
              disabled={isInterviewing || !selectedResume}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition"
            >
              <Play className="w-5 h-5" />
              Start Interview
            </button>
            <button
              onClick={stopInterview}
              disabled={!isInterviewing}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition"
            >
              <Square className="w-5 h-5" />
              Stop Interview
            </button>
            {!isInterviewing && questionsAndAnswers.length > 0 && (
              <button
                onClick={resetInterview}
                className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg transition"
              >
                Start Over
              </button>
            )}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Right: Questions and Feedback Panel */}
        <div className="bg-slate-900 rounded-4xl border border-slate-800 p-6 h-fit max-h-200 overflow-y-auto">
          {showSummary ? (
            // Summary View
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">Interview Summary</h3>
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 max-h-150 overflow-y-auto">
                <div className="text-white text-sm whitespace-pre-wrap">{interviewSummary}</div>
              </div>
            </div>
          ) : currentQuestion ? (
            // Question View
            <div className="space-y-4">
              <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-4">
                <p className="text-blue-400 text-xs font-semibold mb-2">Question {questionNumber}</p>
                <p className="text-white font-semibold">{currentQuestion.question}</p>
                <div className="flex gap-2 mt-3">
                  <span className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-300">
                    {currentQuestion.category}
                  </span>
                  <span className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-300">
                    {currentQuestion.difficulty}
                  </span>
                </div>
              </div>

              {/* User Answer Input */}
              <div>
                <label className="text-white text-sm font-semibold mb-2 block">
                  Your Answer:
                </label>
                <textarea
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Type or speak your answer here..."
                  className="w-full bg-slate-800 text-white rounded-lg p-3 border border-slate-700 focus:border-blue-600 focus:outline-none text-sm h-24 resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={submitAnswer}
                disabled={loadingFeedback || !userAnswer.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded-lg flex items-center justify-center gap-2 transition"
              >
                {loadingFeedback ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Answer
                  </>
                )}
              </button>

              {/* Feedback History */}
              {feedback.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-slate-400 text-xs font-semibold">Feedback:</p>
                  <div className="space-y-2 max-h-75 overflow-y-auto">
                    {feedback.map((item, idx) => (
                      <div key={idx} className={`rounded-lg p-3 text-sm ${
                        item.type === 'system' ? 'bg-blue-600/10 border border-blue-600/20 text-blue-300' :
                        item.type === 'answer' ? 'bg-slate-800/50 border border-slate-700/50 text-white' :
                        'bg-green-600/10 border border-green-600/20 text-green-300'
                      }`}>
                        <p className="text-xs text-slate-400 mb-1">{item.time}</p>
                        <p>{item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Initial State
            <div className="flex flex-col items-center justify-center h-48">
              <MessageSquare className="w-12 h-12 text-slate-600 mb-4" />
              <p className="text-slate-400 text-center">
                Select a resume and click "Start Interview" to begin your AI-powered interview.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Interview;