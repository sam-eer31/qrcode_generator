import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Trash2, 
  Eye, 
  Copy, 
  Check, 
  Sparkles, 
  ExternalLink, 
  FileText as FileIcon, 
  Image as ImageIcon,
  BarChart3,
  Calendar
} from 'lucide-react';
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../../utils/firebase';

interface ShareData {
  id: string;
  type: 'image' | 'text';
  content: string;
  theme?: string;
  creatorId: string;
  createdAt: number;
  expiresAt: number | null;
  scanCount: number;
  fileName?: string;
}

interface CloudDashboardProps {
  currentUser: any;
  onBackToCreator: () => void;
  onLoadGeneratedLink: (link: string) => void;
}

export const CloudDashboard: React.FC<CloudDashboardProps> = ({ 
  currentUser, 
  onBackToCreator,
  onLoadGeneratedLink
}) => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ShareData[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchUserItems = async () => {
    if (!db || !currentUser) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Fetch shares without composite indexes (sorting client-side to prevent firestore index errors)
      const q = query(
        collection(db, 'shares'), 
        where('creatorId', '==', currentUser.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const fetchedItems: ShareData[] = [];
      querySnapshot.forEach((doc) => {
        fetchedItems.push(doc.data() as ShareData);
      });

      // Client-side sort: descending by createdAt
      fetchedItems.sort((a, b) => b.createdAt - a.createdAt);
      setItems(fetchedItems);
    } catch (err) {
      console.error('Error fetching user shared links:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserItems();
  }, [currentUser]);

  const handleCopyLink = (itemId: string) => {
    const link = `${window.location.origin}${window.location.pathname}?share=${itemId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(itemId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteItem = async (item: ShareData) => {
    if (!db) return;
    
    const confirmDelete = window.confirm('Are you sure you want to delete this shared link permanently? This cannot be undone.');
    if (!confirmDelete) return;

    setDeletingId(item.id);

    try {
      // 1. Delete document from Firestore
      await deleteDoc(doc(db, 'shares', item.id));

      // 2. If it is an image, delete it from Storage
      if (item.type === 'image' && storage) {
        try {
          const storageRef = ref(storage, `shares/${item.id}_compressed.jpg`);
          await deleteObject(storageRef);
        } catch (storageErr) {
          console.warn('Storage file deletion failed (it may have already been deleted):', storageErr);
        }
      }

      // Update state
      setItems(prev => prev.filter(i => i.id !== item.id));
    } catch (err) {
      console.error('Error deleting shared link:', err);
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

  return (
    <div className="space-y-6 animate-fade-in select-none">
      
      {/* Dashboard Top Header Navigation */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-900">
        <button
          onClick={onBackToCreator}
          className="flex items-center space-x-1.5 text-xs font-bold text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Upload Creator</span>
        </button>
        
        <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400">
          Cloud Dashboard
        </h3>
      </div>

      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center space-y-3">
          <div className="h-9 w-9 rounded-full border-3 border-accent/20 border-t-accent animate-spin" />
          <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold animate-pulse">Loading links dashboard...</p>
        </div>
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
                  className="group relative flex items-center justify-between p-3 bg-white dark:bg-[#0E0E0E] border border-neutral-200 dark:border-neutral-900 rounded-2xl hover:border-neutral-350 dark:hover:border-neutral-800 transition-all shadow-premium dark:shadow-premium-dark select-none"
                >
                  <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                    {/* Thumbnail / Icon Indicator */}
                    <div className="h-11 w-11 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-850 flex-shrink-0 overflow-hidden flex items-center justify-center">
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
                        <span className="text-xs font-bold text-neutral-800 dark:text-white truncate">
                          {item.type === 'image' ? (item.fileName || 'Shared Image') : item.content}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-3 mt-1.5 text-[9px] font-bold text-neutral-400 select-none uppercase tracking-wider">
                        <span className="flex items-center">
                          <Eye className="w-3.5 h-3.5 mr-0.5 text-neutral-400" />
                          {item.scanCount || 0}
                        </span>
                        <span>•</span>
                        <span className="flex items-center">
                          <Calendar className="w-3.5 h-3.5 mr-0.5 text-neutral-400" />
                          {new Date(item.createdAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                        </span>
                        <span>•</span>
                        {getExpiryLabel(item.expiresAt)}
                      </div>
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex items-center space-x-1.5 ml-3">
                    <button
                      onClick={() => handleCopyLink(item.id)}
                      className="p-2 rounded-lg bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-850 text-neutral-500 dark:text-neutral-450 hover:text-accent transition-colors"
                      title="Copy Public Link"
                    >
                      {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => onLoadGeneratedLink(`${window.location.origin}${window.location.pathname}?share=${item.id}`)}
                      className="p-2 rounded-lg bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-850 text-neutral-500 dark:text-neutral-450 hover:text-accent transition-colors"
                      title="Generate/Export QR"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item)}
                      disabled={deletingId === item.id}
                      className="p-2 rounded-lg bg-neutral-50 dark:bg-neutral-900 hover:bg-red-500/10 text-neutral-500 dark:text-neutral-450 hover:text-red-500 transition-colors"
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
    </div>
  );
};
