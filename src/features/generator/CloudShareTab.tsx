import React, { useState, useEffect, useRef } from 'react';
import { 
  CloudUpload, 
  Image as ImageIcon, 
  FileText as FileIcon, 
  Clock, 
  Lock, 
  User as UserIcon, 
  LogOut, 
  AlertCircle, 
  Check, 
  ChevronRight,
  TrendingUp,
  Settings
} from 'lucide-react';
import { 
  onAuthStateChanged,
  signOut, 
  GoogleAuthProvider,
  signInWithRedirect
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage, isFirebaseConfigured } from '../../utils/firebase';
import { Button } from '../../components/ui/Button';
import { Label } from '../../components/ui/Input';
import { CloudDashboard } from './CloudDashboard';

interface CloudShareTabProps {
  onLinkGenerated: (link: string) => void;
  onViewDashboard: () => void;
  activeView: 'editor' | 'dashboard';
  setActiveView: (view: 'editor' | 'dashboard') => void;
}

export const CloudShareTab: React.FC<CloudShareTabProps> = ({ 
  onLinkGenerated, 
  activeView, 
  setActiveView 
}) => {
  const [shareType, setShareType] = useState<'image' | 'text'>('image');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Form states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('ocean');
  
  // Expiry configuration
  const [expiryDays, setExpiryDays] = useState<'1' | '7' | '30' | 'infinite'>('1');

  // Auth form states
  const [authError, setAuthError] = useState('');
  const [authActionLoading, setAuthActionLoading] = useState(false);

  // Upload progress and results
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [uploadError, setUploadError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured() || !auth) {
      setAuthLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      
      // Default guests are locked to 24h (1 day), logged in users can choose permanent
      if (user) {
        setExpiryDays('infinite');
      } else {
        setExpiryDays('1');
      }
    });

    return () => unsubscribe();
  }, []);

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1000;
          const MAX_HEIGHT = 1000;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Image compression failed'));
              }
            },
            'image/jpeg',
            0.85 // High quality compression
          );
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setUploadError('Only image uploads are supported.');
        return;
      }
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
      setUploadError('');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (!file.type.startsWith('image/')) {
        setUploadError('Only image uploads are supported.');
        return;
      }
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
      setUploadError('');
    }
  };

  const handleGoogleLogin = async () => {
    if (!auth) return;
    setAuthActionLoading(true);
    setAuthError('');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithRedirect(auth, provider);
      // Note: The page will redirect to Google. When it comes back, onAuthStateChanged will pick up the user.
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || 'Google authentication failed.');
      setAuthActionLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (!auth) return;
    await signOut(auth);
  };

  const handleUpload = async () => {
    if (!db || !storage) return;
    
    setUploading(true);
    setUploadError('');
    setUploadProgress('Preparing file upload...');

    const shareId = `share-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    try {
      let contentUrlOrText = '';

      if (shareType === 'image') {
        if (!selectedFile) {
          throw new Error('Please select an image file first.');
        }

        // Compress image client side
        setUploadProgress('Compressing image for fast upload...');
        const compressedBlob = await compressImage(selectedFile);
        
        setUploadProgress('Uploading image file...');
        const storageRef = ref(storage, `shares/${shareId}_compressed.jpg`);
        await uploadBytes(storageRef, compressedBlob);
        contentUrlOrText = await getDownloadURL(storageRef);
      } else {
        if (!messageText.trim()) {
          throw new Error('Please enter your text message.');
        }
        contentUrlOrText = messageText;
      }

      setUploadProgress('Registering share code...');
      
      let expiresAt: number | null = null;
      if (expiryDays === '1') {
        expiresAt = Date.now() + 24 * 60 * 60 * 1000;
      } else if (expiryDays === '7') {
        expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
      } else if (expiryDays === '30') {
        expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
      }

      await setDoc(doc(db, 'shares', shareId), {
        id: shareId,
        type: shareType,
        content: contentUrlOrText,
        theme: shareType === 'text' ? selectedTheme : null,
        creatorId: currentUser ? currentUser.uid : 'anonymous',
        createdAt: Date.now(),
        expiresAt,
        scanCount: 0,
        fileName: shareType === 'image' ? selectedFile?.name : null
      });

      const publicLink = `${window.location.origin}${window.location.pathname}?share=${shareId}`;
      setGeneratedLink(publicLink);
      onLinkGenerated(publicLink);

    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    // Visual feedback handled by setCopied in calling elements, we can do alert state
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setMessageText('');
    setGeneratedLink('');
    setUploadError('');
  };

  if (!isFirebaseConfigured()) {
    return (
      <div className="space-y-6 text-center py-10">
        <div className="h-16 w-16 mx-auto rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-500">
          <Settings className="w-8 h-8 animate-spin-slow" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">Cloud Integration Required</h2>
          <p className="text-xs text-neutral-450 dark:text-neutral-500 max-w-sm mx-auto leading-relaxed">
            Firebase storage is required to host images and messages. Click the Settings icon in the header, scroll down to <strong>Cloud Sharing Config</strong>, and paste your Firebase Web credentials.
          </p>
        </div>
      </div>
    );
  }

  if (activeView === 'dashboard') {
    return (
      <CloudDashboard 
        currentUser={currentUser} 
        onBackToCreator={() => setActiveView('editor')} 
        onLoadGeneratedLink={(link) => {
          setGeneratedLink(link);
          onLinkGenerated(link);
          setActiveView('editor');
        }}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Selector Tabs & Dashboard Route */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div className="flex space-x-1.5 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 w-fit">
          <button
            onClick={() => { setShareType('image'); resetUpload(); }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              shareType === 'image' 
                ? 'bg-white text-black dark:bg-[#1A1A1A] dark:text-white shadow-sm' 
                : 'text-neutral-450 hover:text-neutral-700 dark:hover:text-neutral-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Upload Image</span>
          </button>
          <button
            onClick={() => { setShareType('text'); resetUpload(); }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              shareType === 'text' 
                ? 'bg-white text-black dark:bg-[#1A1A1A] dark:text-white shadow-sm' 
                : 'text-neutral-450 hover:text-neutral-700 dark:hover:text-neutral-200'
            }`}
          >
            <FileIcon className="w-3.5 h-3.5" />
            <span>Share Note</span>
          </button>
        </div>

        {currentUser && (
          <button
            onClick={() => setActiveView('dashboard')}
            className="flex items-center space-x-1 text-xs font-bold text-accent hover:text-accent-hover transition-colors"
          >
            <span>Go to Cloud Dashboard</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Form Blocks */}
      {generatedLink ? (
        /* SUCCESS SCREEN */
        <div className="space-y-5 border border-success/20 bg-success/5 dark:bg-success/05 p-6 rounded-2xl animate-scale-in">
          <div className="flex items-center space-x-3 text-success">
            <div className="h-9 w-9 rounded-full bg-success/10 flex items-center justify-center border border-success/25">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Cloud Link Generated</h3>
              <p className="text-[10px] opacity-75">Your QR Code on the right is now linked to this cloud file</p>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="generated-url-display">Shareable Public Link</Label>
            <div className="flex space-x-2">
              <input
                id="generated-url-display"
                type="text"
                readOnly
                value={generatedLink}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-success/20 bg-white/70 dark:bg-black/30 text-neutral-800 dark:text-neutral-200 focus:outline-none"
              />
              <Button
                onClick={handleCopyLink}
                variant="secondary"
                size="sm"
                className="px-4.5"
              >
                Copy
              </Button>
            </div>
          </div>

          <div className="pt-2 border-t border-success/10 flex flex-col sm:flex-row justify-between gap-3 text-[10px] font-semibold text-neutral-400 select-none">
            <span className="flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1 text-accent" />
              {expiryDays === 'infinite' ? 'Permanent Link' : `Expires in ${expiryDays} day(s)`}
            </span>
            <button
              onClick={resetUpload}
              className="text-accent hover:underline w-fit"
            >
              Upload another item
            </button>
          </div>
        </div>
      ) : (
        /* CREATOR INTERFACE */
        <div className="space-y-5">
          {shareType === 'image' ? (
            /* IMAGE DROPZONE */
            <div className="space-y-3">
              <Label>Select Image File</Label>
              {filePreview ? (
                <div className="relative rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 aspect-[16/9] flex items-center justify-center shadow-inner">
                  <img src={filePreview} alt="Upload preview" className="max-h-full max-w-full object-contain" />
                  <button
                    onClick={() => { setSelectedFile(null); setFilePreview(null); }}
                    className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 px-2 py-1 rounded-lg text-white text-[10px] font-bold transition-all shadow"
                  >
                    Clear Image
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    dragOver
                      ? 'border-accent bg-accent/5'
                      : 'border-neutral-200 dark:border-neutral-850 hover:border-neutral-350 dark:hover:border-neutral-700 bg-white/20 dark:bg-black/20'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="h-12 w-12 rounded-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 flex items-center justify-center mb-3 text-neutral-450 dark:text-neutral-500 shadow-sm group-hover:scale-105 transition-transform">
                    <CloudUpload className="w-5 h-5 text-accent" />
                  </div>
                  <span className="text-xs font-bold text-neutral-800 dark:text-white">
                    Drag and drop your image here
                  </span>
                  <span className="text-[10px] font-medium text-neutral-450 dark:text-neutral-500 mt-1">
                    Supports PNG, JPG, WEBP (Auto-optimized on drop)
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* NOTE TEXT WRITER */
            <div className="space-y-4 animate-scale-in">
              <div className="space-y-2">
                <Label htmlFor="cloud-message-input">Write Note Message</Label>
                <textarea
                  id="cloud-message-input"
                  rows={4}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Write a message, contact details, or instructions..."
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-black/50 backdrop-blur-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all resize-none"
                />
              </div>

              {/* Theme Selector Swatches */}
              <div className="space-y-2">
                <Label>Choose Note Template Theme</Label>
                <div className="flex space-x-3 select-none pt-0.5">
                  {[
                    { id: 'ocean', name: 'Ocean Blue', bg: 'bg-gradient-to-br from-blue-500 to-cyan-500' },
                    { id: 'sunset', name: 'Sunset Glow', bg: 'bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500' },
                    { id: 'forest', name: 'Emerald', bg: 'bg-gradient-to-br from-emerald-500 to-teal-600' },
                    { id: 'cyberpunk', name: 'Cyberpunk', bg: 'bg-gradient-to-br from-fuchsia-500 via-purple-500 to-indigo-600' },
                    { id: 'minimalist', name: 'Dark Mode', bg: 'bg-gradient-to-br from-neutral-800 to-neutral-950 border border-neutral-700/30' }
                  ].map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => setSelectedTheme(theme.id)}
                      className={`relative h-9 w-9 rounded-full ${theme.bg} cursor-pointer shadow-sm hover:scale-105 active:scale-95 transition-all flex items-center justify-center`}
                      title={theme.name}
                    >
                      {selectedTheme === theme.id && (
                        <span className="h-3 w-3 rounded-full bg-white shadow-sm animate-scale-in" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Expiry Selector Config Panel */}
          <div className="space-y-2">
            <Label htmlFor="expiry-duration-selector">Link Expiry Duration</Label>
            <div className="flex items-center space-x-2">
              <select
                id="expiry-duration-selector"
                value={expiryDays}
                onChange={(e) => setExpiryDays(e.target.value as any)}
                disabled={!currentUser}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-black/50 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-60"
              >
                <option value="1">24 Hours (Guest Upload limit)</option>
                {currentUser && (
                  <>
                    <option value="7">7 Days</option>
                    <option value="30">30 Days</option>
                    <option value="infinite">Permanent Link (No Expiry)</option>
                  </>
                )}
              </select>
              
              {!currentUser && (
                <div className="flex items-center space-x-1 flex-shrink-0 bg-neutral-100 dark:bg-neutral-900/60 p-2 rounded-xl text-[9px] font-bold text-neutral-400 border border-neutral-200/50 dark:border-neutral-850/50">
                  <Lock className="w-3.5 h-3.5 text-amber-500 fill-current" />
                  <span>Permanent Requires Login</span>
                </div>
              )}
            </div>
          </div>

          {/* ACTION BUTTON */}
          <Button
            onClick={handleUpload}
            disabled={uploading || (shareType === 'image' ? !selectedFile : !messageText.trim())}
            className="w-full py-3.5 flex items-center justify-center space-x-2 shadow-lg"
          >
            {uploading ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                <span>{uploadProgress || 'Uploading to cloud...'}</span>
              </>
            ) : (
              <>
                <CloudUpload className="w-4 h-4" />
                <span>Generate Cloud QR Code</span>
              </>
            )}
          </Button>

          {uploadError && (
            <div className="text-[11px] text-red-500 font-semibold bg-red-500/10 p-2 rounded-lg leading-relaxed flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>
      )}

      {/* AUTH CARD (SHOW ON BOTTOM) */}
      {!authLoading && (
        <div className="pt-6 border-t border-neutral-200 dark:border-neutral-900">
          {currentUser ? (
            /* LOGGED IN ACCOUNT CARD */
            <div className="flex items-center justify-between p-3.5 px-4.5 bg-neutral-50/50 dark:bg-neutral-950/20 border border-neutral-200 dark:border-neutral-900 rounded-2xl animate-fade-in select-none">
              <div className="flex items-center space-x-3">
                <div className="h-9 w-9 rounded-full bg-accent/10 border border-accent/25 flex items-center justify-center text-accent">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 font-bold block leading-none">Logged In Account</span>
                  <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 font-mono truncate max-w-[180px] block mt-1">
                    {currentUser.email}
                  </span>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-1 text-[10px] font-bold text-neutral-400 hover:text-red-500 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            /* LOGIN CARD FOR GUEST */
            <div className="bg-white dark:bg-[#0E0E0E] border border-neutral-200 dark:border-neutral-900 rounded-2xl p-5 shadow-premium dark:shadow-premium-dark space-y-4">
              <div className="flex items-start space-x-3 text-neutral-800 dark:text-white select-none">
                <div className="h-9 w-9 rounded-full bg-accent/10 border border-accent/25 flex items-center justify-center text-accent flex-shrink-0">
                  <TrendingUp className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold">Unlock Permanent Links & Analytics</h4>
                  <p className="text-[10px] text-neutral-400 mt-1 leading-normal">
                    Guest links expire in 24 hours. Connect an account to keep links forever and view scan statistics.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={authActionLoading}
                  className="flex items-center justify-center space-x-3 bg-white dark:bg-[#1A1A1A] border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 shadow-sm w-full py-3.5 rounded-xl font-bold transition-all text-neutral-800 dark:text-white"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
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
                  <span>{authActionLoading ? 'Connecting...' : 'Continue with Google'}</span>
                </button>
              </div>

              {authError && (
                <div className="text-[10px] text-red-500 font-semibold bg-red-500/10 p-2 rounded-lg leading-relaxed flex items-center space-x-1.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{authError}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
