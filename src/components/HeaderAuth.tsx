import React, { useState, useEffect, useRef } from 'react';
import { 
  User as UserIcon, 
  LogOut, 
  Cloud,
  ChevronDown
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../utils/supabase';

interface HeaderAuthProps {
  onOpenDashboard: () => void;
}

export const HeaderAuth: React.FC<HeaderAuthProps> = ({ onOpenDashboard }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      setAuthLoading(false);
      return;
    }

    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user || null);
      setAuthLoading(false);
    });

    // Listen to changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null);
      setAuthLoading(false);
      setActionLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGoogleLogin = async () => {
    if (!supabase) return;
    setActionLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err) {
      console.error(err);
      setActionLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    setIsDropdownOpen(false);
    await supabase.auth.signOut();
  };

  if (!isSupabaseConfigured()) return null;
  if (authLoading) {
    return <div className="h-9 w-24 bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded-full" />;
  }

  const photoURL = currentUser?.user_metadata?.avatar_url || null;
  const displayName = currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0];

  return (
    <div className="relative" ref={dropdownRef}>
      {currentUser ? (
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center space-x-2 bg-white dark:bg-[#1A1A1A] border border-neutral-200/50 dark:border-neutral-800 shadow-sm pl-1 pr-3 py-1 rounded-full hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors focus:outline-none"
        >
          <div className="h-7 w-7 rounded-full bg-accent/10 border border-accent/25 flex items-center justify-center text-accent overflow-hidden">
            {photoURL ? (
              <img src={photoURL} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <UserIcon className="w-3.5 h-3.5" />
            )}
          </div>
          <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 hidden sm:block max-w-[100px] truncate">
            {displayName}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
        </button>
      ) : (
        <button
          onClick={handleGoogleLogin}
          disabled={actionLoading}
          className="flex items-center space-x-2 bg-[#1A1A1A] dark:bg-white text-white dark:text-black border border-transparent shadow-sm px-4 py-1.5 rounded-full hover:bg-black dark:hover:bg-neutral-200 transition-all font-bold text-xs"
        >
          <svg className="h-3.5 w-3.5 text-current" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{actionLoading ? 'Redirecting...' : 'Sign In'}</span>
        </button>
      )}

      {/* Dropdown Menu */}
      {isDropdownOpen && currentUser && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#1A1A1A] border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-scale-in">
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
            <p className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider">Signed in as</p>
            <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate mt-1">{currentUser.email}</p>
          </div>
          <div className="p-2">
            <button
              onClick={() => {
                setIsDropdownOpen(false);
                onOpenDashboard();
              }}
              className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
            >
              <Cloud className="w-4 h-4 text-accent" />
              <span>My Cloud Links</span>
            </button>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors mt-1"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
