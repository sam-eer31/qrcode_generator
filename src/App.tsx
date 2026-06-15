import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  Palette,
  Settings,
  HelpCircle,
  History,
  FileText,
  Bookmark,
  ListFilter,
  Check,
  Zap,
  Info,
  Layers,
  QrCode,
  Download,
  CloudUpload,
} from 'lucide-react';

// Common UI Components
import { Button } from './components/ui/Button';
import { Modal } from './components/ui/Modal';
import { Select, Label } from './components/ui/Input';
import { ThemeToggle } from './components/ui/ThemeToggle';
import { CommandPalette } from './components/ui/CommandPalette';


// Hooks
import { useLocalStorage } from './hooks/useLocalStorage';
import { useKeyPress } from './hooks/useKeyPress';

// Utilities & Options
import { drawCustomQR, DEFAULT_STYLE, PRESETS } from './utils/qrUtils';
import type { QRStyleOptions } from './utils/qrUtils';

// Feature Views
import { Hero } from './features/hero/Hero';
import {
  UrlForm,
  TextForm,
  WifiForm,
  EmailForm,
  PhoneForm,
  SmsForm,
  LocationForm,
  VcardForm,
  CalendarForm,
  CryptoForm,
} from './features/generator/GeneratorForms';
import { CustomizationPanel } from './features/customize/CustomizationPanel';
import { DecoderTab } from './features/decoder/DecoderTab';
import { InspectorTab } from './features/inspector/InspectorTab';
import { ExportPanel } from './features/export/ExportPanel';
import { HistoryPanel } from './features/history/HistoryPanel';
import type { HistoryItem } from './features/history/HistoryPanel';
import { HelpSection } from './features/help/HelpSection';
import { PublicShareViewer } from './features/generator/PublicShareViewer';
import { HeaderAuth } from './components/HeaderAuth';
import { CloudDashboard } from './features/generator/CloudDashboard';
import { CloudShareView } from './features/generator/CloudShareView';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('generate');
  const [qrText, setQrText] = useState<string>('https://google.com');
  const [qrType, setQrType] = useState<string>('url');
  const [shareId, setShareId] = useState<string | null>(null);
  const [showCloudDashboard, setShowCloudDashboard] = useState(false);
  
  // Export Mode State
  const [exportMode, setExportMode] = useState<'single' | 'batch'>('single');
  const [batchTexts, setBatchTexts] = useState<string>('https://google.com\nhttps://youtube.com\nhttps://github.com');


  // Cache generated outputs for each format category to prevent tab unmounting resets
  const [qrTextCache, setQrTextCache] = useState<Record<string, string>>({
    url: 'https://google.com',
    text: 'Hello, QR Studio!',
    wifi: 'WIFI:S:HomeNetwork;T:WPA;P:SecretPassword;;',
    email: 'mailto:hello@qrstudio.dev?subject=Hello%20from%20QR%2520Studio!&body=Check%20out%20this%2520custom%20QR%2520Toolkit.',
    phone: 'tel:+1234567890',
    sms: 'smto:+1234567890:Scan my QR code!',
    location: 'geo:37.7749,-122.4194',
    vcard: 'BEGIN:VCARD\nVERSION:3.0\nN:Morgan;Alex;;;\nFN:Alex Morgan\nORG:QR Studio Corp\nTEL;TYPE=CELL:+1 (555) 019-2834\nEMAIL;TYPE=PREF,INTERNET:alex@qrstudio.dev\nURL:https://qrstudio.vercel.app\nEND:VCARD',
    calendar: 'BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:Product Launch Keynote\nDESCRIPTION:Unveiling QR Studio features.\nLOCATION:San Francisco, CA\nDTSTART:20260701T100000Z\nDTEND:20260701T120000Z\nEND:VEVENT\nEND:VCALENDAR',
    crypto: 'ethereum:0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
  });
  
  // Customization styling state
  const [options, setOptions] = useState<QRStyleOptions>(DEFAULT_STYLE);

  // Search Command Palette trigger
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  
  // Settings modal trigger
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useLocalStorage('app-settings', {
    defaultFormat: 'png',
    defaultSize: 1024,
    animationsEnabled: true,
    commandPaletteEnabled: false,
  });

  // Local storage history state
  const [historyItems, setHistoryItems] = useLocalStorage<HistoryItem[]>('qr-studio-history', []);
  const [projectName, setProjectName] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Reference for live canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const batchCanvasRef1 = useRef<HTMLCanvasElement>(null);
  const batchCanvasRef2 = useRef<HTMLCanvasElement>(null);
  const batchCanvasRef3 = useRef<HTMLCanvasElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const [isMac, setIsMac] = useState(false);

  // Stable text changer callback to prevent infinite re-render loops in forms
  const handleTextChange = useCallback((textValue: string) => {
    setQrText(textValue);
    setQrTextCache((prev) => ({ ...prev, [qrType]: textValue }));
  }, [qrType]);

  // Redraw QR code when text, styles, or activeTab changes (to handle canvas remounting)
  useEffect(() => {
    if (canvasRef.current) {
      drawCustomQR(canvasRef.current, qrText, options);
    }
  }, [qrText, options, activeTab, exportMode]);

  // Redraw batch preview canvases
  useEffect(() => {
    if (activeTab === 'export' && exportMode === 'batch') {
      const items = batchTexts.split('\n').map((t) => t.trim()).filter(Boolean);
      if (items[0] && batchCanvasRef1.current) drawCustomQR(batchCanvasRef1.current, items[0], options);
      if (items[1] && batchCanvasRef2.current) drawCustomQR(batchCanvasRef2.current, items[1], options);
      if (items[2] && batchCanvasRef3.current) drawCustomQR(batchCanvasRef3.current, items[2], options);
    }
  }, [batchTexts, options, activeTab, exportMode]);

  // Apply default size from settings to options when app loads
  useEffect(() => {
    setOptions(prev => ({ ...prev, size: settings.defaultSize }));
  }, [settings.defaultSize]);

  // Check URL parameters for shared content on initial mount
  useEffect(() => {
    setIsMac(navigator.userAgent.includes('Mac'));
    const urlParams = new URLSearchParams(window.location.search);
    const share = urlParams.get('share');
    if (share) {
      setShareId(share);
    }
  }, []);

  // Command palette keyboard shortcut listener (CMD+K or CTRL+K)
  useKeyPress('k', (e) => {
    if (!settings.commandPaletteEnabled) return;
    e.preventDefault();
    setIsPaletteOpen(prev => !prev);
  }, { ctrlOrCmd: true, ignoreInputs: false });

  // Tab key shortcuts: G (Generate), D (Decode), I (Inspect), E (Export)
  useKeyPress('g', () => {
    setActiveTab('generate');
    scrollToWorkspace();
  });
  useKeyPress('d', () => {
    setActiveTab('decode');
    scrollToWorkspace();
  });
  useKeyPress('i', () => {
    setActiveTab('inspect');
    scrollToWorkspace();
  });
  useKeyPress('e', () => {
    setActiveTab('export');
    scrollToWorkspace();
  });
  useKeyPress('c', () => {
    setActiveTab('cloud');
    scrollToWorkspace();
  });
  useKeyPress('?', (e) => {
    e.preventDefault();
    setActiveTab('help');
    scrollToWorkspace();
  });

  // Scroll to workspace helper
  const scrollToWorkspace = () => {
    workspaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Preset applying trigger
  const handleApplyPreset = (presetKey: string) => {
    const preset = PRESETS[presetKey];
    if (preset) {
      setOptions((prev) => ({ ...prev, ...preset }));
    }
  };



  // Save QR to history
  const handleSaveToHistory = () => {
    const name = projectName.trim() || `QR Project #${historyItems.length + 1}`;
    const newItem: HistoryItem = {
      id: `qr-${Date.now()}`,
      name,
      text: qrText,
      type: qrType,
      options: { ...options },
      timestamp: Date.now(),
      isFavorite: false,
    };

    setHistoryItems(prev => [newItem, ...prev]);
    setProjectName('');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // Load project from history
  const handleLoadItem = (item: HistoryItem) => {
    setQrText(item.text);
    setQrType(item.type);
    setQrTextCache(prev => ({ ...prev, [item.type]: item.text }));
    setOptions(item.options);
    setActiveTab('generate');
    scrollToWorkspace();
  };

  // Delete history item
  const handleDeleteItem = (id: string) => {
    setHistoryItems(prev => prev.filter(item => item.id !== id));
  };

  // Toggle favorite status
  const handleToggleFavorite = (id: string) => {
    setHistoryItems(prev =>
      prev.map(item => (item.id === id ? { ...item, isFavorite: !item.isFavorite } : item))
    );
  };

  // Clear all history logs
  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear your local QR history? This cannot be undone.')) {
      setHistoryItems([]);
    }
  };

  // Reset all preferences & styles
  const handleResetSettings = () => {
    if (window.confirm('Reset all designs and settings back to factory defaults?')) {
      setOptions({ ...DEFAULT_STYLE, size: settings.defaultSize });
      setSettings({
        defaultFormat: 'png',
        defaultSize: 1024,
        animationsEnabled: true,
        commandPaletteEnabled: false,
      });
      setIsSettingsOpen(false);
    }
  };

  // Render the current Form type based on selection
  const renderGeneratorForm = () => {

    switch (qrType) {
      case 'url':
        return <UrlForm initialText={qrTextCache.url} onChange={handleTextChange} />;
      case 'text':
        return <TextForm initialText={qrTextCache.text} onChange={handleTextChange} />;
      case 'wifi':
        return <WifiForm initialText={qrTextCache.wifi} onChange={handleTextChange} />;
      case 'email':
        return <EmailForm initialText={qrTextCache.email} onChange={handleTextChange} />;
      case 'phone':
        return <PhoneForm initialText={qrTextCache.phone} onChange={handleTextChange} />;
      case 'sms':
        return <SmsForm initialText={qrTextCache.sms} onChange={handleTextChange} />;
      case 'location':
        return <LocationForm initialText={qrTextCache.location} onChange={handleTextChange} />;
      case 'vcard':
        return <VcardForm initialText={qrTextCache.vcard} onChange={handleTextChange} />;
      case 'calendar':
        return <CalendarForm initialText={qrTextCache.calendar} onChange={handleTextChange} />;
      case 'crypto':
        return <CryptoForm initialText={qrTextCache.crypto} onChange={handleTextChange} />;
      default:
        return <UrlForm initialText={qrTextCache.url} onChange={handleTextChange} />;
    }
  };

  const tabsList = [
    { id: 'generate', label: 'Generate', icon: Compass },
    { id: 'customize', label: 'Customize', icon: Palette },
    { id: 'decode', label: 'Decode', icon: ListFilter },
    { id: 'inspect', label: 'Inspect', icon: Info },
    { id: 'export', label: 'Export', icon: FileText },
    { id: 'cloud', label: 'Cloud Share', icon: CloudUpload },
    { id: 'history', label: 'History', icon: History },
    { id: 'help', label: 'Help', icon: HelpCircle },
  ];

  if (shareId) {
    return <PublicShareViewer shareId={shareId} />;
  }

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark text-black dark:text-white transition-colors duration-300">
      
      {/* 1. Header Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/60 dark:bg-[#0A0A0A]/60 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-900 px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <img src="/icon.svg" alt="QR Studio Brand Icon" className="h-8 w-8 object-contain" />
          <div>
            <h1 className="text-sm font-black tracking-wide font-sans">QR STUDIO</h1>
            <span className="hidden sm:block text-[9px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">The Open-Source QR Toolkit</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {settings.commandPaletteEnabled && (
            <button
              onClick={() => setIsPaletteOpen(true)}
              className="hidden sm:flex items-center space-x-3 px-3 py-1.5 rounded-full border border-neutral-200/50 dark:border-neutral-850 bg-white/40 dark:bg-black/40 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors shadow-premium dark:shadow-premium-dark focus:outline-none"
              aria-label="Search Command Palette"
            >
              <span>Search commands...</span>
              <kbd className="px-1.5 py-0.5 rounded border border-neutral-200/50 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 font-mono text-[9px]">
                {isMac ? 'Cmd+K' : 'Ctrl+K'}
              </kbd>
            </button>
          )}

          <HeaderAuth onOpenDashboard={() => setShowCloudDashboard(true)} />

          <ThemeToggle />

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center justify-center h-10 w-10 rounded-full border border-neutral-200/50 dark:border-neutral-800/50 bg-white/50 dark:bg-black/50 backdrop-blur-md text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors shadow-premium focus:outline-none"
            aria-label="Open settings panel"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* 2. Hero Landing Fold */}
      <Hero
        onCreateClick={scrollToWorkspace}
        onCloudClick={() => {
          setActiveTab('cloud');
          scrollToWorkspace();
        }}
        commandPaletteEnabled={settings.commandPaletteEnabled}
      />

      {/* 3. Main Workspace Container */}
      <main
        ref={workspaceRef}
        className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-16 space-y-4 md:space-y-8 min-h-[80vh] scroll-mt-20"
      >
        {/* Workspace header & dynamic title */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-neutral-200 dark:border-neutral-900 pb-5">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white capitalize">
              {activeTab === 'generate' ? 'QR Code Data Input' : `${activeTab} Workspace`}
            </h2>
            <p className="text-xs text-neutral-400 mt-1 font-medium">
              Configure parameters, designs, analyze decodings, or export high quality files.
            </p>
          </div>
          
          {/* Tabs bar */}
          <div className="flex overflow-x-auto whitespace-nowrap scrollbar-none gap-1 p-1.5 rounded-2xl bg-white dark:bg-[#0E0E0E] border border-neutral-200 dark:border-neutral-900 w-full sm:w-fit shadow-premium dark:shadow-premium-dark select-none -mx-4 px-4 sm:mx-0 sm:px-1.5">
            {tabsList.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              const isCloud = t.id === 'cloud';
              
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`relative flex-shrink-0 flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all focus:outline-none ${
                    isActive
                      ? isCloud
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25 scale-105 z-10'
                        : 'bg-neutral-900 text-white dark:bg-white dark:text-black'
                      : isCloud
                        ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 border border-blue-200 dark:border-blue-500/30'
                        : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-350'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isCloud && !isActive ? 'animate-pulse' : ''}`} />
                  <span>{t.label}</span>
                  {isCloud && (
                    <span className={`ml-1.5 flex items-center space-x-1 text-[8px] px-1.5 py-0.5 rounded-md uppercase tracking-wider font-black shadow-sm ${isActive ? 'bg-white/20 text-white' : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'}`}>
                      <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                      <span>Live</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Split Layout Panes */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8 items-start">
          
          {/* Left Feature Panel Column */}
          {(() => {
            const isThreeColumnLayout = activeTab === 'generate' || activeTab === 'customize' || (activeTab === 'export' && exportMode === 'single');
            const hasRightColumn = activeTab === 'generate' || activeTab === 'customize' || activeTab === 'export';
            return (
              <div className={`${isThreeColumnLayout ? 'lg:col-span-8' : 'lg:col-span-12'} ${hasRightColumn ? 'order-2 lg:order-1' : ''} bg-white/50 dark:bg-[#0C0C0C]/50 backdrop-blur-md rounded-3xl p-4 md:p-8 border border-neutral-200 dark:border-white/5 shadow-glass dark:shadow-glass-dark transition-all duration-300`}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.2 }}
                  >
                {/* A. Generate View */}
                {activeTab === 'generate' && (
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="qr-datatype-selector">QR Data Category</Label>
                      <Select
                        id="qr-datatype-selector"
                        value={qrType}
                        onChange={(e) => {
                          const newType = e.target.value;
                          setQrType(newType);
                          setQrText(qrTextCache[newType]);
                        }}
                        options={[
                          { value: 'url', label: 'Website Link (URL)' },
                          { value: 'text', label: 'Plain Text Message' },
                          { value: 'wifi', label: 'WiFi Local Connection' },
                          { value: 'email', label: 'Email Draft (mailto)' },
                          { value: 'phone', label: 'Phone Call Dial' },
                          { value: 'sms', label: 'SMS Message Direct' },
                          { value: 'location', label: 'Geo Location Coords' },
                          { value: 'vcard', label: 'vCard Contact Card' },
                          { value: 'calendar', label: 'Calendar Event Reminder' },
                          { value: 'crypto', label: 'Crypto Wallet Address' }
                        ]}
                      />
                    </div>
                    
                    <hr className="border-neutral-200 dark:border-neutral-900" />
                    {renderGeneratorForm()}
                  </div>
                )}

                {/* E. Cloud Share Tab */}
                {activeTab === 'cloud' && (
                  <CloudShareView 
                    onLinkGenerated={(link: string) => {
                      setQrText(link);
                      setQrType('url');
                      // Auto-tab switch removed so users see the success state
                    }}
                  />
                )}

                {/* B. Customize View */}
                {activeTab === 'customize' && (
                  <CustomizationPanel options={options} setOptions={setOptions} />
                )}

                {/* C. Decode View */}
                {activeTab === 'decode' && <DecoderTab />}

                {/* D. Inspect View */}
                {activeTab === 'inspect' && <InspectorTab />}

                {/* E. Export View */}
                {activeTab === 'export' && (
                  <ExportPanel 
                    text={qrText} 
                    options={options}
                    exportMode={exportMode}
                    setExportMode={setExportMode}
                    batchTexts={batchTexts}
                    setBatchTexts={setBatchTexts}
                  />
                )}

                {/* F. History View */}
                {activeTab === 'history' && (
                  <HistoryPanel
                    items={historyItems}
                    onLoadItem={handleLoadItem}
                    onDeleteItem={handleDeleteItem}
                    onToggleFavorite={handleToggleFavorite}
                    onClearHistory={handleClearHistory}
                  />
                )}

                {/* G. Help View */}
                {activeTab === 'help' && <HelpSection />}
              </motion.div>
            </AnimatePresence>
          </div>
            );
          })()}

          {/* Right Live Preview Sticky Column (Single Mode) */}
          {(activeTab === 'generate' || activeTab === 'customize' || (activeTab === 'export' && exportMode === 'single')) && (
            <div className="lg:col-span-4 order-1 lg:order-2 lg:sticky lg:top-24 space-y-4 md:space-y-6 w-full">
              <div className="bg-white dark:bg-[#0E0E0E] border border-neutral-200 dark:border-neutral-900 rounded-3xl p-4 md:p-6 shadow-premium dark:shadow-premium-dark flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 select-none">Live Canvas Preview</span>
                  <div className="flex items-center space-x-1 border border-neutral-200 dark:border-neutral-900 bg-neutral-50/50 dark:bg-neutral-950/20 px-2 py-0.5 rounded-full text-[9px] font-bold text-neutral-500 uppercase">
                    <Zap className="h-3 w-3 text-amber-500 fill-current" />
                    <span>Instant Update</span>
                  </div>
                </div>

                {/* Styled Canvas Area */}
                <div className="w-full aspect-square max-w-[280px] bg-neutral-50 dark:bg-neutral-950 rounded-2xl border border-neutral-200 dark:border-neutral-850 p-4 flex items-center justify-center relative shadow-glass dark:shadow-glass-dark">
                  <canvas ref={canvasRef} className="max-w-full max-h-full qr-preview-canvas rounded" />
                </div>

                {/* Proceed to Export Button */}
                {activeTab !== 'export' && (
                  <div className="w-full max-w-[280px] mt-4">
                    <Button 
                      onClick={() => {
                        setActiveTab('export');
                        scrollToWorkspace();
                      }} 
                      className="w-full py-3 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transition-all"
                    >
                      <Download className="w-4 h-4" />
                      <span>Proceed to Export</span>
                    </Button>
                  </div>
                )}

                {/* Save design to history form */}
                <div className="w-full mt-6 space-y-3 pt-4 border-t border-neutral-200 dark:border-neutral-900">
                  <div>
                    <Label htmlFor="project-name-input">Save design project name</Label>
                    <div className="flex space-x-2">
                      <input
                        id="project-name-input"
                        type="text"
                        placeholder="e.g. My Website Link"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-black/50 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                      <Button
                        onClick={handleSaveToHistory}
                        variant="secondary"
                        size="sm"
                        className="px-4 py-1.5 flex-shrink-0"
                      >
                        {saveSuccess ? <Check className="h-4 w-4 text-success" /> : <Bookmark className="h-4 w-4 text-accent" />}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Stats spec details */}
                <div className="w-full mt-4 space-y-2 text-[10px] font-semibold text-neutral-400 select-none uppercase tracking-wider pt-4 border-t border-neutral-200 dark:border-neutral-900">
                  <div className="flex justify-between">
                    <span>Active Size</span>
                    <span className="text-neutral-600 dark:text-neutral-300 font-mono font-bold">{options.size} px</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Data Length</span>
                    <span className="text-neutral-600 dark:text-neutral-300 font-mono font-bold">{qrText.length} chars</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Error Recovery</span>
                    <span className="text-neutral-600 dark:text-neutral-300 font-mono font-bold">Level {options.errorCorrectionLevel}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Right Dashboard Sticky Column (Batch Mode) */}
          {activeTab === 'export' && exportMode === 'batch' && (
            <div className="lg:col-span-4 order-1 lg:order-2 lg:sticky lg:top-24 space-y-4 md:space-y-6 w-full">
              <div className="bg-white dark:bg-[#0E0E0E] border border-neutral-200 dark:border-neutral-900 rounded-3xl p-4 md:p-6 shadow-premium dark:shadow-premium-dark flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 select-none">Batch Overview</span>
                  <div className="flex items-center space-x-1 border border-neutral-200 dark:border-neutral-900 bg-neutral-50/50 dark:bg-neutral-950/20 px-2 py-0.5 rounded-full text-[9px] font-bold text-neutral-500 uppercase">
                    <Layers className="h-3 w-3 text-accent" />
                    <span>Multi-Thread</span>
                  </div>
                </div>

                {/* Cool Stack Visual */}
                <div className="w-full aspect-square max-w-[280px] bg-neutral-50 dark:bg-neutral-950 rounded-2xl border border-neutral-200 dark:border-neutral-850 p-4 flex flex-col items-center justify-center relative shadow-glass dark:shadow-glass-dark mb-2">
                  <div className="relative w-32 h-32 mt-4">
                    {(() => {
                       const items = batchTexts.split('\n').map((t) => t.trim()).filter(Boolean);
                       const has1 = items.length > 0;
                       const has2 = items.length > 1;
                       const has3 = items.length > 2;

                       return (
                         <>
                            {/* Background card 2 (Item 3) */}
                            <div className="absolute inset-0 bg-white dark:bg-[#0A0A0A] border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm transform translate-x-6 -translate-y-6 opacity-40 flex items-center justify-center overflow-hidden">
                               {has3 ? <canvas ref={batchCanvasRef3} className="w-full h-full object-cover" /> : <div className="text-neutral-300 dark:text-neutral-700"><QrCode className="w-8 h-8 opacity-50" /></div>}
                            </div>
                            
                            {/* Background card 1 (Item 2) */}
                            <div className="absolute inset-0 bg-white dark:bg-[#0A0A0A] border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm transform translate-x-3 -translate-y-3 opacity-70 flex items-center justify-center overflow-hidden">
                               {has2 ? <canvas ref={batchCanvasRef2} className="w-full h-full object-cover" /> : <div className="text-neutral-300 dark:text-neutral-700"><QrCode className="w-8 h-8 opacity-50" /></div>}
                            </div>
                            
                            {/* Foreground card (Item 1) */}
                            <div className="absolute inset-0 bg-white dark:bg-[#0A0A0A] border-2 border-accent rounded-xl shadow-lg flex flex-col items-center justify-center z-10 overflow-hidden bg-white dark:bg-[#0A0A0A]">
                               {has1 ? <canvas ref={batchCanvasRef1} className="w-full h-full object-cover p-1" /> : (
                                  <>
                                    <QrCode className="h-10 w-10 text-neutral-800 dark:text-neutral-200 mb-2 opacity-50" />
                                    <span className="text-[10px] font-bold text-neutral-400">Empty Batch</span>
                                  </>
                               )}
                            </div>
                         </>
                       );
                    })()}
                  </div>
                </div>

                {/* Stats spec details */}
                <div className="w-full mt-4 space-y-3 text-[10px] font-semibold text-neutral-400 select-none uppercase tracking-wider pt-4 border-t border-neutral-200 dark:border-neutral-900">
                  <div className="flex justify-between items-center">
                    <span>Valid Items Detected</span>
                    <span className="text-accent bg-accent/10 px-2 py-0.5 rounded font-mono font-bold text-xs">{batchTexts.split('\n').filter(t => t.trim()).length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Estimated Processing</span>
                    <span className="text-neutral-600 dark:text-neutral-300 font-mono font-bold">~{((batchTexts.split('\n').filter(t => t.trim()).length * 350) / 1000).toFixed(1)}s</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Output Type</span>
                    <span className="text-neutral-600 dark:text-neutral-300 font-mono font-bold">Zip Archive / Multi</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        setTab={setActiveTab}
        applyPreset={handleApplyPreset}
        historyItems={historyItems}
        loadHistoryItem={(id) => {
          const item = historyItems.find((i) => i.id === id);
          if (item) handleLoadItem(item);
        }}
      />

      {/* Cloud Dashboard Modal Overlay */}
      <Modal
        isOpen={showCloudDashboard}
        onClose={() => setShowCloudDashboard(false)}
        title="My Cloud Links"
      >
        <CloudDashboard />
      </Modal>

      {/* 6. Settings Modal */}
      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Application Preferences"
      >
        <div className="space-y-6">
          <div>
            <Label htmlFor="default-format-selector">Default Export Format</Label>
            <Select
              id="default-format-selector"
              value={settings.defaultFormat}
              onChange={(e) => setSettings(prev => ({ ...prev, defaultFormat: e.target.value }))}
              options={[
                { value: 'png', label: 'PNG Raster (.png)' },
                { value: 'svg', label: 'SVG Vector (.svg)' },
                { value: 'jpeg', label: 'JPEG Image (.jpg)' },
                { value: 'webp', label: 'WebP Format (.webp)' },
                { value: 'pdf', label: 'PDF Document (.pdf)' },
              ]}
            />
          </div>

          <div>
            <Label htmlFor="default-resolution-selector">Default Canvas Resolution</Label>
            <Select
              id="default-resolution-selector"
              value={settings.defaultSize.toString()}
              onChange={(e) => setSettings(prev => ({ ...prev, defaultSize: parseInt(e.target.value) }))}
              options={[
                { value: '512', label: '512 px (Standard)' },
                { value: '1024', label: '1024 px (High Res)' },
                { value: '2048', label: '2048 px (Ultra High)' },
                { value: '4096', label: '4096 px (Print Quality)' },
              ]}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-350">Page Animations</span>
              <p className="text-[10px] text-neutral-400">Enable smooth Framer Motion transitions</p>
            </div>
            <button
              onClick={() => setSettings(prev => ({ ...prev, animationsEnabled: !prev.animationsEnabled }))}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.animationsEnabled ? 'bg-accent' : 'bg-neutral-200 dark:bg-neutral-800'
              }`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                settings.animationsEnabled ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-350">Command Palette</span>
              <p className="text-[10px] text-neutral-400">Enable search bar and {isMac ? 'Cmd+K' : 'Ctrl+K'} shortcuts</p>
            </div>
            <button
              onClick={() => setSettings(prev => ({ ...prev, commandPaletteEnabled: !prev.commandPaletteEnabled }))}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.commandPaletteEnabled ? 'bg-accent' : 'bg-neutral-200 dark:bg-neutral-800'
              }`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                settings.commandPaletteEnabled ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          <hr className="border-neutral-200 dark:border-neutral-900" />



          <div className="border-t border-neutral-200 dark:border-neutral-900 pt-4 flex space-x-3">
            <Button
              onClick={handleResetSettings}
              variant="outline"
              className="w-full text-red-500 border-red-500/30 hover:bg-red-500/10 hover:text-red-600"
            >
              Reset Settings
            </Button>
            <Button
              onClick={() => setIsSettingsOpen(false)}
              variant="primary"
              className="w-full"
            >
              Done
            </Button>
          </div>
        </div>
      </Modal>

      {/* 7. Footer */}
      <footer className="border-t border-neutral-200 dark:border-neutral-900 py-12 px-4 md:px-8 bg-neutral-50/50 dark:bg-neutral-950/20 text-center space-y-3.5 select-none z-10 relative">
        <div className="flex justify-center space-x-2 items-center text-xs font-semibold text-neutral-400">
          <span>QR Studio</span>
          <span>•</span>
          <span>MIT Licensed</span>
          <span>•</span>
          <span>Lightning Fast</span>
        </div>
        <p className="text-[10px] text-neutral-400/80 max-w-md mx-auto leading-relaxed">
          QR Studio is a powerful, open-source QR code toolkit. Built for modern browsers.
        </p>
      </footer>
    </div>
  );
}
