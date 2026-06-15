import React, { useState, useRef, useEffect } from 'react';
import { decodeQRFromImage, parseQRData } from '../../utils/qrUtils';
import type { ParsedQRInfo } from '../../utils/qrUtils';
import { Button } from '../../components/ui/Button';
import { Upload, Copy, Check, Download, AlertCircle, FileCode } from 'lucide-react';
import { motion } from 'framer-motion';
import { readFileAsDataURLWithRetry } from '../../utils/fileUtils';

export const DecoderTab: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [decodedData, setDecodedData] = useState<string | null>(null);
  const [parsedInfo, setParsedInfo] = useState<ParsedQRInfo | null>(null);
  const [stats, setStats] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    setError(null);
    setDecodedData(null);
    setParsedInfo(null);
    setStats(null);

    try {
      const dataUrl = await readFileAsDataURLWithRetry(file);
      setImageSrc(dataUrl);
      
      // Decode the QR Code from image
      const img = new Image();
      img.onload = () => {
        const result = decodeQRFromImage(img);
        if (result.success && result.data) {
          setDecodedData(result.data);
          setParsedInfo(parseQRData(result.data));
          setStats(result.stats);
        } else {
          setError(result.error || 'Failed to detect a QR code in the image.');
        }
      };
      img.onerror = () => {
        setError('Failed to load image element for QR decoding.');
      };
      img.src = dataUrl;
    } catch (err: any) {
      console.error('File reading error:', err);
      setError(err.message || 'Failed to read the image file.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
      e.target.value = ''; // Reset input value so same file can be selected again
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Paste image functionality
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            if (file) {
              processImageFile(file);
              break;
            }
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleCopy = () => {
    if (decodedData) {
      navigator.clipboard.writeText(decodedData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadJSON = () => {
    if (!decodedData || !parsedInfo) return;
    const jsonString = JSON.stringify({
      raw: decodedData,
      type: parsedInfo.type,
      details: parsedInfo.details,
      meta: stats
    }, null, 2);

    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `decoded-qr-data.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Upload Column */}
      <div className="lg:col-span-5 space-y-4">
        <h4 className="text-sm font-semibold tracking-wide uppercase text-neutral-400">Upload Image</h4>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="relative flex flex-col items-center justify-center border-2 border-dashed border-neutral-200 dark:border-neutral-800 hover:border-accent rounded-3xl p-6 sm:p-8 bg-white/50 dark:bg-[#0C0C0C]/50 hover:bg-neutral-50 dark:hover:bg-neutral-950/20 transition-all cursor-pointer min-h-[200px] sm:min-h-[300px]"
        >
          {imageSrc ? (
            <div className="relative w-full max-h-[200px] sm:max-h-[250px] flex items-center justify-center overflow-hidden rounded-xl">
              <img src={imageSrc} alt="Uploaded QR Code" className="max-h-[180px] sm:max-h-[220px] object-contain rounded" />
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                <span className="text-xs font-semibold text-white bg-black/60 px-3 py-1.5 rounded-full">Click to replace file</span>
              </div>
            </div>
          ) : (
            <>
              <Upload className="h-10 w-10 text-neutral-400 mb-3" />
              <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Drag & Drop Image Here</span>
              <span className="text-xs text-neutral-400 mt-1">Or click to browse from files</span>
              <span className="text-[10px] text-neutral-400/80 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 px-2 py-0.5 rounded-md mt-4">
                Tip: You can paste images using Ctrl+V
              </span>
            </>
          )}
        </div>

        {error && (
          <div className="flex items-start space-x-2.5 p-4 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span className="text-xs leading-relaxed font-semibold">{error}</span>
          </div>
        )}
      </div>

      {/* Results Column */}
      <div className="lg:col-span-7 space-y-6">
        <h4 className="text-sm font-semibold tracking-wide uppercase text-neutral-400">Decoded Payload</h4>
        
        {decodedData && parsedInfo ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Header info */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white capitalize">{parsedInfo.title}</h3>
                <span className="inline-flex items-center text-[10px] font-bold tracking-wider uppercase bg-accent/10 text-accent px-2.5 py-0.5 rounded-full mt-1">
                  Type: {parsedInfo.type}
                </span>
              </div>
              
              <div className="flex space-x-2">
                <Button variant="secondary" size="sm" onClick={handleCopy} className="space-x-1.5">
                  {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </Button>
                <Button variant="secondary" size="sm" onClick={downloadJSON} className="space-x-1.5">
                  <Download className="h-3.5 w-3.5" />
                  <span>JSON</span>
                </Button>
              </div>
            </div>

            {/* Key-Value Details */}
            <div className="bg-white dark:bg-[#0E0E0E] border border-neutral-200 dark:border-neutral-900 rounded-3xl overflow-hidden shadow-premium dark:shadow-premium-dark overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[320px]">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-900 bg-neutral-50/50 dark:bg-neutral-950/20">
                    <th className="px-3 sm:px-5 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">Parameter</th>
                    <th className="px-3 sm:px-5 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">Detected Value</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(parsedInfo.details).map(([key, val]) => (
                    <tr key={key} className="border-b border-neutral-200 dark:border-neutral-900 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-900/10 transition-colors">
                      <td className="px-3 sm:px-5 py-3.5 text-xs font-bold text-neutral-600 dark:text-neutral-400 capitalize">{key}</td>
                      <td className="px-3 sm:px-5 py-3.5 text-xs font-mono font-medium text-neutral-900 dark:text-neutral-200 text-break-all select-all">{val || '(Empty)'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Raw Text Output */}
            <div className="space-y-2">
              <span className="text-xs font-semibold tracking-wide uppercase text-neutral-400">Raw QR Payload String</span>
              <div className="w-full p-4 rounded-2xl bg-neutral-50 dark:bg-[#0E0E0E] border border-neutral-150 dark:border-neutral-900 text-xs font-mono text-neutral-700 dark:text-neutral-300 break-all select-all">
                {decodedData}
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 border border-neutral-200 dark:border-neutral-900 rounded-3xl bg-white/20 dark:bg-[#0C0C0C]/10">
            <FileCode className="h-10 w-10 text-neutral-300 dark:text-neutral-800 mb-3" />
            <span className="text-sm font-medium text-neutral-400">Awaiting QR scan file upload</span>
            <p className="text-[10px] text-neutral-400/80 mt-1 max-w-[240px] text-center leading-relaxed">
              Upload a screenshot or photo of any QR code to instantly parse and extract its details.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
