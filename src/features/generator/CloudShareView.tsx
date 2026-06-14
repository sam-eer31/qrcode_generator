import React, { useState } from 'react';
import { CloudUpload, Image as ImageIcon, FileText, Lock, Sparkles } from 'lucide-react';
import { CloudImageForm, CloudNoteForm } from './CloudForms';

interface CloudShareViewProps {
  onLinkGenerated: (link: string) => void;
}

export const CloudShareView: React.FC<CloudShareViewProps> = ({ onLinkGenerated }) => {
  const [activeForm, setActiveForm] = useState<'image' | 'note'>('image');

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          <CloudUpload className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-black text-neutral-900 dark:text-white">Cloud Host Services</h2>
        </div>
        <p className="text-xs text-neutral-500">
          Upload images or rich text notes securely to the cloud. We generate a permanent public link and auto-embed it into your QR code.
        </p>
      </div>

      {/* Modern Segmented Control */}
      <div className="bg-neutral-100/50 dark:bg-neutral-900/50 p-1.5 rounded-2xl flex space-x-1 border border-neutral-200/50 dark:border-neutral-800/50">
        <button
          onClick={() => setActiveForm('image')}
          className={`relative flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl text-xs font-bold transition-all ${
            activeForm === 'image' 
              ? 'bg-white dark:bg-[#0A0A0A] text-accent shadow-sm border border-neutral-200/50 dark:border-neutral-800' 
              : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5 border border-transparent'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Host an Image</span>
          {activeForm === 'image' && <Sparkles className="absolute top-2 right-2 w-2.5 h-2.5 text-accent opacity-50" />}
        </button>
        <button
          onClick={() => setActiveForm('note')}
          className={`relative flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl text-xs font-bold transition-all ${
            activeForm === 'note' 
              ? 'bg-white dark:bg-[#0A0A0A] text-success shadow-sm border border-neutral-200/50 dark:border-neutral-800' 
              : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5 border border-transparent'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Write a Note</span>
          {activeForm === 'note' && <Sparkles className="absolute top-2 right-2 w-2.5 h-2.5 text-success opacity-50" />}
        </button>
      </div>

      <div className="bg-white/50 dark:bg-black/20 rounded-3xl p-6 border border-neutral-200/50 dark:border-neutral-800/50 shadow-inner">
        {activeForm === 'image' ? (
          <CloudImageForm onChange={onLinkGenerated} />
        ) : (
          <CloudNoteForm onChange={onLinkGenerated} />
        )}
      </div>

      <div className="bg-accent/5 border border-accent/20 rounded-2xl p-4 flex items-start space-x-3 text-accent">
        <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="text-xs font-bold">Secure Infrastructure</h4>
          <p className="text-[10px] mt-1 opacity-80 leading-relaxed">
            All hosted data is protected by strict security rules. Files are automatically deleted if they expire. Sign in to create permanent links.
          </p>
        </div>
      </div>
    </div>
  );
};
