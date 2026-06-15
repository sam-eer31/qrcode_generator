import React, { useState, useEffect, useRef } from 'react';
import { 
  Trash2, 
  Eye, 
  Copy, 
  Check, 
  Sparkles, 
  FileText as FileIcon, 
  Image as ImageIcon,
  BarChart3,
  Calendar,
  Download,
  Share,
  ArrowLeft
} from 'lucide-react';
import QRCode from 'qrcode';
import { supabase } from '../../utils/supabase';

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

interface CloudDashboardProps {}

export const CloudDashboard: React.FC<CloudDashboardProps> = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ShareData[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ShareData | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ShareData | null>(null);

  const getPreviewText = (html: string) => {
    try {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      return doc.body.textContent || 'Cloud Note';
    } catch {
      return 'Cloud Note';
    }
  };

  const fetchUserItems = async (userId: string) => {
    const client = supabase;
    if (!client || !userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await (client.from('shares') as any)
        .select('*')
        .eq('creator_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const fetchedItems: ShareData[] = (data || []).map((item: any) => ({
        id: item.id,
        type: item.type,
        content: item.content,
        theme: item.theme || undefined,
        bgPattern: item.bg_pattern || undefined,
        creatorId: item.creator_id,
        createdAt: item.created_at,
        expiresAt: item.expires_at,
        scanCount: item.scan_count || 0,
        fileName: item.file_name || undefined
      }));

      setItems(fetchedItems);
    } catch (err) {
      console.error('Error fetching user shared links:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!supabase) return;
    
    // Initial fetch
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserItems(session.user.id);
      } else {
        setItems([]);
        setLoading(false);
      }
    });

    // Listen to changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserItems(session.user.id);
      } else {
        setItems([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleCopyLink = (itemId: string) => {
    const link = `${window.location.origin}${window.location.pathname}?share=${itemId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(itemId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteItem = (item: ShareData) => {
    setItemToDelete(item);
  };

  const executeDelete = async (item: ShareData) => {
    const client = supabase;
    if (!client) return;
    
    setDeletingId(item.id);

    try {
      // 1. If it's an image, delete it from the Supabase Storage Bucket
      if (item.type === 'image') {
        const sharesMarker = '/shares/';
        const markerIndex = item.content.indexOf(sharesMarker);
        if (markerIndex !== -1) {
          const storagePath = decodeURIComponent(item.content.substring(markerIndex + sharesMarker.length));
          await client.storage.from('shares').remove([storagePath]);
        }
      }

      // 2. Delete document from Database Table
      const { error: dbError } = await (client.from('shares') as any)
        .delete()
        .eq('id', item.id);

      if (dbError) throw dbError;

      // 3. Remove from local state
      setItems(prev => prev.filter(i => i.id !== item.id));
      if (selectedItem?.id === item.id) {
        setSelectedItem(null);
      }
      setItemToDelete(null);
    } catch (err) {
      console.error('Error deleting shared link:', err);
      // Fallback alert just in case of severe error
      alert('Failed to delete item. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const getExpiryLabel = (expiresAt: number | null) => {
    if (!expiresAt) return <span className="text-success text-[9px] font-bold uppercase tracking-wider bg-success/10 px-2 py-0.5 rounded-md">Permanent</span>;
    
    const remaining = expiresAt - Date.now();
    if (remaining <= 0) {
      return <span className="text-red-500 text-[9px] font-bold uppercase tracking-wider bg-red-500/10 px-2 py-0.5 rounded-md">Expired</span>;
    }

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    if (hours > 24) {
      const days = Math.ceil(hours / 24);
      return <span className="text-accent text-[9px] font-bold uppercase tracking-wider bg-accent/10 px-2 py-0.5 rounded-md">Expires in {days}d</span>;
    }
    return <span className="text-accent text-[9px] font-bold uppercase tracking-wider bg-accent/10 px-2 py-0.5 rounded-md">Expires in {hours}h</span>;
  };

  const totalScans = items.reduce((acc, curr) => acc + (curr.scanCount || 0), 0);

  const CloudDetailView = ({ 
    item, 
    onBack, 
    onDelete, 
    deletingId,
    getExpiryLabel 
  }: { 
    item: ShareData, 
    onBack: () => void, 
    onDelete: (item: ShareData) => void, 
    deletingId: string | null,
    getExpiryLabel: (e: number | null) => React.ReactNode
  }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const link = `${window.location.origin}${window.location.pathname}?share=${item.id}`;
    const [copied, setCopied] = useState(false);
  
    useEffect(() => {
      if (canvasRef.current) {
        QRCode.toCanvas(canvasRef.current, link, {
          width: 200,
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
        a.download = `qr-studio-${item.id}.png`;
        a.click();
      }
    };
  
    const handleShare = async () => {
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'My Cloud QR Code',
            url: link
          });
        } catch (err) {}
      } else {
        handleCopy();
      }
    };
  
    const handleCopy = () => {
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
  
    return (
      <div className="animate-fade-in space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-900">
          <div className="flex items-center space-x-3">
            <button onClick={onBack} className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors">
              <ArrowLeft className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
            </button>
            <h3 className="text-sm font-black text-neutral-900 dark:text-white">Link Details</h3>
          </div>
          <button
            onClick={() => onDelete(item)}
            disabled={deletingId === item.id}
            className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
            title="Delete Link"
          >
            {deletingId === item.id ? <div className="h-4 w-4 rounded-full border-2 border-red-500/20 border-t-red-500 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </button>
        </div>
  
        <div className="flex flex-col sm:flex-row gap-6">
          {/* QR Code Container */}
          <div className="flex-shrink-0 bg-white p-3 rounded-3xl shadow-premium border border-neutral-200 dark:border-neutral-800 mx-auto sm:mx-0">
            <canvas ref={canvasRef} className="rounded-2xl" />
          </div>
  
          {/* Info & Actions */}
          <div className="flex-1 space-y-5">
            <div>
              <h4 className="text-base font-black text-neutral-900 dark:text-white truncate">
                {item.type === 'image' ? (item.fileName || 'Shared Image') : getPreviewText(item.content)}
              </h4>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] font-bold text-neutral-400 select-none uppercase tracking-wider">
                <span className="flex items-center bg-neutral-100 dark:bg-neutral-900 px-2 py-1 rounded-lg">
                  <Eye className="w-3.5 h-3.5 mr-1" />
                  {item.scanCount || 0} Scans
                </span>
                <span className="flex items-center bg-neutral-100 dark:bg-neutral-900 px-2 py-1 rounded-lg">
                  <Calendar className="w-3.5 h-3.5 mr-1" />
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
                {getExpiryLabel(item.expiresAt)}
              </div>
            </div>
  
            <div className="relative">
              <input type="text" readOnly value={link} className="w-full pl-4 pr-12 py-3 text-xs font-medium rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 focus:outline-none" />
              <button onClick={handleCopy} className="absolute right-2 top-1/2 -translate-y-1/2 text-accent hover:text-accent/80 p-2 bg-accent/10 rounded-lg transition-colors" title="Copy Link">
                {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
  
            <div className="flex flex-wrap gap-2 pt-2">
              <button onClick={handleDownload} className="flex-1 min-w-[140px] py-3 text-xs font-bold rounded-xl bg-accent text-white hover:bg-accent/90 transition-colors flex items-center justify-center">
                <Download className="w-4 h-4 mr-1.5" />
                Download PNG
              </button>
              <button onClick={handleShare} className="flex-1 min-w-[140px] py-3 text-xs font-bold rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-black hover:opacity-90 transition-colors flex items-center justify-center">
                <Share className="w-4 h-4 mr-1.5" />
                Share Link
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in select-none relative">
      
      {/* Dashboard Top Header Navigation */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-900">
        <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400">
          Your Cloud Links
        </h3>
      </div>

      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center space-y-3">
          <div className="h-9 w-9 rounded-full border-3 border-accent/20 border-t-accent animate-spin" />
          <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold animate-pulse">Loading links dashboard...</p>
        </div>
      ) : selectedItem ? (
        <CloudDetailView 
          item={selectedItem}
          onBack={() => setSelectedItem(null)}
          onDelete={(item) => {
            handleDeleteItem(item);
          }}
          deletingId={deletingId}
          getExpiryLabel={getExpiryLabel}
        />
      ) : (
        <div className="space-y-6">
          
          {/* Quick Metrics Dashboard Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-50/50 dark:bg-neutral-950/20 border border-neutral-200 dark:border-neutral-900 rounded-2xl p-4">
            <div className="flex items-center space-x-3.5">
              <div className="h-10 w-10 bg-accent/10 border border-accent/25 rounded-xl flex items-center justify-center text-accent">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] font-bold text-neutral-450 uppercase tracking-wider block">Aggregate Scans</span>
                <span className="text-lg font-black text-neutral-800 dark:text-white block leading-tight mt-0.5">{totalScans} scans</span>
              </div>
            </div>
            <div className="flex items-center space-x-3.5">
              <div className="h-10 w-10 bg-purple-500/10 border border-purple-500/25 rounded-xl flex items-center justify-center text-purple-500">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] font-bold text-neutral-450 uppercase tracking-wider block">Hosted Links</span>
                <span className="text-lg font-black text-neutral-800 dark:text-white block leading-tight mt-0.5">{items.length} items</span>
              </div>
            </div>
          </div>

          {/* User Shared Items List */}
          {items.length === 0 ? (
            <div className="border border-dashed border-neutral-200 dark:border-neutral-850 rounded-2xl p-10 text-center space-y-3 bg-white/10 dark:bg-black/10">
              <ImageIcon className="w-10 h-10 mx-auto text-neutral-400 opacity-40 animate-pulse" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-neutral-800 dark:text-white">No active hosted links</h4>
                <p className="text-[10px] text-neutral-400 max-w-[240px] mx-auto leading-normal">
                  Your uploaded images and notes will appear here. Go back and generate your first cloud link.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto pr-1">
              {items.map((item) => (
                <div 
                  key={item.id}
                  className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-white dark:bg-[#0E0E0E] border border-neutral-200 dark:border-neutral-900 rounded-2xl hover:border-neutral-350 dark:hover:border-neutral-800 transition-all shadow-premium dark:shadow-premium-dark select-none gap-3 sm:gap-0"
                >
                  <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                    {/* Thumbnail / Icon Indicator */}
                    <div className="h-12 w-12 sm:h-11 sm:w-11 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-850 flex-shrink-0 overflow-hidden flex items-center justify-center">
                      {item.type === 'image' ? (
                        <img 
                          src={item.content} 
                          alt="Thumbnail preview" 
                          className="h-full w-full object-cover object-center" 
                        />
                      ) : (
                        <FileIcon className="w-5 h-5 text-accent" />
                      )}
                    </div>

                    {/* Metadata column */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm sm:text-xs font-bold text-neutral-800 dark:text-white truncate">
                          {item.type === 'image' ? (item.fileName || 'Shared Image') : getPreviewText(item.content)}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[9px] font-bold text-neutral-400 select-none uppercase tracking-wider">
                        <span className="flex items-center bg-neutral-100 dark:bg-neutral-900 px-1.5 py-0.5 rounded-md">
                          <Eye className="w-3 h-3 mr-1 text-neutral-400" />
                          {item.scanCount || 0}
                        </span>
                        <span className="flex items-center bg-neutral-100 dark:bg-neutral-900 px-1.5 py-0.5 rounded-md">
                          <Calendar className="w-3 h-3 mr-1 text-neutral-400" />
                          {new Date(item.createdAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                        </span>
                        {getExpiryLabel(item.expiresAt)}
                      </div>
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex items-center gap-2 sm:gap-1.5 w-full sm:w-auto justify-end border-t border-neutral-100 dark:border-neutral-900 sm:border-0 pt-3 sm:pt-0 sm:ml-3">
                    <button
                      onClick={() => handleCopyLink(item.id)}
                      className="flex-1 sm:flex-none flex items-center justify-center p-2 rounded-lg bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-850 text-neutral-500 dark:text-neutral-450 hover:text-accent transition-colors"
                      title="Copy Public Link"
                    >
                      {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => setSelectedItem(item)}
                      className="flex-1 sm:flex-none flex items-center justify-center p-2 rounded-lg bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-850 text-neutral-500 dark:text-neutral-450 hover:text-accent transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item)}
                      disabled={deletingId === item.id}
                      className="flex-1 sm:flex-none flex items-center justify-center p-2 rounded-lg bg-neutral-50 dark:bg-neutral-900 hover:bg-red-500/10 text-neutral-500 dark:text-neutral-450 hover:text-red-500 transition-colors"
                      title="Delete Upload"
                    >
                      {deletingId === item.id ? (
                        <div className="h-3.5 w-3.5 rounded-full border-2 border-red-500/20 border-t-red-500 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Professional Deletion Confirmation Overlay */}
      {itemToDelete && (
        <div className="absolute inset-0 z-20 bg-white/80 dark:bg-[#0E0E0E]/90 backdrop-blur-sm flex items-center justify-center p-4 rounded-2xl animate-fade-in">
          <div className="bg-white dark:bg-[#1A1A1A] border border-red-500/20 shadow-2xl rounded-3xl p-6 sm:p-8 max-w-[320px] w-full text-center space-y-4">
            <div className="mx-auto w-14 h-14 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4">
              <Trash2 className="w-7 h-7" />
            </div>
            <h4 className="text-xl font-black text-neutral-900 dark:text-white">Delete Link?</h4>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">
              This action cannot be undone. This link will be permanently removed from your cloud account.
            </p>
            <div className="flex gap-3 pt-4">
              <button 
                onClick={() => setItemToDelete(null)}
                disabled={deletingId === itemToDelete.id}
                className="flex-1 py-3 rounded-xl text-sm font-bold bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => executeDelete(itemToDelete)}
                disabled={deletingId === itemToDelete.id}
                className="flex-1 py-3 rounded-xl text-sm font-bold bg-red-500 text-white hover:bg-red-600 transition-colors flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {deletingId === itemToDelete.id ? (
                  <div className="h-5 w-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                ) : (
                  "Yes, Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
