import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Check, AlertCircle } from 'lucide-react';
import api from '../utils/api';

const CodingInterviewPanel = ({ question, language, setLanguage, onCodeSubmit }) => {
  const [code, setCode] = useState('// Write your code here\n');
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async () => {
    setEvaluating(true);
    setResult(null);
    try {
      const res = await api.post('/interview/evaluate-code', {
        question: question,
        language: language,
        code: code
      });
      setResult(res.data);
      onCodeSubmit(res.data);
    } catch (err) {
      setResult({ is_correct: false, feedback: 'Validation service failed.' });
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-700">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-2 bg-slate-800 border-b border-slate-700">
        <select 
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="bg-slate-900 text-slate-300 text-sm border-none rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="python">Python</option>
          <option value="javascript">JavaScript</option>
          <option value="cpp">C++</option>
          <option value="java">Java</option>
        </select>
        
        <button 
          onClick={handleSubmit}
          disabled={evaluating}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-50 transition-colors"
        >
          {evaluating ? <span className="animate-spin text-white">⟳</span> : <Play className="w-4 h-4" />} 
          Submit Code
        </button>
      </div>

      {/* Editor Main */}
      <div className="flex-1 min-h-75">
        <Editor
          height="100%"
          language={language}
          theme="vs-dark"
          value={code}
          onChange={(val) => setCode(val)}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            padding: { top: 16 }
          }}
        />
      </div>

      {/* Output Panel */}
      {result && (
        <div className={`p-4 border-t border-slate-700 ${result.is_correct ? 'bg-green-900/20' : 'bg-red-900/20'}`}>
          <div className="flex items-center gap-2 mb-2 font-bold">
            {result.is_correct ? <Check className="text-green-500" /> : <AlertCircle className="text-red-500" />}
            <span className={result.is_correct ? 'text-green-400' : 'text-red-400'}>
              {result.is_correct ? 'Optimization Accepted' : 'Refinement Needed'}
            </span>
          </div>
          <p className="text-sm text-slate-300 mb-2">{result.feedback}</p>
          {result.time_complexity && (
            <div className="flex gap-4 text-xs font-mono text-slate-400">
              <span>Time: {result.time_complexity}</span>
              <span>Space: {result.space_complexity}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CodingInterviewPanel;
