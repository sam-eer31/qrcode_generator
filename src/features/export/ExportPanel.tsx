import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Select, Label, Input } from '../../components/ui/Input';
import { downloadCanvas, generateSVG, exportToPDF, drawCustomQR } from '../../utils/qrUtils';
import type { QRStyleOptions } from '../../utils/qrUtils';
import { Download, Layers, ShieldCheck, ListPlus, FileCheck } from 'lucide-react';

interface ExportPanelProps {
  text: string;
  options: QRStyleOptions;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({ text, options }) => {
  const [exportFormat, setExportFormat] = useState<'png' | 'svg' | 'jpeg' | 'webp' | 'pdf'>('png');
  const [exportSize, setExportSize] = useState<number>(1024);
  const [isExporting, setIsExporting] = useState(false);

  // Batch Export states
  const [batchTexts, setBatchTexts] = useState<string>('https://google.com\nhttps://youtube.com\nhttps://github.com');
  const [batchPrefix, setBatchPrefix] = useState('qr-studio');
  const [batchStatus, setBatchStatus] = useState<string | null>(null);

  const triggerExport = async () => {
    setIsExporting(true);
    try {
      const filename = `qr-studio-${Date.now()}`;
      
      if (exportFormat === 'svg') {
        const svgString = generateSVG(text, { ...options, size: exportSize });
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `${filename}.svg`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        // Create hidden canvas for rendering at high export sizes
        const tempCanvas = document.createElement('canvas');
        await drawCustomQR(tempCanvas, text, { ...options, size: exportSize });
        
        if (exportFormat === 'pdf') {
          exportToPDF(tempCanvas, filename);
        } else {
          downloadCanvas(tempCanvas, exportFormat, filename);
        }
      }
    } catch (e) {
      console.error('Export error:', e);
    } finally {
      setIsExporting(false);
    }
  };

  const triggerBatchExport = async () => {
    const items = batchTexts.split('\n').map((t) => t.trim()).filter(Boolean);
    if (items.length === 0) {
      setBatchStatus('Error: Please enter at least one text entry.');
      return;
    }

    setBatchStatus(`Generating ${items.length} QR codes...`);
    
    // Successive trigger with 300ms intervals to bypass browser blockings
    for (let i = 0; i < items.length; i++) {
      const activeText = items[i];
      const filename = `${batchPrefix}-${i + 1}`;

      await new Promise<void>((resolve) => {
        setTimeout(async () => {
          try {
            if (exportFormat === 'svg') {
              const svgString = generateSVG(activeText, { ...options, size: exportSize });
              const blob = new Blob([svgString], { type: 'image/svg+xml' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.download = `${filename}.svg`;
              link.href = url;
              link.click();
              URL.revokeObjectURL(url);
            } else {
              const tempCanvas = document.createElement('canvas');
              await drawCustomQR(tempCanvas, activeText, { ...options, size: exportSize });
              if (exportFormat === 'pdf') {
                exportToPDF(tempCanvas, filename);
              } else {
                downloadCanvas(tempCanvas, exportFormat, filename);
              }
            }
          } catch (e) {
            console.error('Batch item failed:', activeText, e);
          }
          resolve();
        }, i * 350);
      });
    }

    setBatchStatus(`Success! Downloaded ${items.length} files.`);
    setTimeout(() => setBatchStatus(null), 5000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* 1. Single QR Exporter */}
      <div className="lg:col-span-6 space-y-6">
        <h4 className="text-sm font-semibold tracking-wide uppercase text-neutral-400">Single File Export</h4>
        
        <div className="bg-white dark:bg-[#0E0E0E] border border-neutral-100 dark:border-neutral-900 rounded-3xl p-6 shadow-premium dark:shadow-premium-dark space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="export-fmt-select">File Format</Label>
              <Select
                id="export-fmt-select"
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as any)}
                options={[
                  { value: 'png', label: 'PNG Image (.png)' },
                  { value: 'svg', label: 'SVG Vector (.svg)' },
                  { value: 'jpeg', label: 'JPEG Image (.jpg)' },
                  { value: 'webp', label: 'WebP Image (.webp)' },
                  { value: 'pdf', label: 'Print Document (.pdf)' },
                ]}
              />
            </div>

            <div>
              <Label htmlFor="export-res-select">Resolution Size</Label>
              <Select
                id="export-res-select"
                value={exportSize.toString()}
                onChange={(e) => setExportSize(parseInt(e.target.value))}
                options={[
                  { value: '512', label: 'Standard (512 × 512 px)' },
                  { value: '1024', label: 'High Res (1024 × 1024 px)' },
                  { value: '2048', label: 'Ultra High (2048 × 2048 px)' },
                  { value: '4096', label: 'Print Quality (4096 × 4096 px)' },
                ]}
              />
            </div>
          </div>

          <div className="space-y-3.5 pt-1">
            <div className="flex items-center space-x-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 select-none">
              <Layers className="h-4.5 w-4.5 text-accent" />
              <span>Vectors support infinite zoom without blurring (SVG format).</span>
            </div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 select-none">
              <ShieldCheck className="h-4.5 w-4.5 text-success" />
              <span>Lightning fast processing. Ready to use anywhere.</span>
            </div>
          </div>

          <Button
            onClick={triggerExport}
            disabled={isExporting}
            variant="accent"
            className="w-full space-x-2 py-3"
          >
            <Download className="h-4.5 w-4.5" />
            <span>{isExporting ? 'Exporting...' : 'Download Custom QR'}</span>
          </Button>
        </div>
      </div>

      {/* 2. Batch QR Exporter */}
      <div className="lg:col-span-6 space-y-6">
        <h4 className="text-sm font-semibold tracking-wide uppercase text-neutral-400">Batch QR Generator</h4>
        
        <div className="bg-white dark:bg-[#0E0E0E] border border-neutral-100 dark:border-neutral-900 rounded-3xl p-6 shadow-premium dark:shadow-premium-dark space-y-5">
          <div>
            <Label htmlFor="batch-prefix">File Output Name Prefix</Label>
            <Input
              id="batch-prefix"
              value={batchPrefix}
              onChange={(e) => setBatchPrefix(e.target.value)}
              placeholder="e.g. ticket-qr"
            />
          </div>

          <div>
            <Label htmlFor="batch-inputs-text">Batch Datasets (One per line)</Label>
            <textarea
              id="batch-inputs-text"
              rows={4}
              value={batchTexts}
              onChange={(e) => setBatchTexts(e.target.value)}
              placeholder="https://example1.com&#10;https://example2.com&#10;https://example3.com"
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-black/50 backdrop-blur-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all resize-none font-mono"
            />
            <p className="text-[10px] text-neutral-400 mt-1.5">
              Each line translates to an independent QR file formatted in your chosen styling presets above.
            </p>
          </div>

          {batchStatus && (
            <div className="flex items-center space-x-2.5 p-3 rounded-xl bg-accent/10 border border-accent/20 text-accent text-xs font-semibold">
              <FileCheck className="h-4.5 w-4.5" />
              <span>{batchStatus}</span>
            </div>
          )}

          <Button
            onClick={triggerBatchExport}
            variant="outline"
            className="w-full space-x-2 py-3 border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200"
          >
            <ListPlus className="h-4.5 w-4.5 text-accent" />
            <span>Generate & Download Batch</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
