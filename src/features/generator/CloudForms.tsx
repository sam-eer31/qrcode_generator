import React, { useState, useRef, useEffect } from 'react';
import { 
  AlertCircle, 
  Check, 
  Lock,
  Copy,
  Download,
  Share,
  CloudUpload
} from 'lucide-react';
import QRCode from 'qrcode';
import { supabase } from '../../utils/supabase';
import { Button } from '../../components/ui/Button';
import { Label } from '../../components/ui/Input';
import { RichTextEditor } from '../../components/ui/RichTextEditor';
import { readFileAsArrayBufferWithRetry, readFileAsDataURLWithRetry } from '../../utils/fileUtils';

interface CloudFormProps {
  onChange: (link: string) => void;
}

const SuccessView = ({ title, link, onReset, resetText }: { title: string, link: string, onReset: () => void, resetText: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && link) {
      QRCode.toCanvas(canvasRef.current, link, {
        width: 140,
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' }
      });
    }
  }, [link]);

  const handleDownload = () => {
    if (canvasRef.current) {
      const url = canvasRef.current.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = "qr-studio-cloud-link.png";
      a.click();
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Cloud QR Code',
          text: 'Check out my cloud link!',
          url: link
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(link);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="space-y-5 border border-success/20 bg-success/5 dark:bg-success/5 p-6 md:p-8 rounded-3xl relative overflow-hidden animate-scale-in shadow-inner">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-success/10 rounded-full blur-2xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
      
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
        {/* Left Side: Mini QR Preview */}
        <div className="flex-shrink-0 bg-white p-2 rounded-2xl shadow-sm border border-neutral-200">
          <canvas ref={canvasRef} className="rounded-xl" />
        </div>

        {/* Right Side: Details and Actions */}
        <div className="flex-1 space-y-4 w-full text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center border border-success/25 flex-shrink-0 text-success">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-neutral-900 dark:text-white">{title}</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Your link is live and embedded in the QR Code.</p>
            </div>
          </div>

          <div className="relative group max-w-sm mx-auto sm:mx-0">
            <input type="text" readOnly value={link} className="w-full pl-3 pr-10 py-2.5 text-xs rounded-xl border border-success/20 bg-white/70 dark:bg-black/30 text-neutral-600 dark:text-neutral-400 focus:outline-none" />
            <button onClick={() => navigator.clipboard.writeText(link)} className="absolute right-2 top-1/2 -translate-y-1/2 text-success hover:text-success/80 p-1.5 bg-success/10 rounded-lg transition-colors" title="Copy Link">
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-2 justify-center sm:justify-start">
            <Button onClick={handleDownload} className="flex-1 min-w-[140px] py-2.5 text-xs font-bold" variant="primary">
              <Download className="w-3.5 h-3.5 mr-1.5 inline" />
              Download PNG
            </Button>
            <Button onClick={handleShare} className="flex-1 min-w-[140px] py-2.5 text-xs font-bold bg-neutral-900 text-white dark:bg-white dark:text-black hover:opacity-90">
              <Share className="w-3.5 h-3.5 mr-1.5 inline" />
              Share Link
            </Button>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-success/10 flex flex-col sm:flex-row items-center justify-between text-[10px] gap-3 text-center sm:text-left">
        <button onClick={onReset} className="text-accent hover:underline font-bold">
          {resetText}
        </button>
        <span className="text-neutral-450 dark:text-neutral-500 flex items-center justify-center">
          <Lock className="w-3 h-3 mr-1" />
          Manage links in Cloud Dashboard (Top Right Menu)
        </span>
      </div>
    </div>
  );
};



export const CloudImageForm: React.FC<CloudFormProps> = ({ onChange }) => {
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: number } | null>(null);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [expiryDays, setExpiryDays] = useState<'1' | '7' | '30' | 'infinite'>('1');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUserId(session?.user?.id || null);
        if (session?.user) {
          setExpiryDays('infinite');
        } else {
          setExpiryDays('1');
        }
      });
    }
  }, []);



  const processFileImmediately = async (file: File) => {
    if (file.type === 'image/heic' || file.type === 'image/heif') {
      setUploadError('HEIC format is not supported by browsers. Please convert to JPG/PNG, or change your phone camera settings to "Most Compatible".');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setUploadError('Only image uploads are supported.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image exceeds the 10MB size limit. Please choose a smaller file.');
      return;
    }

    setUploadProgress('Reading file from device...');
    setUploading(true);
    setUploadError('');

    try {
      const arrayBuffer = await readFileAsArrayBufferWithRetry(file);

      // Create a completely new memory-backed File object from the ArrayBuffer.
      // This ensures the OS content resolver is no longer needed and resolves mobile access bugs.
      const stableBlob = new Blob([arrayBuffer], { type: file.type });
      const stableFile = new File([stableBlob], file.name, { type: file.type });

      // Generate local preview using retry reader
      const dataUrl = await readFileAsDataURLWithRetry(stableFile);
      
      setSelectedFile({ name: file.name, size: file.size });
      setRawFile(stableFile);
      setFilePreview(dataUrl);
      setUploadError('');
    } catch (err: any) {
      console.error('File processing error:', err);
      setUploadError(err.message || 'Failed to process image');
      setSelectedFile(null);
      setRawFile(null);
      setFilePreview(null);
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      processFileImmediately(file);
      e.target.value = ''; // Reset the input value so the same file can be selected again
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      processFileImmediately(file);
    }
  };

  const handleUpload = async () => {
    if (!supabase || !rawFile || !selectedFile) return;
    setUploading(true);
    setUploadError('');
    setUploadProgress('Uploading to Storage...');

    const shareId = `share-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    
    try {
      // 1. Upload to Supabase Storage Bucket (Uncompressed to keep 100% quality)
      const fileExt = rawFile.name.split('.').pop() || 'jpg';
      const storagePath = `${shareId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadErr } = await supabase!.storage
        .from('shares')
        .upload(storagePath, rawFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadErr) {
        throw new Error(uploadErr.message || 'Storage upload failed.');
      }

      setUploadProgress('Saving metadata...');

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase!.storage
        .from('shares')
        .getPublicUrl(storagePath);

      // 3. Save metadata record to Database
      let expiresAt: number | null = null;
      if (expiryDays === '1') expiresAt = Date.now() + 24 * 60 * 60 * 1000;
      else if (expiryDays === '7') expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
      else if (expiryDays === '30') expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;

      const { error: dbError } = await (supabase!.from('shares') as any)
        .insert({
          id: shareId,
          type: 'image',
          content: publicUrl,
          theme: null,
          creator_id: userId || 'anonymous',
          created_at: Date.now(),
          expires_at: expiresAt,
          scan_count: 0,
          file_name: selectedFile.name
        });

      if (dbError) {
        // Attempt to clean up uploaded file on database failure
        await supabase!.storage.from('shares').remove([storagePath]);
        throw new Error(dbError.message || 'Database insert failed.');
      }

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
      <SuccessView 
        title="Image Cloud Link Generated"
        link={generatedLink}
        resetText="Upload another image"
        onReset={() => {
          setGeneratedLink('');
          setSelectedFile(null);
          setRawFile(null);
          setFilePreview(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-5 animate-scale-in">
      <div className="space-y-3">
        <Label>Select Image File</Label>
        <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
        {filePreview ? (
          <div className="relative rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 aspect-[16/9] flex items-center justify-center">
            <img src={filePreview} alt="Preview" className="max-h-full max-w-full object-contain" />
            <button onClick={() => { setSelectedFile(null); setRawFile(null); setFilePreview(null); }} className="absolute top-3 right-3 bg-black/60 px-2 py-1 rounded-lg text-white text-[10px] font-bold">Clear</button>
          </div>
        ) : (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${dragOver ? 'border-accent bg-accent/5' : 'border-neutral-200 dark:border-neutral-850 hover:border-neutral-350 dark:hover:border-neutral-700 bg-white/20 dark:bg-black/20'}`}
          >
            <div className="h-12 w-12 rounded-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 flex items-center justify-center mb-3"><CloudUpload className="w-5 h-5 text-accent" /></div>
            <span className="text-xs font-bold text-neutral-800 dark:text-white">Drag and drop your image here</span>
            <span className="text-[10px] font-medium text-neutral-450 mt-1">Supports PNG, JPG, WEBP</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Link Expiry</Label>
        <div className="flex items-center space-x-2">
          <select value={expiryDays} onChange={(e) => setExpiryDays(e.target.value as any)} disabled={!userId} className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-black/50 text-neutral-900 dark:text-white">
            <option value="1">24 Hours (Guest limit)</option>
            {userId && <><option value="7">7 Days</option><option value="30">30 Days</option><option value="infinite">Permanent Link</option></>}
          </select>
          {!userId && (
            <div className="flex items-center space-x-1 flex-shrink-0 bg-neutral-100 dark:bg-neutral-900/60 p-2 rounded-xl text-[9px] font-bold text-neutral-400 border border-neutral-200/50 dark:border-neutral-850/50">
              <Lock className="w-3.5 h-3.5 text-amber-500 fill-current" /><span>Sign in for permanent</span>
            </div>
          )}
        </div>
      </div>

      <Button onClick={handleUpload} disabled={uploading || !rawFile} className="w-full py-3.5 flex items-center justify-center space-x-2 shadow-lg">
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
  const [selectedTheme, setSelectedTheme] = useState('light');
  const [selectedPattern, setSelectedPattern] = useState<'plain' | 'dots' | 'lines'>('dots');
  const [expiryDays, setExpiryDays] = useState<'1' | '7' | '30' | 'infinite'>('1');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');

  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUserId(session?.user?.id || null);
        if (session?.user) {
          setExpiryDays('infinite');
        } else {
          setExpiryDays('1');
        }
      });
    }
  }, []);



  const handleUpload = async () => {
    if (!supabase || !messageText.trim()) return;
    setUploading(true);
    setUploadError('');

    const shareId = `share-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    try {
      let expiresAt: number | null = null;
      if (expiryDays === '1') expiresAt = Date.now() + 24 * 60 * 60 * 1000;
      else if (expiryDays === '7') expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
      else if (expiryDays === '30') expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;

      const { error: dbError } = await (supabase!.from('shares') as any)
        .insert({
          id: shareId,
          type: 'text',
          content: messageText,
          theme: selectedTheme,
          bg_pattern: selectedPattern,
          creator_id: userId || 'anonymous',
          created_at: Date.now(),
          expires_at: expiresAt,
          scan_count: 0
        });

      if (dbError) {
        throw new Error(dbError.message || 'Database insert failed.');
      }

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
      <SuccessView 
        title="Note Cloud Link Generated"
        link={generatedLink}
        resetText="Write another note"
        onReset={() => {
          setGeneratedLink('');
          setMessageText('');
        }}
      />
    );
  }

  const NOTE_THEMES = [
    { id: 'light', name: 'Clean White', bg: 'bg-white border border-neutral-200 dark:border-neutral-800', text: 'text-neutral-900 placeholder:text-neutral-400', texture: 'invert opacity-[0.05]' },
    { id: 'ocean', name: 'Ocean Blue', bg: 'bg-gradient-to-br from-blue-500 to-cyan-500', text: 'text-white placeholder:text-white/60' },
    { id: 'sunset', name: 'Sunset Glow', bg: 'bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500', text: 'text-white placeholder:text-white/60' },
    { id: 'forest', name: 'Emerald', bg: 'bg-gradient-to-br from-emerald-500 to-teal-600', text: 'text-white placeholder:text-white/60' },
    { id: 'cyberpunk', name: 'Cyberpunk', bg: 'bg-gradient-to-br from-fuchsia-500 via-purple-500 to-indigo-600', text: 'text-white placeholder:text-white/60' },
    { id: 'minimalist', name: 'Dark Mode', bg: 'bg-neutral-900 border border-neutral-800', text: 'text-neutral-100 placeholder:text-neutral-500', texture: 'opacity-20' }
  ];

  const activeThemeObj = NOTE_THEMES.find(t => t.id === selectedTheme) || NOTE_THEMES[0];

  return (
    <div className="space-y-6 animate-scale-in">
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-1">
          <Label>Live Notepad</Label>
          <div className="flex space-x-2 select-none">
            {NOTE_THEMES.map((theme) => (
              <button key={theme.id} onClick={() => setSelectedTheme(theme.id)} className={`relative h-6 w-6 rounded-full ${theme.bg} cursor-pointer shadow-sm hover:scale-110 active:scale-95 transition-all flex items-center justify-center`} title={theme.name}>
                {selectedTheme === theme.id && <span className="h-2 w-2 rounded-full bg-white shadow-sm animate-scale-in" />}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2 mb-2">
          {(['plain', 'dots', 'lines'] as const).map((pattern) => (
            <button
              key={pattern}
              onClick={() => setSelectedPattern(pattern)}
              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors border ${
                selectedPattern === pattern 
                  ? 'bg-neutral-800 text-white border-neutral-800 dark:bg-white dark:text-black dark:border-white' 
                  : 'bg-transparent text-neutral-500 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900'
              }`}
            >
              {pattern}
            </button>
          ))}
        </div>

        <RichTextEditor 
          value={messageText}
          onChange={setMessageText}
          className={activeThemeObj.bg}
          textColorClass={activeThemeObj.text}
          textureClass={activeThemeObj.texture}
          bgPattern={selectedPattern}
          placeholder="Start typing your note here..."
        />
      </div>

      <div className="space-y-2">
        <Label>Link Expiry</Label>
        <div className="flex items-center space-x-2">
          <select value={expiryDays} onChange={(e) => setExpiryDays(e.target.value as any)} disabled={!userId} className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-black/50 text-neutral-900 dark:text-white">
            <option value="1">24 Hours (Guest limit)</option>
            {userId && <><option value="7">7 Days</option><option value="30">30 Days</option><option value="infinite">Permanent Link</option></>}
          </select>
          {!userId && (
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
