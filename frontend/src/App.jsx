import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import InterviewSelection from './pages/InterviewSelection';
import HumanInterviewBooking from './pages/HumanInterviewBooking';
import Interview from './pages/Interview';
import InterviewFeedback from './pages/InterviewFeedback';
import About from './pages/About';
import Contact from './pages/Contact';
import AnimatedBackground from './components/AnimatedBackground';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col w-full overflow-x-hidden">
            <AnimatedBackground />
            <Navbar />
            <main className="flex-1 w-full relative z-10">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                <Route element={<ProtectedRoute />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/interview" element={<InterviewSelection />} />
                  <Route path="/interview/book-expert" element={<HumanInterviewBooking />} />
                  <Route path="/interview/setup" element={<Interview />} />
                  <Route path="/feedback/:id" element={<InterviewFeedback />} />
                </Route>
              </Routes>
            </main>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;