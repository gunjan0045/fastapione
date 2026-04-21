import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Rocket, LogOut, User, Settings, LayoutDashboard, Menu, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target) && !event.target.closest('.mobile-menu-button')) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/');
  };

  const getUserInitial = () => {
    if (user?.first_name) return user.first_name.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return '?';
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Features', path: '/features' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <nav className="fixed top-3 left-4 right-4 md:left-8 md:right-8 z-50">
      <div className="flex items-center justify-between px-4 md:px-8 py-3.5 rounded-2xl md:rounded-3xl border border-white/25 dark:border-indigo-200/10 bg-white/65 dark:bg-[#070d28]/72 backdrop-blur-2xl panel-shadow">
      <Link to="/" className="flex items-center gap-3 text-xl font-bold text-slate-900 dark:text-white hover:text-[#009DFF] dark:hover:text-[#18C3FF] transition-all hover:scale-105 z-50">
        <div className="p-2.5 bg-[#009DFF]/10 dark:bg-[#18C3FF]/10 rounded-xl border border-blue-400/20">
          <Rocket className="w-5 h-5 text-[#009DFF] dark:text-[#18C3FF] animate-pulse" />
        </div>
        <span className="tracking-tight hidden sm:block text-base md:text-lg">AI Interview Coach</span>
      </Link>
      
      {/* Desktop Links */}
      <div className="hidden md:flex items-center gap-2 lg:gap-3">
        {navLinks.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link 
              key={link.name} 
              to={link.path} 
              className={`font-semibold text-xs lg:text-sm transition-all duration-300 px-4 lg:px-5 py-2 rounded-full ${
                isActive 
                  ? 'bg-linear-to-r from-[#009DFF] to-blue-600 dark:from-[#18C3FF] dark:to-blue-600 text-white shadow-[0_0_20px_rgba(24,195,255,0.35)] hover:scale-105' 
                  : 'text-slate-600 dark:text-slate-300 hover:text-[#009DFF] dark:hover:text-[#18C3FF] hover:bg-slate-50 dark:hover:bg-white/5'
              }`}
            >
              {link.name}
            </Link>
          );
        })}
        {user && (
          <Link to="/dashboard" className={`flex items-center gap-2 px-4 lg:px-5 py-2 rounded-full font-semibold text-xs lg:text-sm transition-all duration-300 shadow-sm hover:shadow-lg ${location.pathname === '/dashboard' ? 'bg-linear-to-r from-[#009DFF] to-blue-600 dark:from-[#18C3FF] dark:to-blue-600 text-white shadow-[0_0_20px_rgba(24,195,255,0.35)] hover:scale-105' : 'text-slate-600 dark:text-slate-300 hover:text-[#009DFF] dark:hover:text-[#18C3FF] hover:bg-slate-50 dark:hover:bg-white/5'}`}>
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
        )}
      </div>

      <div className="flex items-center gap-3 z-50">
        <ThemeToggle />
        
        {!loading && (
          <>
            {user ? (
              // Avatar with dropdown
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 dark:from-cyan-500 dark:to-blue-600 text-white flex items-center justify-center font-bold cursor-pointer hover:shadow-[0_0_18px_rgba(34,211,238,0.5)] transition-all"
                  title={user?.first_name || user?.email}
                >
                  {getUserInitial()}
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-3 w-56 rounded-2xl shadow-2xl bg-white/95 dark:bg-[#0b1233]/95 border border-slate-100 dark:border-indigo-300/10 overflow-hidden z-50 backdrop-blur-xl"
                    >
                      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {user?.first_name} {user?.last_name || ''}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{user?.email}</p>
                      </div>

                      <nav className="py-2">
                        <Link
                          to="/profile"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-5 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors"
                        >
                          <User className="w-4 h-4" />
                          Profile
                        </Link>
                        
                        <Link
                          to="/dashboard"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-5 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors md:hidden"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          Dashboard
                        </Link>

                        <Link
                          to="/settings"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-5 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          Settings
                        </Link>

                        <button
                          onClick={handleLogout}
                          className="w-full text-left flex items-center gap-3 px-5 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </nav>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              // Login button
              <Link to="/login" className="px-5 py-2 text-sm font-bold text-white bg-blue-600 dark:bg-cyan-600 hover:bg-blue-700 dark:hover:bg-cyan-500 rounded-full shadow-lg shadow-blue-600/20 dark:shadow-cyan-600/20 transition-all active:scale-95 hidden sm:block">
                Login
              </Link>
            )}
          </>
        )}

        {/* Mobile Menu Button */}
        <button 
          className="mobile-menu-button md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            ref={mobileMenuRef}
            className="absolute top-full left-0 right-0 mt-2 rounded-2xl bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 overflow-hidden md:hidden shadow-2xl"
          >
            <div className="flex flex-col px-6 py-6 pb-8 space-y-4">
              {navLinks.map((link) => (
                <Link key={link.name} to={link.path} className="text-lg font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-cyan-400 py-2 border-b border-slate-100 dark:border-slate-800/50">
                  {link.name}
                </Link>
              ))}
              {!user && !loading && (
                <Link to="/login" className="w-full text-center mt-4 px-6 py-3 text-base font-bold text-white bg-blue-600 dark:bg-cyan-600 rounded-xl shadow-lg transition-all active:scale-95">
                  Login / Sign Up
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;