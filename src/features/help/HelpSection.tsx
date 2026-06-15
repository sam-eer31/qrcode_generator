import React, { useState } from 'react';
import { HelpCircle, Shield, Printer, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const helpTopics = [
  {
    id: 'basics',
    title: 'QR Basics',
    icon: HelpCircle,
    content: (
      <div className="space-y-4">
        <p>
          A <strong>QR Code</strong> (Quick Response Code) is a two-dimensional matrix barcode invented in 1994 by Denso Wave.
          Unlike standard barcodes that store data horizontally, QR codes encode information in both vertical and horizontal directions, enabling them to store up to 300 times more data.
        </p>
        <p>
          The modules (black and white squares) translate to binary values representing data.
          The three prominent outer corners are finder patterns that let cameras instantly calculate the rotation angle, direction, and dimensions during scanning.
        </p>
      </div>
    )
  },
  {
    id: 'error-correction',
    title: 'Error Correction',
    icon: Shield,
    content: (
      <div className="space-y-4">
        <p>
          QR codes use <strong>Reed-Solomon Error Correction</strong>.
          This creates duplicate backup databits inside the matrix, allowing codes to remain scannable even if they are dirty, torn, or partially blocked.
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Level L (Low):</strong> Rebuilds up to <strong>7%</strong> missing data. Ideal for simple texts.</li>
          <li><strong>Level M (Medium):</strong> Rebuilds up to <strong>15%</strong> missing data. Standard default.</li>
          <li><strong>Level Q (Quarter):</strong> Rebuilds up to <strong>25%</strong> missing data.</li>
          <li><strong>Level H (High):</strong> Rebuilds up to <strong>30%</strong> missing data. <strong>Mandatory</strong> for embedded logos.</li>
        </ul>
      </div>
    )
  },
  {
    id: 'printing',
    title: 'Best Printing',
    icon: Printer,
    content: (
      <div className="space-y-4">
        <p>
          To guarantee physical scanning success, follow these industrial printing checklists:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Use Vector Formats:</strong> Export as an <strong>SVG file</strong> to scale without pixelation.</li>
          <li><strong>Print Resolution:</strong> Raster images (PNG) should be printed at least <strong>300 DPI</strong>.</li>
          <li><strong>Matte Finish:</strong> Print on matte material. Glossy coatings reflect light and blind cameras.</li>
          <li><strong>Size Guideline:</strong> Measure at least <strong>2.0 cm (0.8 inches)</strong> in width on physical media.</li>
        </ul>
      </div>
    )
  },
  {
    id: 'scanning',
    title: 'Scan Tips',
    icon: Camera,
    content: (
      <div className="space-y-4">
        <p>
          If your QR code is not scanning, check these three parameters:
        </p>
        <ol className="list-decimal pl-5 space-y-2">
          <li><strong>High Color Contrast:</strong> Foreground must be significantly darker than background.</li>
          <li><strong>Quiet Zone:</strong> Require a margin buffer of at least 4 module widths around the QR border. Do not crop the padding to 0.</li>
          <li><strong>Logo Overcrowding:</strong> Keep embedded logos under 20% of the area and use <strong>Level H</strong> error correction. Do not block finder patterns.</li>
        </ol>
      </div>
    )
  }
];

export const HelpSection: React.FC = () => {
  const [activeTopic, setActiveTopic] = useState(helpTopics[0].id);

  const activeContent = helpTopics.find(t => t.id === activeTopic);
  const ActiveIcon = activeContent?.icon || HelpCircle;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-1.5">
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Built-in QR Education</h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">Everything you need to know to generate scan-perfect QR codes.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        {/* Navigation Tabs - Horizontal on Mobile, Vertical on Desktop */}
        <div className="flex md:flex-col overflow-x-auto scrollbar-none gap-2 md:w-56 pb-1 md:pb-0">
          {helpTopics.map((topic) => {
            const Icon = topic.icon;
            const isActive = activeTopic === topic.id;
            return (
              <button
                key={topic.id}
                onClick={() => setActiveTopic(topic.id)}
                className={`flex items-center space-x-3 px-4 py-3.5 md:py-3 rounded-[1.25rem] md:rounded-2xl whitespace-nowrap transition-all duration-300 focus:outline-none flex-shrink-0 ${
                  isActive
                    ? 'bg-accent text-white shadow-lg shadow-accent/25 dark:shadow-accent/20 border border-accent'
                    : 'bg-white dark:bg-[#0E0E0E] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-white' : 'text-neutral-400 dark:text-neutral-500'}`} />
                <span className="text-sm font-semibold tracking-wide">{topic.title}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white dark:bg-[#0E0E0E] border border-neutral-200 dark:border-neutral-900 rounded-[1.75rem] p-4 md:p-8 shadow-premium dark:shadow-premium-dark relative overflow-hidden">
          {/* Subtle background glow effect */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 dark:bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTopic}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed h-full flex flex-col min-h-[420px] md:min-h-[280px]"
            >
              <div className="flex items-center space-x-4 mb-6 pb-5 border-b border-neutral-100 dark:border-neutral-800/60">
                <div className="p-3 bg-accent/10 dark:bg-accent/20 rounded-2xl text-accent shadow-sm">
                   <ActiveIcon className="h-5.5 w-5.5" />
                </div>
                <div>
                  <h4 className="text-lg md:text-xl font-bold text-neutral-900 dark:text-white">
                    {activeContent?.title}
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Essential information and guidelines
                  </p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 scrollbar-none">
                {activeContent?.content}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

