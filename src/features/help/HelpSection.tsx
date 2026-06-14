import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Shield, Printer, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AccordionItemProps {
  title: string;
  icon: React.ComponentType<any>;
  children: React.ReactNode;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ title, icon: Icon, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-neutral-200 dark:border-neutral-900 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-4 text-left focus:outline-none"
        aria-expanded={isOpen}
      >
        <div className="flex items-center space-x-3 text-neutral-800 dark:text-neutral-200">
          <Icon className="h-5 w-5 text-accent" />
          <span className="text-sm font-semibold tracking-wide">{title}</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-neutral-450"
        >
          <ChevronDown className="h-4.5 w-4.5" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pb-5 text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed space-y-2.5">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const HelpSection: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-1.5">
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Built-in QR Education</h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">Everything you need to know to generate scan-perfect QR codes.</p>
      </div>

      <div className="bg-white dark:bg-[#0E0E0E] border border-neutral-200 dark:border-neutral-900 rounded-3xl p-6 shadow-premium dark:shadow-premium-dark divide-y divide-neutral-200 dark:divide-neutral-900">
        <AccordionItem title="What is a QR Code?" icon={HelpCircle}>
          <p>
            A <strong>QR Code</strong> (Quick Response Code) is a two-dimensional matrix barcode invented in 1994 by the Japanese company Denso Wave.
            Unlike standard barcodes that store data horizontally (one-dimensional), QR codes encode information in both vertical and horizontal directions, enabling them to store up to 300 times more data.
          </p>
          <p>
            The modules (black and white squares) translate to binary values (0s and 1s) representing alphanumeric, numeric, or raw byte characters.
            The three prominent outer corners are finder patterns that let cameras instantly calculate the rotation angle, direction, and dimensions during scanning.
          </p>
        </AccordionItem>

        <AccordionItem title="How does Error Correction work?" icon={Shield}>
          <p>
            QR codes use <strong>Reed-Solomon Error Correction</strong> mathematical logic.
            This creates duplicate backup databits inside the matrix, allowing codes to remain scannable even if they are dirty, torn, or partially blocked.
          </p>
          <p>
            There are four standard levels of error correction:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Level L (Low):</strong> Rebuilds up to <strong>7%</strong> of missing data. Ideal for simple texts or maximum matrix resolution.</li>
            <li><strong>Level M (Medium):</strong> Rebuilds up to <strong>15%</strong> of missing data. The standard default for most links.</li>
            <li><strong>Level Q (Quarter):</strong> Rebuilds up to <strong>25%</strong> of missing data. Suitable for harsh environments.</li>
            <li><strong>Level H (High):</strong> Rebuilds up to <strong>30%</strong> of missing data. <strong>Mandatory</strong> when placing overlay logos or icons in the center.</li>
          </ul>
        </AccordionItem>

        <AccordionItem title="Best Printing Practices" icon={Printer}>
          <p>
            To guarantee physical scanning success, follow these industrial printing checklists:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Use Vector Formats:</strong> Export your QR code as an <strong>SVG file</strong>. SVG vectors can be scaled to billboard size without pixelation or blurriness.</li>
            <li><strong>Print Resolution:</strong> Ensure raster images (PNG, JPEG) are printed at at least <strong>300 DPI</strong> to maintain sharp edges.</li>
            <li><strong>Matte Finish:</strong> Print on matte paper or textured material. Glossy coatings reflect light into camera lenses, blinding the decoder sensor.</li>
            <li><strong>Size Guideline:</strong> The QR code should measure at least <strong>2.0 cm (0.8 inches)</strong> in width on flyers or business cards.</li>
          </ul>
        </AccordionItem>

        <AccordionItem title="Scan Optimization Tips" icon={Camera}>
          <p>
            If your QR code is not scanning, check these three parameters:
          </p>
          <ol className="list-decimal pl-5 space-y-1.5">
            <li>
              <strong>High Color Contrast:</strong> The foreground color must be significantly darker than the background color. Avoid light grey details on white backgrounds.
            </li>
            <li>
              <strong>Respect the Quiet Zone (Padding):</strong> QR cameras require a margin buffer (quiet zone) of at least 4 module widths around the QR border to separate it from surrounding text or artwork. Do not crop the padding to 0.
            </li>
            <li>
              <strong>Avoid Logo Overcrowding:</strong> If you embed a logo in the center, keep its size under 20% of the QR area and use <strong>Level H</strong> error correction. Ensure the logo does not block the finder pattern blocks.
            </li>
          </ol>
        </AccordionItem>
      </div>
    </div>
  );
};
