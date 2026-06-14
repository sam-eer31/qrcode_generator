import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import type { QRStyleOptions } from '../../utils/qrUtils';
import { History, Star, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface HistoryItem {
  id: string;
  name: string;
  text: string;
  type: string;
  options: QRStyleOptions;
  timestamp: number;
  isFavorite: boolean;
}

interface HistoryPanelProps {
  items: HistoryItem[];
  onLoadItem: (item: HistoryItem) => void;
  onDeleteItem: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onClearHistory: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  items,
  onLoadItem,
  onDeleteItem,
  onToggleFavorite,
  onClearHistory,
}) => {
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');

  const filteredItems = items
    .filter((item) => (filter === 'favorites' ? item.isFavorite : true))
    .sort((a, b) => b.timestamp - a.timestamp);

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Header and filters */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div className="flex space-x-1.5 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-900 w-fit">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              filter === 'all'
                ? 'bg-white dark:bg-[#0A0A0A] text-neutral-900 dark:text-white shadow-premium'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
            }`}
          >
            All History
          </button>
          <button
            onClick={() => setFilter('favorites')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              filter === 'favorites'
                ? 'bg-white dark:bg-[#0A0A0A] text-neutral-900 dark:text-white shadow-premium'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
            }`}
          >
            Favorites
          </button>
        </div>

        {items.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onClearHistory} className="text-red-500 hover:bg-red-500/10 self-start sm:self-auto space-x-1 px-3 py-1.5">
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear All</span>
          </Button>
        )}
      </div>

      {/* Grid of history cards */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="group flex items-center justify-between p-4 bg-white dark:bg-[#0E0E0E] border border-neutral-200 dark:border-neutral-900 rounded-2xl hover:border-accent/30 hover:shadow-premium dark:hover:shadow-premium-dark transition-all"
              >
                {/* Info block */}
                <div
                  onClick={() => onLoadItem(item)}
                  className="flex-1 pr-4 cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-neutral-900 dark:text-neutral-200 group-hover:text-accent transition-colors">
                      {item.name}
                    </span>
                    <span className="text-[9px] font-bold tracking-wider uppercase bg-neutral-100 dark:bg-neutral-800 text-neutral-500 px-1.5 py-0.5 rounded">
                      {item.type}
                    </span>
                  </div>
                  
                  <p className="text-[10px] text-neutral-400 font-mono mt-1 max-w-[280px] sm:max-w-[400px] truncate">
                    {item.text}
                  </p>
                  
                  <span className="text-[9px] text-neutral-400 mt-2 block font-medium">
                    {formatDate(item.timestamp)}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-1.5 flex-shrink-0">
                  <button
                    onClick={() => onToggleFavorite(item.id)}
                    aria-label={item.isFavorite ? "Remove from favorites" : "Add to favorites"}
                    className={`p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors ${
                      item.isFavorite ? 'text-amber-500' : 'text-neutral-400 hover:text-neutral-600'
                    }`}
                  >
                    <Star className="h-4.5 w-4.5 fill-current" />
                  </button>
                  <button
                    onClick={() => onDeleteItem(item.id)}
                    aria-label="Delete history item"
                    className="p-2 rounded-full text-neutral-450 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 border border-neutral-200 dark:border-neutral-900 rounded-3xl bg-white/20 dark:bg-[#0C0C0C]/10 text-center"
            >
              <History className="h-9 w-9 text-neutral-350 dark:text-neutral-800 mb-3" />
              <span className="text-sm font-medium text-neutral-400">
                {filter === 'favorites' ? 'No favorites saved yet' : 'Your history is empty'}
              </span>
              <p className="text-[10px] text-neutral-400/80 mt-1 max-w-[200px] leading-relaxed">
                {filter === 'favorites'
                  ? 'Click the star icon on any creation in your history tab to bookmark it here.'
                  : 'QR codes you generate in the workspace will appear here automatically.'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
