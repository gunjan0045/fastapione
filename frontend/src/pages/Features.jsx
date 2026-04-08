import React, { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { 
  FileText, Brain, Code, Users, Play, BarChart3, 
  MessageSquare, UserCircle, Star, ArrowRight, Eye, CheckCircle2 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useAuth } from '../context/AuthContext';

const Features = () => {
  const { user } = useAuth();
  
  // Animation Variants
  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };
  
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
  };

  const chartData = [
    { name: 'Wk 1', technical: 30, confidence: 40 },
    { name: 'Wk 2', technical: 45, confidence: 55 },
    { name: 'Wk 3', technical: 75, confidence: 80 },
    { name: 'Wk 4', technical: 90, confidence: 95 },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 overflow-hidden pt-24 font-sans selection:bg-blue-500/30 selection:text-white">
      
      {/* Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-[30%] right-[-10%] w-[40%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

      {/* HERO SECTION */}
      <motion.section 
        initial="hidden" animate="visible" variants={fadeUp}
        className="relative max-w-7xl mx-auto px-6 lg:px-8 py-20 text-center flex flex-col justify-center items-center"
      >
        <span className="px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-semibold text-sm mb-6 inline-block">
          Next-Gen AI Interview Prep
        </span>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6">
          Ace Every <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Interview</span><br/> with AI-Powered Practice
        </h1>
        <p className="max-w-2xl text-lg text-slate-400 mb-10 mx-auto leading-relaxed">
          Practice technical, behavioral, coding, and resume-based interviews with real-time feedback, body language analysis, and personalized improvement tips.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link to={user ? "/interview" : "/login"} className="px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all flex items-center gap-2">
            Start Free Interview <Play className="w-4 h-4 fill-current" />
          </Link>
          <Link to={user ? "/dashboard" : "/login"} className="px-8 py-4 rounded-xl border border-slate-700 hover:border-slate-500 bg-slate-900/50 hover:bg-slate-800 text-slate-300 font-bold transition-colors">
            {user ? "View Dashboard" : "Login to Save Progress"}
          </Link>
        </div>
      </motion.section>

      {/* SECTION 1: Why Choose Us (Grid) */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-24 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Why Choose AI Interview Coach?</h2>
          <p className="text-slate-400">Everything you need to master your next interview.</p>
        </div>
        
        <motion.div 
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Card 1 */}
          <motion.div variants={fadeUp} className="bg-slate-900/40 border border-slate-800 backdrop-blur-md p-8 rounded-3xl hover:border-blue-500/50 transition-colors group relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><FileText className="w-32 h-32" /></div>
             <div className="w-12 h-12 bg-blue-500/20 border border-blue-500/30 rounded-xl flex items-center justify-center mb-6">
                <FileText className="w-6 h-6 text-blue-400" />
             </div>
             <h3 className="text-xl font-bold text-white mb-3">Resume-Based Interview Questions</h3>
             <p className="text-slate-400 mb-6">The AI reads your uploaded resume and generates interview questions based on your skills, projects, education, and experience.</p>
             <div className="flex flex-wrap gap-2">
                {['Python', 'DSA', 'C++', 'DBMS', 'Final Year Projects'].map(s => (
                   <span key={s} className="px-3 py-1 bg-slate-800 rounded-lg text-xs font-semibold text-slate-300">{s}</span>
                ))}
             </div>
          </motion.div>

          {/* Card 2 */}
          <motion.div variants={fadeUp} className="bg-slate-900/40 border border-slate-800 backdrop-blur-md p-8 rounded-3xl hover:border-purple-500/50 transition-colors group relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><Brain className="w-32 h-32" /></div>
             <div className="w-12 h-12 bg-purple-500/20 border border-purple-500/30 rounded-xl flex items-center justify-center mb-6">
                <Brain className="w-6 h-6 text-purple-400" />
             </div>
             <h3 className="text-xl font-bold text-white mb-3">Intelligent Follow-Up Questions</h3>
             <p className="text-slate-400 mb-6">The AI asks deeper questions based on your answer. Mention terms like HashMap or SQL, and watch it drill into your real understanding.</p>
             <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/50">
               <p className="text-xs text-slate-400 mb-2"><strong>User:</strong> "I used HashMap in my project."</p>
               <ul className="text-xs text-purple-200 list-disc list-inside space-y-1">
                 <li>What is the time complexity?</li>
                 <li>How does collision handling work?</li>
               </ul>
             </div>
          </motion.div>

          {/* Card 3 */}
          <motion.div variants={fadeUp} className="bg-slate-900/40 border border-slate-800 backdrop-blur-md p-8 rounded-3xl hover:border-emerald-500/50 transition-colors group relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><Code className="w-32 h-32" /></div>
             <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center justify-center mb-6">
                <Code className="w-6 h-6 text-emerald-400" />
             </div>
             <h3 className="text-xl font-bold text-white mb-3">Live Coding Interview Mode</h3>
             <p className="text-slate-400 mb-6">Solve coding problems directly inside the interview using an integrated code editor matching multiple programming languages.</p>
             <ul className="grid grid-cols-2 gap-2 text-sm text-slate-300">
               <li className="flex gap-2 items-center"><CheckCircle2 className="w-4 h-4 text-emerald-400"/> Monaco Editor</li>
               <li className="flex gap-2 items-center"><CheckCircle2 className="w-4 h-4 text-emerald-400"/> Run Instantly</li>
               <li className="flex gap-2 items-center"><CheckCircle2 className="w-4 h-4 text-emerald-400"/> Multi-Language</li>
               <li className="flex gap-2 items-center"><CheckCircle2 className="w-4 h-4 text-emerald-400"/> Quality Feedback</li>
             </ul>
          </motion.div>

          {/* Card 4 */}
          <motion.div variants={fadeUp} className="bg-slate-900/40 border border-slate-800 backdrop-blur-md p-8 rounded-3xl hover:border-orange-500/50 transition-colors group relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><Users className="w-32 h-32" /></div>
             <div className="w-12 h-12 bg-orange-500/20 border border-orange-500/30 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-orange-400" />
             </div>
             <h3 className="text-xl font-bold text-white mb-3">Choose AI or Real Human</h3>
             <p className="text-slate-400 mb-6">Choose whether you want to continue practicing blindly with the AI interviewer, or connect directly with an industry professional for a vetted mock interview.</p>
             <Link to="/interview/book-expert" className="text-orange-400 hover:text-orange-300 text-sm font-bold flex items-center gap-1 group/link">
               Book an Expert <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
             </Link>
          </motion.div>

        </motion.div>
      </section>

      {/* SECTION 2: Powerful Features (Alternating) */}
      <section className="bg-slate-900/50 border-y border-slate-800/50 py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 space-y-32">
          
          {/* Feature 1 */}
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <motion.div initial="hidden" whileInView="visible" viewport={{once:true}} variants={fadeUp} className="flex-1 space-y-6">
               <h2 className="text-3xl md:text-4xl font-bold text-white">Get Instant Feedback After Every Answer</h2>
               <p className="text-slate-400 text-lg leading-relaxed">After every answer, the platform instantly tells you what you did well, and what you missed. Grow iteratively rather than feeling lost.</p>
               <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/50 shadow-inner">
                 <p className="text-slate-300 mb-2 italic">“Good explanation of Maps, but you missed explicitly mentioning hashing or time complexity details.”</p>
               </div>
               <div className="flex gap-4 flex-wrap mt-4">
                  {['Relevance Score', 'Technical Accuracy', 'Communication Quality'].map(b => (
                     <span key={b} className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-xs font-semibold text-slate-300">{b}</span>
                  ))}
               </div>
            </motion.div>
            <motion.div initial={{opacity:0, scale:0.95}} whileInView={{opacity:1, scale:1}} viewport={{once:true}} className="flex-1 w-full shrink-0">
               <div className="w-full aspect-[4/3] bg-linear-to-br from-slate-800 to-slate-900 rounded-3xl border border-slate-700 shadow-2xl flex flex-col justify-end overflow-hidden p-6 relative">
                 <div className="absolute top-6 left-6 right-6 h-32 bg-slate-800 rounded-xl p-4 space-y-2 border border-slate-700">
                    <div className="h-4 w-32 bg-slate-700 rounded-full" />
                    <div className="h-3 w-3/4 bg-slate-600 rounded-full" />
                    <div className="h-3 w-1/2 bg-slate-600 rounded-full" />
                 </div>
                 <div className="w-full bg-blue-900/30 p-4 rounded-xl border border-blue-500/30 translate-y-2 relative z-10">
                    <div className="flex gap-2 items-center mb-2"><BotIcon className="text-blue-400 w-5 h-5"/> <span className="text-blue-300 font-bold text-sm">System Feedback</span></div>
                    <div className="h-2 w-full bg-blue-800 rounded-full mt-2" />
                    <div className="h-2 w-4/5 bg-blue-800 rounded-full mt-2" />
                 </div>
               </div>
            </motion.div>
          </div>

          {/* Feature 2 (Reversed) */}
          <div className="flex flex-col-reverse lg:flex-row items-center gap-16">
            <motion.div initial={{opacity:0, scale:0.95}} whileInView={{opacity:1, scale:1}} viewport={{once:true}} className="flex-1 w-full shrink-0">
               <div className="w-full aspect-[4/3] bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden relative group">
                 <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1573164713988-8665fc963095?w=800&q=80')] bg-cover bg-center opacity-40 mix-blend-luminosity group-hover:opacity-50 transition-opacity" />
                 <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/20 to-transparent" />
                 <div className="absolute top-6 right-6 bg-red-500/80 p-2 rounded-xl backdrop-blur"><Eye className="w-5 h-5 text-white" /></div>
                 <div className="absolute bottom-6 left-6 right-6 bg-slate-800/80 p-4 rounded-xl backdrop-blur-md border border-slate-700 space-y-3">
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-300">Eye Contact</span><span className="text-green-400 font-bold">Good</span>
                   </div>
                   <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-green-400 w-[85%]" /></div>
                   <div className="flex justify-between items-center text-sm mt-2">
                      <span className="text-slate-300">Posture</span><span className="text-amber-400 font-bold">Monitor</span>
                   </div>
                   <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-amber-400 w-[60%]" /></div>
                 </div>
               </div>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{once:true}} variants={fadeUp} className="flex-1 space-y-6">
               <h2 className="text-3xl md:text-4xl font-bold text-white">Improve Confidence with Body Language Tracking</h2>
               <p className="text-slate-400 text-lg leading-relaxed">The webcam strictly analyzes eye contact, posture, face visibility, and speaking confidence dynamically during the interview.</p>
               <ul className="space-y-2 text-slate-300 text-sm">
                 <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-400"/> Eye contact tracking</li>
                 <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-400"/> Posture monitoring</li>
                 <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-400"/> Head movement detection</li>
               </ul>
            </motion.div>
          </div>

          {/* Feature 3 */}
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <motion.div initial="hidden" whileInView="visible" viewport={{once:true}} variants={fadeUp} className="flex-1 space-y-6">
               <h2 className="text-3xl md:text-4xl font-bold text-white">Track Your Growth with Detailed Reports</h2>
               <p className="text-slate-400 text-lg leading-relaxed">Every interview session is instantly dumped in your dashboard with a massive breakdown of performance.</p>
               <div className="grid grid-cols-2 gap-4">
                 <div className="bg-slate-800 p-4 rounded-xl border border-slate-700"><p className="text-xs text-slate-400 mb-1">Total Interviews</p><p className="text-2xl font-bold text-white">24</p></div>
                 <div className="bg-slate-800 p-4 rounded-xl border border-slate-700"><p className="text-xs text-slate-400 mb-1">Average Score</p><p className="text-2xl font-bold text-green-400">82%</p></div>
               </div>
            </motion.div>
            <motion.div initial={{opacity:0, scale:0.95}} whileInView={{opacity:1, scale:1}} viewport={{once:true}} className="flex-1 w-full shrink-0 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorTech" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#475569" axisLine={false} tickLine={false} />
                    <YAxis stroke="#475569" axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}/>
                    <Area type="monotone" dataKey="technical" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTech)" />
                  </AreaChart>
                </ResponsiveContainer>
            </motion.div>
          </div>
          
        </div>
      </section>

      {/* SECTION 3: Step-by-Step */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-24 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">How It Works</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
           {/* Connecting Line */}
           <div className="hidden md:block absolute top-8 left-10 right-10 h-0.5 bg-slate-800 -z-10" />
           
           {[
             { step: "1", title: "Upload Resume", desc: "Upload your resume and choose your target role." },
             { step: "2", title: "Start Interview", desc: "Enable camera and microphone, then dive right in." },
             { step: "3", title: "Answer Questions", desc: "Respond to deep technical, behavioral, and coding queues." },
             { step: "4", title: "Get Full Feedback", desc: "View scores, body language analysis, and improvement tips." },
           ].map((s, i) => (
             <motion.div 
               key={i} initial={{opacity:0, y:20}} whileInView={{opacity:1, y:0}} transition={{delay: i * 0.1}} viewport={{once:true}}
               className="flex flex-col items-center text-center p-4"
             >
               <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-bold text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] mb-6 ring-4 ring-slate-950">
                 {s.step}
               </div>
               <h3 className="text-xl font-bold text-white mb-2">{s.title}</h3>
               <p className="text-slate-400 text-sm">{s.desc}</p>
             </motion.div>
           ))}
        </div>
      </section>

      {/* SECTION 4: Statistics */}
      <section className="bg-blue-900/10 border-y border-blue-900/30 py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
           <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-blue-900/40">
              <div className="flex flex-col items-center justify-center">
                 <h4 className="text-4xl md:text-5xl font-extrabold text-white mb-2">10k+</h4>
                 <p className="text-blue-300 font-medium">Interviews Practiced</p>
              </div>
              <div className="flex flex-col items-center justify-center">
                 <h4 className="text-4xl md:text-5xl font-extrabold text-white mb-2">95%</h4>
                 <p className="text-blue-300 font-medium">User Satisfaction</p>
              </div>
              <div className="flex flex-col items-center justify-center">
                 <h4 className="text-4xl md:text-5xl font-extrabold text-white mb-2">50+</h4>
                 <p className="text-blue-300 font-medium">Tech Skills Covered</p>
              </div>
              <div className="flex flex-col items-center justify-center">
                 <h4 className="text-4xl md:text-5xl font-extrabold text-white mb-2">24/7</h4>
                 <p className="text-blue-300 font-medium">AI Availability</p>
              </div>
           </div>
        </div>
      </section>

      {/* SECTION 5: Testimonials */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-24 relative z-10">
         <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">What Users Say</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <TestimonialCard 
             quote="AI Interview Coach helped me prepare for my placement interviews. The follow-up questions felt exactly like a real interviewer."
             name="Sarah Jenkins" role="Swe @ TechCorp"
           />
           <TestimonialCard 
             quote="The coding interview mode and body language feedback were the best parts of the platform."
             name="Marcus Thorne" role="Data Scientist"
           />
           <TestimonialCard 
             quote="I improved my communication and confidence after just a few interview sessions."
             name="Emily Chen" role="Junior Developer"
           />
        </div>
      </section>

      {/* SECTION 6: Final CTA */}
      <section className="max-w-4xl mx-auto px-6 lg:px-8 py-32 text-center relative z-10">
         <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">Ready to Crack Your Next Interview?</h2>
         <p className="text-xl text-slate-400 mb-10">Practice with AI, improve your confidence, and get job-ready today.</p>
         <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link to={user ? "/interview" : "/login"} className="px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all flex items-center gap-2">
            Start Interview Now <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to={user ? "/dashboard" : "/login"} className="px-8 py-4 rounded-xl border border-slate-700 hover:border-slate-500 bg-slate-900/50 hover:bg-slate-800 text-slate-300 font-bold transition-colors">
            Upload Resume
          </Link>
        </div>
      </section>

    </div>
  );
};

const TestimonialCard = ({ quote, name, role }) => (
  <motion.div 
    initial={{opacity:0, y:20}} whileInView={{opacity:1, y:0}} viewport={{once:true}}
    className="bg-slate-900/60 border border-slate-800 p-8 rounded-3xl flex flex-col justify-between hover:border-slate-600 transition-colors"
  >
     <div className="flex gap-1 mb-6 text-amber-400">
        <Star className="w-4 h-4 fill-current"/>
        <Star className="w-4 h-4 fill-current"/>
        <Star className="w-4 h-4 fill-current"/>
        <Star className="w-4 h-4 fill-current"/>
        <Star className="w-4 h-4 fill-current"/>
     </div>
     <p className="text-slate-300 mb-8 italic">"{quote}"</p>
     <div className="flex items-center gap-3 mt-auto border-t border-slate-800 pt-6">
        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold">
           <UserCircle className="w-6 h-6"/>
        </div>
        <div>
           <p className="text-white font-bold text-sm">{name}</p>
           <p className="text-slate-500 text-xs">{role}</p>
        </div>
     </div>
  </motion.div>
);

const BotIcon = ({ className }) => <MessageSquare className={className} />;

export default Features;
