import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Label } from './ui/Input';

export const FirebaseConfigForm: React.FC = () => {
  const [configInput, setConfigInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSystemConfigured, setIsSystemConfigured] = useState(false);
  const [isCustomConfigured, setIsCustomConfigured] = useState(false);

  useEffect(() => {
    // Check if it's set in env variables
    const hasEnv = !!import.meta.env.VITE_FIREBASE_API_KEY;
    setIsSystemConfigured(hasEnv);

    // Check if it's set in localStorage
    const hasLocal = !!localStorage.getItem('qr-studio-firebase-config');
    setIsCustomConfigured(hasLocal);
  }, []);

  const handleSave = () => {
    try {
      setStatus('idle');
      setErrorMessage('');

      // Normalize the pasted input to JSON
      let cleaned = configInput.trim();
      
      // If they pasted the entire JS code: const firebaseConfig = { ... }
      if (cleaned.includes('{')) {
        const startIdx = cleaned.indexOf('{');
        const endIdx = cleaned.lastIndexOf('}');
        if (startIdx !== -1 && endIdx !== -1) {
          cleaned = cleaned.substring(startIdx, endIdx + 1);
        }
      }

      // Convert Javascript-like object keys/strings to strict JSON
      // e.g. apiKey: "xyz" -> "apiKey": "xyz"
      let jsonStr = cleaned
        .replace(/([a-zA-Z0-9_]+)\s*:/g, '"$1":') // quotes keys
        .replace(/'/g, '"') // replaces single quotes with double quotes
        .replace(/,\s*}/g, '}') // removes trailing commas
        .replace(/,\s*\]/g, ']'); // removes trailing commas in arrays
      
      const parsed = JSON.parse(jsonStr);

      if (!parsed.apiKey || !parsed.projectId || !parsed.storageBucket) {
        throw new Error('Missing critical fields (apiKey, projectId, or storageBucket)');
      }

      localStorage.setItem('qr-studio-firebase-config', JSON.stringify(parsed));
      setStatus('success');
      setIsCustomConfigured(true);
      setConfigInput('');
      
      // Reload page to re-initialize Firebase with new credentials after 1.5 seconds
      setTimeout(() => {
        window.location.reload();
      }, 1200);

    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err.message || 'Invalid config format. Please check your JSON syntax.');
    }
  };

  const handleClear = () => {
    localStorage.removeItem('qr-studio-firebase-config');
    setIsCustomConfigured(false);
    setStatus('idle');
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <div className="space-y-4 rounded-2xl border border-neutral-200 dark:border-neutral-850 bg-neutral-50/50 dark:bg-black/30 p-4">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
          Cloud Integration Status
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
            <span className="flex items-center text-neutral-400 font-semibold">
              <span className="h-2 w-2 rounded-full bg-neutral-450 dark:bg-neutral-700 mr-1.5" />
              Not Connected (Cloud sharing disabled)
            </span>
          )}
        </div>
      </div>

      {isSystemConfigured ? (
        <p className="text-[10px] text-neutral-400">
          Firebase credentials are set up globally via server environment variables. Custom overrides are disabled.
        </p>
      ) : (
        <div className="space-y-3 pt-1">
          {isCustomConfigured ? (
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
          ) : (
            <>
              <div>
                <Label htmlFor="firebase-config-input">Paste Firebase Web Config object</Label>
                <textarea
                  id="firebase-config-input"
                  rows={4}
                  value={configInput}
                  onChange={(e) => setConfigInput(e.target.value)}
                  placeholder={`const firebaseConfig = {\n  apiKey: "AIzaSy...",\n  authDomain: "project.firebaseapp.com",\n  projectId: "project",\n  storageBucket: "project.appspot.com",\n  ...\n};`}
                  className="w-full px-3 py-2 text-[11px] font-mono rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all resize-none"
                />
              </div>

              <Button
                onClick={handleSave}
                variant="secondary"
                size="sm"
                className="w-full py-2.5 text-xs shadow-sm"
                disabled={!configInput.trim()}
              >
                Save & Connect Cloud
              </Button>

              {status === 'success' && (
                <div className="text-[10px] text-success font-semibold text-center bg-success/10 py-1.5 rounded-lg animate-fade-in">
                  Connected successfully! Reloading application...
                </div>
              )}
              {status === 'error' && (
                <div className="text-[10px] text-red-500 font-semibold bg-red-500/10 p-2 rounded-lg leading-normal">
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
