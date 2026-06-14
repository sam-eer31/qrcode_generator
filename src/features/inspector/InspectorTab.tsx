import React, { useState, useRef } from 'react';
import { decodeQRFromImage } from '../../utils/qrUtils';
import { LayoutGrid, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import QRCode from 'qrcode';

export const InspectorTab: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [qrObject, setQrObject] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file.');
      return;
    }

    setError(null);
    setQrObject(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const dataUrl = e.target.result as string;
        setImageSrc(dataUrl);
        
        const img = new Image();
        img.onload = () => {
          const result = decodeQRFromImage(img);
          if (result.success && result.data) {
            try {
              // Reconstruct QR code details from decoded text
              const qr = QRCode.create(result.data, { errorCorrectionLevel: 'H' });
              setQrObject(qr);
            } catch (err) {
              setError('Failed to run technical analysis on decoded string.');
            }
          } else {
            setError(result.error || 'Failed to decode QR code for inspection.');
          }
        };
        img.src = dataUrl;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
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

  // Helper to distinguish modules
  const getModuleType = (r: number, c: number, size: number, reserved: Uint8Array): string => {
    // Check Finders
    if ((r < 7 && c < 7) || (r < 7 && c >= size - 7) || (r >= size - 7 && c < 7)) {
      return 'Finder Pattern';
    }
    // Check Timing Patterns
    if (r === 6 || c === 6) {
      return 'Timing Pattern';
    }
    // Check Alignment Patterns (Usually version 2+ has them)
    if (reserved[r * size + c] === 1) {
      return 'Format/Alignment';
    }
    return 'Data Module';
  };

  // Estimates print sizes vs scan distances
  const getPrintRecommendations = (version: number) => {
    const sizeCm = Math.max(2, Math.ceil(version * 0.5 + 1.5));
    return [
      { printSize: `${sizeCm} cm`, distance: `${sizeCm * 10} cm`, useCase: 'Business Cards, Labels' },
      { printSize: `${sizeCm * 2} cm`, distance: `${sizeCm * 20} cm`, useCase: 'Brochures, Flyers' },
      { printSize: `${sizeCm * 4} cm`, distance: `${sizeCm * 40} cm`, useCase: 'Posters, Standees' },
      { printSize: `${sizeCm * 8} cm`, distance: `${sizeCm * 80} cm`, useCase: 'Billboards, Banners' },
    ];
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Upload area */}
      <div className="lg:col-span-5 space-y-4">
        <h4 className="text-sm font-semibold tracking-wide uppercase text-neutral-400">Upload QR to Inspect</h4>
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="relative flex flex-col items-center justify-center border-2 border-dashed border-neutral-200 dark:border-neutral-800 hover:border-accent rounded-3xl p-8 bg-white/50 dark:bg-[#0C0C0C]/50 hover:bg-neutral-50 dark:hover:bg-neutral-950/20 transition-all cursor-pointer min-h-[260px]"
        >
          {imageSrc ? (
            <div className="relative w-full max-h-[220px] flex items-center justify-center overflow-hidden rounded-xl">
              <img src={imageSrc} alt="Inspection Source" className="max-h-[200px] object-contain rounded" />
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                <span className="text-xs font-semibold text-white bg-black/60 px-3 py-1.5 rounded-full">Replace QR image</span>
              </div>
            </div>
          ) : (
            <>
              <LayoutGrid className="h-10 w-10 text-neutral-400 mb-3" />
              <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Load QR Code Image</span>
              <span className="text-xs text-neutral-400 mt-1">Extract versions, errors, and module locations</span>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {error && (
          <div className="flex items-start space-x-2.5 p-4 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20">
            <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span className="text-xs font-semibold leading-relaxed">{error}</span>
          </div>
        )}

        {qrObject && (
          <div className="bg-white dark:bg-[#0E0E0E] border border-neutral-100 dark:border-neutral-900 rounded-3xl p-5 shadow-premium dark:shadow-premium-dark space-y-4">
            <h5 className="text-xs font-semibold tracking-wide uppercase text-neutral-400">Technical Glossary</h5>
            <div className="space-y-3.5 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              <div>
                <strong className="text-neutral-800 dark:text-neutral-200">Finder Patterns:</strong>
                <p className="mt-0.5">The three large corner boxes. They allow scan cameras to detect the QR rotation, position, and angle.</p>
              </div>
              <div>
                <strong className="text-neutral-800 dark:text-neutral-200">Timing Patterns:</strong>
                <p className="mt-0.5">Alternating dark/light pixel lines connecting finders. They determine the width of individual cells.</p>
              </div>
              <div>
                <strong className="text-neutral-800 dark:text-neutral-200">Error Correction:</strong>
                <p className="mt-0.5">Reed-Solomon recovery blocks. They rebuild missing or damaged data modules, allowing scans on dirty or blocked surfaces.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Inspection results */}
      <div className="lg:col-span-7 space-y-6">
        <h4 className="text-sm font-semibold tracking-wide uppercase text-neutral-400">Diagnostic Analytics</h4>

        {qrObject ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Tech stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-[#0E0E0E] border border-neutral-100 dark:border-neutral-900 p-4 rounded-2xl shadow-premium dark:shadow-premium-dark">
                <span className="text-[10px] font-bold text-neutral-400 tracking-wider uppercase">QR Version</span>
                <p className="text-2xl font-black text-accent mt-0.5">V{qrObject.version}</p>
              </div>
              <div className="bg-white dark:bg-[#0E0E0E] border border-neutral-100 dark:border-neutral-900 p-4 rounded-2xl shadow-premium dark:shadow-premium-dark">
                <span className="text-[10px] font-bold text-neutral-400 tracking-wider uppercase">Error Class</span>
                <p className="text-2xl font-black text-secondary mt-0.5">
                  {qrObject.errorCorrectionLevel?.bit === 1 ? 'L' : 
                   qrObject.errorCorrectionLevel?.bit === 0 ? 'M' : 
                   qrObject.errorCorrectionLevel?.bit === 3 ? 'Q' : 'H'}
                </p>
              </div>
              <div className="bg-white dark:bg-[#0E0E0E] border border-neutral-100 dark:border-neutral-900 p-4 rounded-2xl shadow-premium dark:shadow-premium-dark">
                <span className="text-[10px] font-bold text-neutral-400 tracking-wider uppercase">Module Count</span>
                <p className="text-xl font-black text-neutral-800 dark:text-neutral-100 mt-1.5">{qrObject.modules.size} × {qrObject.modules.size}</p>
              </div>
              <div className="bg-white dark:bg-[#0E0E0E] border border-neutral-100 dark:border-neutral-900 p-4 rounded-2xl shadow-premium dark:shadow-premium-dark">
                <span className="text-[10px] font-bold text-neutral-400 tracking-wider uppercase">Data Cells</span>
                <p className="text-xl font-black text-neutral-800 dark:text-neutral-100 mt-1.5">{qrObject.modules.data.filter((b: number) => b === 1).length}</p>
              </div>
            </div>

            {/* Interactive Module Matrix */}
            <div className="space-y-2">
              <span className="text-xs font-semibold tracking-wide uppercase text-neutral-400">Reconstructed Module Matrix</span>
              <div className="flex flex-col items-center bg-white dark:bg-[#0E0E0E] border border-neutral-100 dark:border-neutral-900 rounded-3xl p-6 shadow-premium dark:shadow-premium-dark">
                <div
                  className="grid gap-px bg-neutral-100 dark:bg-neutral-950 p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 max-w-[280px]"
                  style={{
                    gridTemplateColumns: `repeat(${qrObject.modules.size}, minmax(0, 1fr))`,
                    aspectRatio: '1 / 1',
                    width: '100%',
                  }}
                >
                  {Array.from({ length: qrObject.modules.size }).map((_, r) =>
                    Array.from({ length: qrObject.modules.size }).map((_, c) => {
                      const isDark = qrObject.modules.get(r, c);
                      const type = getModuleType(r, c, qrObject.modules.size, qrObject.modules.reservedBit);
                      
                      let colorClass = 'bg-white dark:bg-[#0A0A0A]';
                      if (isDark) {
                        if (type === 'Finder Pattern') colorClass = 'bg-[#6D5DFC]';
                        else if (type === 'Timing Pattern') colorClass = 'bg-[#8B5CF6]';
                        else if (type === 'Format/Alignment') colorClass = 'bg-[#10B981]';
                        else colorClass = 'bg-black dark:bg-white';
                      }

                      return (
                        <div
                          key={`${r}-${c}`}
                          className={`w-full h-full rounded-[1px] transition-all hover:scale-150 hover:shadow-md cursor-help ${colorClass}`}
                          title={`Cell: r:${r}, c:${c}\nValue: ${isDark ? 'Dark' : 'Light'}\nSegment: ${type}`}
                        />
                      );
                    })
                  )}
                </div>

                {/* Grid legend */}
                <div className="flex flex-wrap justify-center gap-3.5 mt-4 text-[10px] font-semibold text-neutral-400 uppercase select-none">
                  <div className="flex items-center space-x-1">
                    <span className="h-2.5 w-2.5 bg-[#6D5DFC] rounded-sm" />
                    <span>Finder Pattern</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="h-2.5 w-2.5 bg-[#8B5CF6] rounded-sm" />
                    <span>Timing Pattern</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="h-2.5 w-2.5 bg-[#10B981] rounded-sm" />
                    <span>Alignment Pattern</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="h-2.5 w-2.5 bg-neutral-400 rounded-sm" />
                    <span>Data bits</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Print & Distance Recommendations */}
            <div className="space-y-2">
              <span className="text-xs font-semibold tracking-wide uppercase text-neutral-400 font-sans">Print & Scan Recommendations</span>
              <div className="bg-white dark:bg-[#0E0E0E] border border-neutral-100 dark:border-neutral-900 rounded-3xl overflow-hidden shadow-premium dark:shadow-premium-dark">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-100 dark:border-neutral-900 bg-neutral-50/50 dark:bg-neutral-950/20">
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">Print Size (W × H)</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">Recommended Scan Distance</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">Target Use Cases</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getPrintRecommendations(qrObject.version).map((row, index) => (
                      <tr key={index} className="border-b border-neutral-100 dark:border-neutral-900 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-900/10 transition-colors text-xs font-medium text-neutral-800 dark:text-neutral-200">
                        <td className="px-5 py-3.5 font-mono">{row.printSize}</td>
                        <td className="px-5 py-3.5 font-mono">{row.distance}</td>
                        <td className="px-5 py-3.5 text-neutral-500 dark:text-neutral-450">{row.useCase}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 border border-neutral-100 dark:border-neutral-900 rounded-3xl bg-white/20 dark:bg-[#0C0C0C]/10">
            <LayoutGrid className="h-10 w-10 text-neutral-300 dark:text-neutral-800 mb-3" />
            <span className="text-sm font-medium text-neutral-400">Awaiting QR scan file load</span>
            <p className="text-[10px] text-neutral-400/85 mt-1 max-w-[240px] text-center leading-relaxed">
              Upload a QR code to visually decompose its structures, check module coordinate systems, and estimate print thresholds.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
