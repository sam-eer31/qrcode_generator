import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  Copy, 
  Clock, 
  Compass, 
  AlertCircle, 
  ExternalLink,
  Eye,
  Check,
  Calendar,
  FileText as FileIcon
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../utils/supabase';
import { Button } from '../../components/ui/Button';
import DOMPurify from 'dompurify';

// Gradient mappings for the message templates
export const THEME_GRADIENTS: Record<string, { bg: string; text: string; shadow: string; border: string; texture: string }> = {
  light: {
    bg: '#ffffff',
    text: 'text-neutral-900',
    shadow: 'shadow-neutral-200/50',
    border: 'border-neutral-200',
    texture: 'opacity-10'
  },
  ocean: {
    bg: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
    text: 'text-white',
    shadow: 'shadow-blue-500/20',
    border: 'border-blue-400/30',
    texture: 'opacity-20'
  },
  sunset: {
    bg: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 50%, #e11d48 100%)',
    text: 'text-white',
    shadow: 'shadow-orange-500/20',
    border: 'border-orange-400/30',
    texture: 'opacity-20'
  },
  forest: {
    bg: 'linear-gradient(135deg, #10b981 0%, #0d9488 100%)',
    text: 'text-white',
    shadow: 'shadow-emerald-500/20',
    border: 'border-emerald-400/30',
    texture: 'opacity-20'
  },
  cyberpunk: {
    bg: 'linear-gradient(135deg, #d946ef 0%, #8b5cf6 50%, #4338ca 100%)',
    text: 'text-white',
    shadow: 'shadow-purple-500/20',
    border: 'border-purple-400/30',
    texture: 'opacity-20'
  },
  minimalist: {
    bg: 'linear-gradient(135deg, #262626 0%, #0a0a0a 100%)',
    text: 'text-white',
    shadow: 'shadow-black/40',
    border: 'border-neutral-800',
    texture: 'opacity-20'
  }
};

interface ShareData {
  id: string;
  type: 'image' | 'text';
  content: string;
  theme?: string;
  bgPattern?: 'plain' | 'dots' | 'lines';
  creatorId: string;
  createdAt: number;
  expiresAt: number | null;
  scanCount: number;
  fileName?: string;
}

interface PublicShareViewerProps {
  shareId: string;
}

export const PublicShareViewer: React.FC<PublicShareViewerProps> = ({ shareId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<'not_configured' | 'not_found' | 'expired' | 'generic' | null>(null);
  const [data, setData] = useState<ShareData | null>(null);
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      setError('not_configured');
      setLoading(false);
      return;
    }

    const fetchShareData = async () => {
      const client = supabase;
      if (!client) return;
      try {
        const { data: shareItem, error: fetchError } = await (client
          .from('shares') as any)
          .select('*')
          .eq('id', shareId)
          .single();

        if (fetchError || !shareItem) {
          setError('not_found');
          setLoading(false);
          return;
        }

        // Expiry check
        if (shareItem.expires_at && Date.now() > shareItem.expires_at) {
          setError('expired');
          setLoading(false);
          return;
        }

        const mappedData: ShareData = {
          id: shareItem.id,
          type: shareItem.type,
          content: shareItem.content,
          theme: shareItem.theme || undefined,
          bgPattern: shareItem.bg_pattern || undefined,
          creatorId: shareItem.creator_id,
          createdAt: shareItem.created_at,
          expiresAt: shareItem.expires_at,
          scanCount: shareItem.scan_count || 0,
          fileName: shareItem.file_name || undefined
        };

        setData(mappedData);
        setLoading(false);

        // Increment scan count once per load in background
        try {
          await (client
            .from('shares') as any)
            .update({ scan_count: (shareItem.scan_count || 0) + 1 })
            .eq('id', shareId);
        } catch (err) {
          console.warn('Could not increment scan count:', err);
        }

      } catch (err) {
        console.error('Error fetching share item:', err);
        setError('generic');
        setLoading(false);
      }
    };

    fetchShareData();
  }, [shareId]);

  const handleCopyText = () => {
    if (data?.content) {
      navigator.clipboard.writeText(data.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadImage = async () => {
    if (!data || data.type !== 'image') return;
    try {
      const response = await fetch(data.content);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = data.fileName || 'shared-image.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Could not download image:', err);
      // Fallback: Open in new tab
      window.open(data.content, '_blank');
    }
  };

  const handleGoHome = () => {
    // Clear url query params to show main app
    window.history.pushState({}, '', window.location.pathname);
    window.location.reload();
  };

  const renderContentCard = () => {
    if (!data) return null;

    if (data.type === 'image') {
      return (
        <div className="space-y-4">
          <div 
            onClick={() => setIsFullscreen(true)}
            className="group relative cursor-zoom-in rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 aspect-[4/3] flex items-center justify-center shadow-premium dark:shadow-premium-dark"
          >
            <img 
              src={data.content} 
              alt="Shared Cloud Content" 
              className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-102"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
              <Eye className="w-5 h-5 text-white animate-pulse" />
              <span className="text-xs font-semibold text-white">Click to view full size</span>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={handleDownloadImage}
              className="flex-1 py-3 flex items-center justify-center space-x-2 text-xs shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>Download Image</span>
            </Button>
            <Button
              onClick={() => window.open(data.content, '_blank')}
              variant="outline"
              className="px-4 py-3 flex items-center justify-center space-x-2 text-xs border-neutral-200 dark:border-neutral-850 hover:bg-neutral-150 dark:hover:bg-neutral-900"
            >
              <ExternalLink className="w-4 h-4 text-neutral-500" />
            </Button>
          </div>
        </div>
      );
    } else {
      // Text/Message Card
      const themeGradient = THEME_GRADIENTS[data.theme || 'minimalist'] || THEME_GRADIENTS.minimalist;
      
      return (
        <div className="space-y-4">
          <div 
            style={{ background: themeGradient.bg }}
            className={`relative rounded-3xl p-8 border ${themeGradient.border} shadow-glass ${themeGradient.shadow} flex flex-col justify-between min-h-[200px] overflow-hidden ${themeGradient.text}`}
          >
            {/* Dynamic Pattern Overlay */}
            {(!data.bgPattern || data.bgPattern === 'dots') && (
              <div className={`absolute inset-0 pattern-dots pointer-events-none z-0 ${themeGradient.texture}`} />
            )}
            {data.bgPattern === 'lines' && (
              <div 
                className={`absolute inset-0 pattern-lines pointer-events-none z-0 ${themeGradient.texture}`}
                style={{ '--pattern-offset': '32px' } as React.CSSProperties}
              />
            )}

            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
            <div className={`relative z-10 tiptap-editor ${data.bgPattern === 'lines' ? 'pattern-lines-active' : ''}`}>
              <div 
                className={`tiptap text-base md:text-lg font-medium tracking-wide leading-relaxed whitespace-pre-wrap select-all font-sans break-words ${themeGradient.text}`}
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(data.content) }}
              />
            </div>
          </div>

          <div className="flex justify-between items-center px-1 text-[10px] uppercase font-bold tracking-wider text-neutral-400 dark:text-neutral-500 select-none">
            <span className="flex items-center">
              <FileIcon className="w-3.5 h-3.5 mr-1.5" />
              Message Note
            </span>
            <span>QR Studio Cloud</span>
          </div>

          <Button
            onClick={handleCopyText}
            variant="secondary"
            className="w-full py-3 flex items-center justify-center space-x-2 text-xs shadow-md border-neutral-255 dark:border-neutral-850"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-success" />
                <span className="text-success">Message Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-accent" />
                <span>Copy Message to Clipboard</span>
              </>
            )}
          </Button>
        </div>
      );
    }
  };

  const getExpiryText = () => {
    if (!data?.expiresAt) return 'Permanent Link';
    const remainingMs = data.expiresAt - Date.now();
    if (remainingMs <= 0) return 'Expired';
    
    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
    if (hours > 24) {
      const days = Math.ceil(hours / 24);
      return `Expires in ${days} ${days === 1 ? 'day' : 'days'}`;
    }
    if (hours >= 1) {
      return `Expires in ${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    }
    const minutes = Math.max(1, Math.floor(remainingMs / (1000 * 60)));
    return `Expires in ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
  };

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark flex flex-col items-center justify-center p-4 md:p-8 select-none transition-colors duration-300 relative overflow-hidden bg-dot-grid">
      
      {/* Background Decorative Blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-72 h-72 rounded-full bg-purple-500/5 blur-3xl pointer-events-none" />

      {/* Main Landing Glass Container */}
      <div className="w-full max-w-xl bg-white/60 dark:bg-[#0C0C0C]/60 backdrop-blur-xl border border-neutral-200 dark:border-white/5 rounded-3xl p-6 md:p-8 shadow-glass dark:shadow-glass-dark relative z-10 animate-fade-in space-y-6">
        
        {/* Header Branding */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-900">
          <div className="flex items-center space-x-2.5">
            <img src="/icon.svg" alt="QR Studio Icon" className="h-7 w-7 object-contain" />
            <div>
              <h1 className="text-xs font-black tracking-wide uppercase font-sans">QR Studio</h1>
              <span className="text-[8px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Cloud Share Portal</span>
            </div>
          </div>
          <button
            onClick={handleGoHome}
            className="flex items-center space-x-1 text-[10px] font-bold text-accent hover:text-accent-hover transition-colors"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Create QR Toolkit</span>
          </button>
        </div>

        {/* Dynamic State Layout */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <div className="relative flex items-center justify-center">
              <div className="h-12 w-12 rounded-full border-3 border-accent/20 border-t-accent animate-spin" />
              <div className="absolute h-6 w-6 rounded-full bg-accent/10 animate-ping" />
            </div>
            <p className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest animate-pulse">
              Retrieving Cloud Link...
            </p>
          </div>
        ) : error ? (
          <div className="py-8 text-center space-y-5">
            <div className="h-14 w-14 mx-auto rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-500 animate-bounce">
              <AlertCircle className="w-7 h-7" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                {error === 'not_configured' && 'Cloud Connection Pending'}
                {error === 'expired' && 'Shared Link Expired'}
                {error === 'not_found' && 'Link Not Found'}
                {error === 'generic' && 'Unable to Load Link'}
              </h2>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed">
                {error === 'not_configured' && 'This QR Toolkit instance needs Supabase setup in the application settings menu to access cloud resources.'}
                {error === 'expired' && 'Guest files automatically expire and self-destruct 24 hours after upload. Register for a free account to get permanent links.'}
                {error === 'not_found' && 'The requested share link does not exist or was deleted by the creator.'}
                {error === 'generic' && 'A network error occurred while accessing the database. Please check your connection.'}
              </p>
            </div>

            <Button
              onClick={handleGoHome}
              className="py-2.5 px-6 text-xs mx-auto flex items-center justify-center space-x-2"
            >
              <span>Back to QR Studio Creator</span>
            </Button>
          </div>
        ) : (
          /* Normal Renders */
          <div className="space-y-5">
            {/* Meta Tags Row */}
            <div className="flex flex-wrap gap-2 text-[10px] font-bold text-neutral-450 dark:text-neutral-500 uppercase tracking-wider select-none">
              <div className="flex items-center bg-neutral-100 dark:bg-neutral-900/60 p-1.5 px-2.5 rounded-lg border border-neutral-200/40 dark:border-neutral-850/50">
                <Clock className="w-3.5 h-3.5 mr-1 text-accent" />
                <span>{getExpiryText()}</span>
              </div>
              <div className="flex items-center bg-neutral-100 dark:bg-neutral-900/60 p-1.5 px-2.5 rounded-lg border border-neutral-200/40 dark:border-neutral-850/50">
                <Eye className="w-3.5 h-3.5 mr-1 text-neutral-450 dark:text-neutral-500" />
                <span>{data?.scanCount} Scans</span>
              </div>
              <div className="flex items-center bg-neutral-100 dark:bg-neutral-900/60 p-1.5 px-2.5 rounded-lg border border-neutral-200/40 dark:border-neutral-850/50">
                <Calendar className="w-3.5 h-3.5 mr-1 text-neutral-400" />
                <span>
                  {data?.createdAt ? new Date(data.createdAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) : ''}
                </span>
              </div>
            </div>

            {/* Core Card Content */}
            {renderContentCard()}
          </div>
        )}

        {/* Footer Brand CTA */}
        <div className="border-t border-neutral-200 dark:border-neutral-900 pt-5 text-center">
          <p className="text-[10px] text-neutral-400 select-none">
            Hosted securely on QR Studio Cloud. Build and customize branded QR codes for free.
          </p>
        </div>
      </div>

      {/* Lightbox Overlay for Image */}
      <AnimatePresence>
        {isFullscreen && data && data.type === 'image' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsFullscreen(false)}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
          >
            <motion.img 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              src={data.content} 
              alt="Shared Fullscreen Preview" 
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <div className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 p-2 rounded-full text-white cursor-pointer transition-colors">
              <span className="text-xs font-black px-1">✕</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
