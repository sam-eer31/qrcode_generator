import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Label } from './ui/Input';

export const SupabaseConfigForm: React.FC = () => {
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSystemConfigured, setIsSystemConfigured] = useState(false);
  const [isCustomConfigured, setIsCustomConfigured] = useState(false);

  useEffect(() => {
    // Check if it's set in env variables
    const hasEnv = !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;
    setIsSystemConfigured(hasEnv);

    // Check if it's set in localStorage
    const localConfigStr = localStorage.getItem('qr-studio-supabase-config');
    if (localConfigStr) {
      try {
        const parsed = JSON.parse(localConfigStr);
        if (parsed.supabaseUrl && parsed.supabaseKey) {
          setIsCustomConfigured(true);
          setSupabaseUrl(parsed.supabaseUrl);
          setSupabaseKey(parsed.supabaseKey);
        }
      } catch (e) {
        console.error('Error loading config:', e);
      }
    }
  }, []);

  const handleSave = () => {
    try {
      setStatus('idle');
      setErrorMessage('');

      const url = supabaseUrl.trim();
      const key = supabaseKey.trim();

      if (!url || !key) {
        throw new Error('Please fill in both the Supabase URL and Anon Key.');
      }

      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        throw new Error('Supabase URL must start with http:// or https://');
      }

      const config = {
        supabaseUrl: url,
        supabaseKey: key,
      };

      localStorage.setItem('qr-studio-supabase-config', JSON.stringify(config));
      setStatus('success');
      setIsCustomConfigured(true);
      
      // Reload page to re-initialize Supabase client
      setTimeout(() => {
        window.location.reload();
      }, 1200);

    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err.message || 'Failed to save configuration.');
    }
  };

  const handleClear = () => {
    localStorage.removeItem('qr-studio-supabase-config');
    setIsCustomConfigured(false);
    setSupabaseUrl('');
    setSupabaseKey('');
    setStatus('idle');
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <div className="space-y-4 rounded-2xl border border-neutral-200 dark:border-neutral-850 bg-neutral-50/50 dark:bg-black/30 p-4">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
          Supabase Integration Status
        </h3>
        <div className="flex items-center space-x-2 text-xs">
          {isSystemConfigured ? (
            <span className="flex items-center text-success font-semibold">
              <span className="h-2 w-2 rounded-full bg-success mr-1.5 animate-pulse" />
              Connected (System Environment)
            </span>
          ) : isCustomConfigured ? (
            <span className="flex items-center text-success font-semibold">
              <span className="h-2 w-2 rounded-full bg-success mr-1.5 animate-pulse" />
              Connected (Custom Web Credentials)
            </span>
          ) : (
            <span className="flex items-center text-neutral-450 font-semibold">
              <span className="h-2 w-2 rounded-full bg-neutral-400 dark:bg-neutral-700 mr-1.5" />
              Not Connected (Cloud sharing disabled)
            </span>
          )}
        </div>
      </div>

      {isSystemConfigured ? (
        <p className="text-[10px] text-neutral-400">
          Supabase credentials are set up globally via server environment variables. Custom overrides are disabled.
        </p>
      ) : (
        <div className="space-y-3 pt-1">
          {isCustomConfigured ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-neutral-100 dark:bg-neutral-900/60 p-2 px-3 rounded-xl">
                <span className="text-[10px] font-semibold text-neutral-450 dark:text-neutral-500 uppercase tracking-wide">
                  Using local storage credentials
                </span>
                <Button
                  onClick={handleClear}
                  variant="outline"
                  size="sm"
                  className="py-1 px-3 text-[10px] text-red-500 border-red-500/20 hover:bg-red-500/10 hover:text-red-600 transition-colors"
                >
                  Disconnect Cloud
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="supabase-url-input">Supabase Project URL</Label>
                  <input
                    id="supabase-url-input"
                    type="text"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://your-project.supabase.co"
                    className="w-full px-3 py-2 text-[11px] rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
                  />
                </div>
                <div>
                  <Label htmlFor="supabase-key-input">Supabase Anon Key</Label>
                  <textarea
                    id="supabase-key-input"
                    rows={3}
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full px-3 py-2 text-[11px] font-mono rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all resize-none"
                  />
                </div>
              </div>

              <Button
                onClick={handleSave}
                variant="secondary"
                size="sm"
                className="w-full py-2.5 text-xs shadow-sm"
                disabled={!supabaseUrl.trim() || !supabaseKey.trim()}
              >
                Save & Connect Cloud
              </Button>

              {status === 'success' && (
                <div className="text-[10px] text-success font-semibold text-center bg-success/10 py-1.5 rounded-lg animate-fade-in">
                  Connected successfully! Reloading application...
                </div>
              )}
              {status === 'error' && (
                <div className="text-[10px] text-red-500 font-semibold bg-red-500/10 p-2 rounded-lg leading-normal animate-fade-in">
                  Error: {errorMessage}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
