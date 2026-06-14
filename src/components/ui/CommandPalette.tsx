import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Compass, Palette, History, FileText, CornerDownLeft } from 'lucide-react';
import { useKeyPress } from '../../hooks/useKeyPress';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  setTab: (tab: string) => void;
  applyPreset: (presetKey: string) => void;
  historyItems: Array<{ id: string; name: string; text: string; type: string }>;
  loadHistoryItem: (id: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  setTab,
  applyPreset,
  historyItems,
  loadHistoryItem,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Trigger palette toggle with CMD/CTRL + K
  useKeyPress('k', (e) => {
    e.preventDefault();
  }, { ctrlOrCmd: true, ignoreInputs: false });

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Command items definitions
  const navigationItems = [
    { type: 'nav', id: 'generate', label: 'Go to QR Generator', icon: Compass, action: () => setTab('generate') },
    { type: 'nav', id: 'customize', label: 'Go to Customize Styles', icon: Palette, action: () => setTab('customize') },
    { type: 'nav', id: 'decode', label: 'Go to QR Decoder', icon: Compass, action: () => setTab('decode') },
    { type: 'nav', id: 'inspect', label: 'Go to QR Inspector', icon: Compass, action: () => setTab('inspect') },
    { type: 'nav', id: 'export', label: 'Go to Export Panel', icon: FileText, action: () => setTab('export') },
  ];

  const presetItems = [
    { type: 'preset', id: 'minimal', label: 'Apply Preset: Minimal (Classic)', icon: Palette, action: () => applyPreset('minimal') },
    { type: 'preset', id: 'neon', label: 'Apply Preset: Neon (Pink/Purple Glow)', icon: Palette, action: () => applyPreset('neon') },
    { type: 'preset', id: 'cyberpunk', label: 'Apply Preset: Cyberpunk (Gold/Neon)', icon: Palette, action: () => applyPreset('cyberpunk') },
    { type: 'preset', id: 'glass', label: 'Apply Preset: Glassmorphism', icon: Palette, action: () => applyPreset('glass') },
    { type: 'preset', id: 'corporate', label: 'Apply Preset: Corporate Blue', icon: Palette, action: () => applyPreset('corporate') },
    { type: 'preset', id: 'darkpro', label: 'Apply Preset: Dark Pro', icon: Palette, action: () => applyPreset('darkpro') },
    { type: 'preset', id: 'modernapp', label: 'Apply Preset: Modern App', icon: Palette, action: () => applyPreset('modernapp') },
    { type: 'preset', id: 'luxurygold', label: 'Apply Preset: Luxury Gold', icon: Palette, action: () => applyPreset('luxurygold') },
  ];

  const mappedHistory = historyItems.map((item) => ({
    type: 'history',
    id: item.id,
    label: `Load History: "${item.name}" (${item.type.toUpperCase()})`,
    icon: History,
    action: () => loadHistoryItem(item.id),
  }));

  // Combine items
  const allItems = [...navigationItems, ...presetItems, ...mappedHistory];

  // Filter items
  const filteredItems = allItems.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  // Keyboard navigation within list
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onClose]);

  // Auto-scroll selected element into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-neutral-950/40 dark:bg-black/80 backdrop-blur-md"
          />

          {/* Dialog Body */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white dark:bg-[#0E0E0E] border border-neutral-100 dark:border-neutral-900 shadow-2xl z-10"
          >
            {/* Search Input */}
            <div className="flex items-center px-4 border-b border-neutral-100 dark:border-neutral-900">
              <Search className="h-5 w-5 text-neutral-400 mr-3 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search commands, presets, or history..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                className="w-full py-4 text-sm bg-transparent outline-none border-none text-neutral-950 dark:text-neutral-50 placeholder-neutral-400"
              />
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-800 text-[10px] font-mono text-neutral-400 bg-neutral-50 dark:bg-neutral-900 select-none">
                ESC
              </kbd>
            </div>

            {/* List */}
            <div
              ref={listRef}
              className="max-h-[340px] overflow-y-auto p-2 space-y-0.5 scroll-py-1"
            >
              {filteredItems.length > 0 ? (
                filteredItems.map((item, index) => {
                  const Icon = item.icon;
                  const isSelected = index === selectedIndex;

                  return (
                    <div
                      key={`${item.type}-${item.id}`}
                      onClick={() => {
                        item.action();
                        onClose();
                      }}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-accent text-white'
                          : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900/50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`h-4.5 w-4.5 ${isSelected ? 'text-white' : 'text-neutral-400'}`} />
                        <span className="text-xs font-medium tracking-wide">
                          {item.label}
                        </span>
                      </div>
                      
                      {isSelected && (
                        <div className="flex items-center space-x-1 text-[10px] font-medium opacity-80">
                          <span>Select</span>
                          <CornerDownLeft className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-xs text-neutral-400 dark:text-neutral-500">
                  No commands found matching "{query}"
                </div>
              )}
            </div>

            {/* Footer hints */}
            <div className="flex justify-between items-center px-4 py-3 border-t border-neutral-100 dark:border-neutral-900 bg-neutral-50/50 dark:bg-neutral-950/20 text-[10px] text-neutral-400 select-none">
              <div className="flex items-center space-x-3">
                <span>↑↓ Navigate</span>
                <span>↵ Select</span>
              </div>
              <div>Press ESC to exit</div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
