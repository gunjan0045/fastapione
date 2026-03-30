import { Link, useNavigate } from 'react-router-dom';
import { Rocket, LogOut, User, Settings } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [dropdownOpen]);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/');
  };

  const getUserInitial = () => {
    if (user?.first_name) {
      return user.first_name.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return '?';
  };

  return (
    <nav className="flex items-center justify-between px-6 md:px-12 py-4 bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl border-b border-white/20 dark:border-white/10 fixed top-0 left-0 right-0 z-50 transition-all duration-300">
      <Link to="/" className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-all hover:scale-105">
        <div className="p-2 bg-blue-600/10 rounded-lg">
          <Rocket className="w-6 h-6 text-blue-600 animate-pulse" />
        </div>
        <span className="tracking-tight">AI Interview Coach</span>
      </Link>
      
      <div className="hidden md:flex items-center gap-8">
        <Link to="/" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-semibold text-sm transition-colors">Home</Link>
        <Link to="/about" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-semibold text-sm transition-colors">About</Link>
        <Link to="#features" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-semibold text-sm transition-colors">Features</Link>
        <Link to="/contact" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-semibold text-sm transition-colors">Contact</Link>
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />
        
        {!loading && (
          <>
            {user ? (
              // Avatar with dropdown
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold cursor-pointer hover:bg-blue-700 transition-colors"
                  title={user?.first_name || user?.email}
                >
                  {getUserInitial()}
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-[#121826] border border-slate-700 overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-slate-700">
                      <p className="text-sm font-semibold text-white">
                        {user?.first_name} {user?.last_name || ''}
                      </p>
                      <p className="text-xs text-slate-400">{user?.email}</p>
                    </div>

                    <nav className="py-2">
                      <Link
                        to="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        Profile
                      </Link>

                      <Link
                        to="/settings"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>

                      <button
                        onClick={handleLogout}
                        className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-200 hover:bg-red-600 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </nav>
                  </div>
                )}
              </div>
            ) : (
              // Login button
              <Link to="/login" className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-2xl shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 transition-all active:scale-95">
                Login
              </Link>
            )}
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;