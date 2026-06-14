import React, { useRef } from 'react';
import { Label, Select, Slider, Switch } from '../../components/ui/Input';
import { PRESETS } from '../../utils/qrUtils';
import type { QRStyleOptions } from '../../utils/qrUtils';
import { Upload, X, ShieldAlert, RotateCw } from 'lucide-react';

interface CustomizationPanelProps {
  options: QRStyleOptions;
  setOptions: React.Dispatch<React.SetStateAction<QRStyleOptions>>;
}

export const CustomizationPanel: React.FC<CustomizationPanelProps> = ({ options, setOptions }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateOption = <K extends keyof QRStyleOptions>(key: K, value: QRStyleOptions[K]) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

  const applyPreset = (presetKey: string) => {
    const preset = PRESETS[presetKey];
    if (preset) {
      setOptions((prev) => ({ ...prev, ...preset }));
    }
  };

  const isPresetActive = (presetKey: string) => {
    const preset = PRESETS[presetKey];
    if (!preset) return false;
    return Object.entries(preset).every(
      ([k, v]) => options[k as keyof QRStyleOptions] === v
    );
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          updateOption('logoUrl', event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const clearLogo = () => {
    updateOption('logoUrl', null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Presets */}
      <div>
        <Label>Style Presets</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.keys(PRESETS).map((key) => {
            const label = key.charAt(0).toUpperCase() + key.slice(1);
            const isActive = isPresetActive(key);
            return (
              <button
                key={key}
                onClick={() => applyPreset(key)}
                className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all text-center focus:outline-none capitalize ${
                  isActive
                    ? 'border-accent text-accent bg-accent/5 dark:bg-accent/10 ring-1 ring-accent'
                    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 hover:border-accent hover:text-accent'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <hr className="border-neutral-100 dark:border-neutral-900" />

      {/* 2. Shape Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="module-type">QR Module Shape</Label>
          <Select
            id="module-type"
            value={options.moduleType}
            onChange={(e) => updateOption('moduleType', e.target.value as any)}
            options={[
              { value: 'square', label: 'Square (Classic)' },
              { value: 'rounded', label: 'Rounded Square' },
              { value: 'dots', label: 'Dots (Modern)' },
              { value: 'classy', label: 'Fluid Leaf (Sleek)' },
            ]}
          />
        </div>
        <div>
          <Label htmlFor="corner-type">Corner Eye Shape</Label>
          <Select
            id="corner-type"
            value={options.cornerType}
            onChange={(e) => updateOption('cornerType', e.target.value as any)}
            options={[
              { value: 'square', label: 'Square' },
              { value: 'rounded', label: 'Rounded' },
              { value: 'circle', label: 'Circle' },
              { value: 'extra-rounded', label: 'Extra Rounded' },
            ]}
          />
        </div>
      </div>

      <hr className="border-neutral-100 dark:border-neutral-900" />

      {/* 3. Colors Panel */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fg-type">Foreground Fill Mode</Label>
            <Select
              id="fg-type"
              value={options.foregroundType}
              onChange={(e) => updateOption('foregroundType', e.target.value as any)}
              options={[
                { value: 'solid', label: 'Solid Color' },
                { value: 'gradient', label: 'Gradient Fill' },
              ]}
            />
          </div>
          <div>
            <Label htmlFor="bg-color">Background Color</Label>
            <div className="flex items-center space-x-2">
              <input
                id="bg-color"
                type="color"
                value={options.backgroundColor === 'transparent' ? '#FFFFFF' : options.backgroundColor}
                onChange={(e) => updateOption('backgroundColor', e.target.value)}
                className="h-8 w-8 rounded cursor-pointer border-none"
                disabled={options.backgroundColor === 'transparent'}
              />
              <Select
                aria-label="Background Transparency Toggle"
                value={options.backgroundColor === 'transparent' ? 'transparent' : 'opaque'}
                onChange={(e) => {
                  if (e.target.value === 'transparent') {
                    updateOption('backgroundColor', 'transparent');
                  } else {
                    updateOption('backgroundColor', '#FFFFFF');
                  }
                }}
                options={[
                  { value: 'opaque', label: 'Opaque Background' },
                  { value: 'transparent', label: 'Transparent' },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Foreground Colors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fg-color">Primary Theme Color</Label>
            <div className="flex items-center space-x-3 bg-white/50 dark:bg-black/50 border border-neutral-200 dark:border-neutral-800 rounded-xl p-2 px-3">
              <input
                id="fg-color"
                type="color"
                value={options.foregroundColor}
                onChange={(e) => updateOption('foregroundColor', e.target.value)}
                className="h-8 w-8 rounded cursor-pointer border-none"
              />
              <span className="text-xs font-mono font-semibold uppercase">{options.foregroundColor}</span>
            </div>
          </div>

          {options.foregroundType === 'gradient' && (
            <div>
              <Label htmlFor="fg-grad-color">Gradient End Color</Label>
              <div className="flex items-center space-x-3 bg-white/50 dark:bg-black/50 border border-neutral-200 dark:border-neutral-800 rounded-xl p-2 px-3">
                <input
                  id="fg-grad-color"
                  type="color"
                  value={options.gradientColor2}
                  onChange={(e) => updateOption('gradientColor2', e.target.value)}
                  className="h-8 w-8 rounded cursor-pointer border-none"
                />
                <span className="text-xs font-mono font-semibold uppercase">{options.gradientColor2}</span>
              </div>
            </div>
          )}
        </div>

        {options.foregroundType === 'gradient' && (
          <div>
            <Label htmlFor="grad-type">Gradient Direction</Label>
            <Select
              id="grad-type"
              value={options.gradientType}
              onChange={(e) => updateOption('gradientType', e.target.value as any)}
              options={[
                { value: 'linear', label: 'Linear Gradient (Top-Left to Bottom-Right)' },
                { value: 'radial', label: 'Radial Gradient (Center out)' },
              ]}
            />
          </div>
        )}

        {/* Eye Colors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="corner-outer">Eye Border (Outer Ring)</Label>
            <div className="flex items-center space-x-3 bg-white/50 dark:bg-black/50 border border-neutral-200 dark:border-neutral-800 rounded-xl p-2 px-3">
              <input
                id="corner-outer"
                type="color"
                value={options.cornerOuterColor}
                onChange={(e) => updateOption('cornerOuterColor', e.target.value)}
                className="h-8 w-8 rounded cursor-pointer border-none"
              />
              <span className="text-xs font-mono font-semibold uppercase">{options.cornerOuterColor}</span>
            </div>
          </div>
          <div>
            <Label htmlFor="corner-inner">Eye Center (Inner Dot)</Label>
            <div className="flex items-center space-x-3 bg-white/50 dark:bg-black/50 border border-neutral-200 dark:border-neutral-800 rounded-xl p-2 px-3">
              <input
                id="corner-inner"
                type="color"
                value={options.cornerInnerColor}
                onChange={(e) => updateOption('cornerInnerColor', e.target.value)}
                className="h-8 w-8 rounded cursor-pointer border-none"
              />
              <span className="text-xs font-mono font-semibold uppercase">{options.cornerInnerColor}</span>
            </div>
          </div>
        </div>
      </div>

      <hr className="border-neutral-100 dark:border-neutral-900" />

      {/* 4. Logo Settings */}
      <div className="space-y-4">
        <div>
          <Label>Logo Overlay</Label>
          {options.logoUrl ? (
            <div className="flex items-center justify-between bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-3">
              <div className="flex items-center space-x-3">
                <img
                  src={options.logoUrl}
                  alt="Embedded logo preview"
                  className="h-10 w-10 object-contain rounded border border-neutral-200 dark:border-neutral-800 bg-white"
                />
                <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Custom Logo Embedded</span>
              </div>
              <button
                onClick={clearLogo}
                className="p-1 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
                aria-label="Remove logo"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center justify-center border border-dashed border-neutral-200 dark:border-neutral-800 hover:border-accent rounded-2xl py-6 bg-white/50 dark:bg-black/50 hover:bg-neutral-50 dark:hover:bg-neutral-950/20 transition-all focus:outline-none"
            >
              <Upload className="h-6 w-6 text-neutral-400 mb-2" />
              <span className="text-xs font-semibold tracking-wide uppercase text-neutral-600 dark:text-neutral-400">Upload Image / Icon</span>
              <span className="text-[10px] text-neutral-400 mt-0.5">PNG, JPG or SVG (Max 1MB)</span>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="hidden"
            id="logo-file-input"
          />
        </div>

        {options.logoUrl && (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <Label htmlFor="logo-size-slider">Logo Scaling</Label>
              </div>
              <Slider
                id="logo-size-slider"
                min={10}
                max={30}
                value={options.logoSize}
                onChange={(e) => updateOption('logoSize', parseInt(e.target.value))}
                labelValue={`${options.logoSize}%`}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">White Background Buffer</span>
                <p className="text-[10px] text-neutral-400">Creates a clean margin around the logo</p>
              </div>
              <Switch
                id="logo-padding-switch"
                checked={options.logoPadding}
                onChange={(checked) => updateOption('logoPadding', checked)}
              />
            </div>

            {options.logoSize > 22 && options.errorCorrectionLevel !== 'H' && (
              <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <ShieldAlert className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" />
                <span className="text-[10px] leading-relaxed">
                  <strong>Warning:</strong> Larger logo sizes might require setting error correction level to <strong>High (Level H)</strong> for correct scanning.
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <hr className="border-neutral-100 dark:border-neutral-900" />

      {/* 5. General Sizing & Margin */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="qr-padding-slider">Quiet Zone Padding</Label>
          <Slider
            id="qr-padding-slider"
            min={10}
            max={80}
            value={options.padding}
            onChange={(e) => updateOption('padding', parseInt(e.target.value))}
            labelValue={`${options.padding}px`}
          />
        </div>

        <div>
          <Label htmlFor="qr-error-level">Error Correction Level</Label>
          <Select
            id="qr-error-level"
            value={options.errorCorrectionLevel}
            onChange={(e) => updateOption('errorCorrectionLevel', e.target.value as any)}
            options={[
              { value: 'L', label: 'Level L (Low - ~7% recovery)' },
              { value: 'M', label: 'Level M (Medium - ~15% recovery)' },
              { value: 'Q', label: 'Level Q (Quarter - ~25% recovery)' },
              { value: 'H', label: 'Level H (High - ~30% recovery)' },
            ]}
          />
        </div>

        <div>
          <Label>QR Code Angle Rotation</Label>
          <div className="grid grid-cols-4 gap-2">
            {[0, 90, 180, 270].map((deg) => (
              <button
                key={deg}
                onClick={() => updateOption('rotation', deg)}
                className={`flex items-center justify-center space-x-1.5 py-2 text-xs font-semibold rounded-xl border transition-all ${
                  options.rotation === deg
                    ? 'border-accent text-accent bg-accent/5 dark:bg-accent/10'
                    : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <RotateCw className={`h-3 w-3 ${options.rotation === deg ? 'text-accent' : 'text-neutral-400'}`} />
                <span>{deg}°</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
