import React, { useState, useRef, useEffect } from 'react';
import { 
  CloudUpload, 
  Settings, 
  AlertCircle, 
  Check, 
  Lock 
} from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../../utils/firebase';
import { Button } from '../../components/ui/Button';
import { Label } from '../../components/ui/Input';

interface CloudFormProps {
  onChange: (link: string) => void;
}

const compressImageBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
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

        // Export as heavily compressed Base64 Data URL to fit in Firestore 1MB limit
        // 400x400 with 0.5 quality guarantees tiny size (<100KB)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
        resolve(dataUrl);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

const MissingFirebaseConfig = () => (
  <div className="space-y-6 text-center py-10 border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-neutral-50 dark:bg-[#0E0E0E]">
    <div className="h-16 w-16 mx-auto rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-500">
      <Settings className="w-8 h-8 animate-spin-slow" />
    </div>
    <div className="space-y-2">
      <h2 className="text-base font-bold text-neutral-900 dark:text-white">Cloud Integration Required</h2>
      <p className="text-xs text-neutral-450 dark:text-neutral-500 max-w-sm mx-auto leading-relaxed px-4">
        Firebase storage is required to host cloud data. Click the Settings icon in the header and paste your Firebase Web credentials.
      </p>
    </div>
  </div>
);

export const CloudImageForm: React.FC<CloudFormProps> = ({ onChange }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [expiryDays, setExpiryDays] = useState<'1' | '7' | '30' | 'infinite'>('1');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUser = auth?.currentUser;

  useEffect(() => {
    if (currentUser) setExpiryDays('infinite');
    else setExpiryDays('1');
  }, [currentUser]);

  if (!isFirebaseConfigured()) return <MissingFirebaseConfig />;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setUploadError('Only image uploads are supported.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('Image exceeds the 5MB size limit. Please choose a smaller file.');
        return;
      }
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
      setUploadError('');
    }
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
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('Image exceeds the 5MB size limit. Please choose a smaller file.');
        return;
      }
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
      setUploadError('');
    }
  };

  const handleUpload = async () => {
    if (!db || !selectedFile) return;
    setUploading(true);
    setUploadError('');
    setUploadProgress('Compressing & Uploading...');

    const shareId = `share-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    try {
      // Compress and convert directly to base64
      const base64Data = await compressImageBase64(selectedFile);
      
      // Check if size exceeds Firestore 1MB limit (~1.048.576 bytes)
      // Base64 string length * (3/4) gives approximate size in bytes
      const approxSizeBytes = base64Data.length * 0.75;
      if (approxSizeBytes > 900000) {
        throw new Error('Image is too complex/large even after compression. Please try a simpler image.');
      }

      let expiresAt: number | null = null;
      if (expiryDays === '1') expiresAt = Date.now() + 24 * 60 * 60 * 1000;
      else if (expiryDays === '7') expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
      else if (expiryDays === '30') expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;

      await setDoc(doc(db, 'shares', shareId), {
        id: shareId,
        type: 'image',
        content: base64Data,
        theme: null,
        creatorId: currentUser ? currentUser.uid : 'anonymous',
        createdAt: Date.now(),
        expiresAt,
        scanCount: 0,
        fileName: selectedFile.name
      });

      const publicLink = `${window.location.origin}${window.location.pathname}?share=${shareId}`;
      setGeneratedLink(publicLink);
      onChange(publicLink);
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  if (generatedLink) {
    return (
      <div className="space-y-4 border border-success/20 bg-success/5 dark:bg-success/05 p-6 rounded-2xl">
        <div className="flex items-center space-x-3 text-success">
          <div className="h-9 w-9 rounded-full bg-success/10 flex items-center justify-center border border-success/25"><Check className="w-5 h-5" /></div>
          <div><h3 className="text-sm font-bold">Image Cloud Link Generated</h3><p className="text-[10px] opacity-75">QR Code updated automatically</p></div>
        </div>
        <input type="text" readOnly value={generatedLink} className="w-full px-3.5 py-2 text-xs rounded-xl border border-success/20 bg-white/70 dark:bg-black/30" />
        <button onClick={() => { setGeneratedLink(''); setSelectedFile(null); setFilePreview(null); }} className="text-accent text-[10px] hover:underline font-bold">Upload another image</button>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-scale-in">
      <div className="space-y-3">
        <Label>Select Image File</Label>
        {filePreview ? (
          <div className="relative rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 aspect-[16/9] flex items-center justify-center">
            <img src={filePreview} alt="Preview" className="max-h-full max-w-full object-contain" />
            <button onClick={() => { setSelectedFile(null); setFilePreview(null); }} className="absolute top-3 right-3 bg-black/60 px-2 py-1 rounded-lg text-white text-[10px] font-bold">Clear</button>
          </div>
        ) : (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${dragOver ? 'border-accent bg-accent/5' : 'border-neutral-200 dark:border-neutral-850 hover:border-neutral-350 dark:hover:border-neutral-700 bg-white/20 dark:bg-black/20'}`}
          >
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
            <div className="h-12 w-12 rounded-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 flex items-center justify-center mb-3"><CloudUpload className="w-5 h-5 text-accent" /></div>
            <span className="text-xs font-bold text-neutral-800 dark:text-white">Drag and drop your image here</span>
            <span className="text-[10px] font-medium text-neutral-450 mt-1">Supports PNG, JPG, WEBP</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Link Expiry</Label>
        <div className="flex items-center space-x-2">
          <select value={expiryDays} onChange={(e) => setExpiryDays(e.target.value as any)} disabled={!currentUser} className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-black/50 text-neutral-900 dark:text-white">
            <option value="1">24 Hours (Guest limit)</option>
            {currentUser && <><option value="7">7 Days</option><option value="30">30 Days</option><option value="infinite">Permanent Link</option></>}
          </select>
          {!currentUser && (
            <div className="flex items-center space-x-1 flex-shrink-0 bg-neutral-100 dark:bg-neutral-900/60 p-2 rounded-xl text-[9px] font-bold text-neutral-400 border border-neutral-200/50 dark:border-neutral-850/50">
              <Lock className="w-3.5 h-3.5 text-amber-500 fill-current" /><span>Sign in for permanent</span>
            </div>
          )}
        </div>
      </div>

      <Button onClick={handleUpload} disabled={uploading || !selectedFile} className="w-full py-3.5 flex items-center justify-center space-x-2 shadow-lg">
        {uploading ? <span>{uploadProgress}</span> : <><CloudUpload className="w-4 h-4" /><span>Generate Image Cloud Link</span></>}
      </Button>

      {uploadError && (
        <div className="text-[11px] text-red-500 font-semibold bg-red-500/10 p-2 rounded-lg flex items-center space-x-2"><AlertCircle className="w-4 h-4" /><span>{uploadError}</span></div>
      )}
    </div>
  );
};

export const CloudNoteForm: React.FC<CloudFormProps> = ({ onChange }) => {
  const [messageText, setMessageText] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('ocean');
  const [expiryDays, setExpiryDays] = useState<'1' | '7' | '30' | 'infinite'>('1');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');

  const currentUser = auth?.currentUser;

  useEffect(() => {
    if (currentUser) setExpiryDays('infinite');
    else setExpiryDays('1');
  }, [currentUser]);

  if (!isFirebaseConfigured()) return <MissingFirebaseConfig />;

  const handleUpload = async () => {
    if (!db || !messageText.trim()) return;
    setUploading(true);
    setUploadError('');

    const shareId = `share-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    try {
      let expiresAt: number | null = null;
      if (expiryDays === '1') expiresAt = Date.now() + 24 * 60 * 60 * 1000;
      else if (expiryDays === '7') expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
      else if (expiryDays === '30') expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;

      await setDoc(doc(db, 'shares', shareId), {
        id: shareId,
        type: 'text',
        content: messageText,
        theme: selectedTheme,
        creatorId: currentUser ? currentUser.uid : 'anonymous',
        createdAt: Date.now(),
        expiresAt,
        scanCount: 0
      });

      const publicLink = `${window.location.origin}${window.location.pathname}?share=${shareId}`;
      setGeneratedLink(publicLink);
      onChange(publicLink);
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  if (generatedLink) {
    return (
      <div className="space-y-4 border border-success/20 bg-success/5 dark:bg-success/05 p-6 rounded-2xl">
        <div className="flex items-center space-x-3 text-success">
          <div className="h-9 w-9 rounded-full bg-success/10 flex items-center justify-center border border-success/25"><Check className="w-5 h-5" /></div>
          <div><h3 className="text-sm font-bold">Note Cloud Link Generated</h3><p className="text-[10px] opacity-75">QR Code updated automatically</p></div>
        </div>
        <input type="text" readOnly value={generatedLink} className="w-full px-3.5 py-2 text-xs rounded-xl border border-success/20 bg-white/70 dark:bg-black/30" />
        <button onClick={() => { setGeneratedLink(''); setMessageText(''); }} className="text-accent text-[10px] hover:underline font-bold">Write another note</button>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-scale-in">
      <div className="space-y-2">
        <Label>Write Note Message</Label>
        <textarea rows={4} value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Write a message, contact details, or instructions..." className="w-full px-4 py-2.5 text-sm rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-black/50 resize-none focus:ring-accent" />
      </div>

      <div className="space-y-2">
        <Label>Choose Note Theme</Label>
        <div className="flex space-x-3 select-none pt-0.5">
          {[
            { id: 'ocean', name: 'Ocean Blue', bg: 'bg-gradient-to-br from-blue-500 to-cyan-500' },
            { id: 'sunset', name: 'Sunset Glow', bg: 'bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500' },
            { id: 'forest', name: 'Emerald', bg: 'bg-gradient-to-br from-emerald-500 to-teal-600' },
            { id: 'cyberpunk', name: 'Cyberpunk', bg: 'bg-gradient-to-br from-fuchsia-500 via-purple-500 to-indigo-600' },
            { id: 'minimalist', name: 'Dark Mode', bg: 'bg-gradient-to-br from-neutral-800 to-neutral-950 border border-neutral-700/30' }
          ].map((theme) => (
            <button key={theme.id} onClick={() => setSelectedTheme(theme.id)} className={`relative h-9 w-9 rounded-full ${theme.bg} cursor-pointer shadow-sm hover:scale-105 active:scale-95 transition-all flex items-center justify-center`} title={theme.name}>
              {selectedTheme === theme.id && <span className="h-3 w-3 rounded-full bg-white shadow-sm animate-scale-in" />}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Link Expiry</Label>
        <div className="flex items-center space-x-2">
          <select value={expiryDays} onChange={(e) => setExpiryDays(e.target.value as any)} disabled={!currentUser} className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-black/50 text-neutral-900 dark:text-white">
            <option value="1">24 Hours (Guest limit)</option>
            {currentUser && <><option value="7">7 Days</option><option value="30">30 Days</option><option value="infinite">Permanent Link</option></>}
          </select>
          {!currentUser && (
            <div className="flex items-center space-x-1 flex-shrink-0 bg-neutral-100 dark:bg-neutral-900/60 p-2 rounded-xl text-[9px] font-bold text-neutral-400 border border-neutral-200/50 dark:border-neutral-850/50">
              <Lock className="w-3.5 h-3.5 text-amber-500 fill-current" /><span>Sign in for permanent</span>
            </div>
          )}
        </div>
      </div>

      <Button onClick={handleUpload} disabled={uploading || !messageText.trim()} className="w-full py-3.5 flex items-center justify-center space-x-2 shadow-lg">
        {uploading ? <span>Uploading...</span> : <><CloudUpload className="w-4 h-4" /><span>Generate Note Cloud Link</span></>}
      </Button>

      {uploadError && (
        <div className="text-[11px] text-red-500 font-semibold bg-red-500/10 p-2 rounded-lg flex items-center space-x-2"><AlertCircle className="w-4 h-4" /><span>{uploadError}</span></div>
      )}
    </div>
  );
};
