import React from 'react';

// --- Label ---
interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
}
export const Label: React.FC<LabelProps> = ({ children, className = '', ...props }) => (
  <label className={`block text-xs font-semibold tracking-wide uppercase text-neutral-500 dark:text-neutral-400 mb-1.5 select-none ${className}`} {...props}>
    {children}
  </label>
);

// --- Input ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
export const Input: React.FC<InputProps> = ({ className = '', ...props }) => (
  <input
    className={`w-full px-4 py-2.5 text-sm rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-black/50 backdrop-blur-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all ${className}`}
    {...props}
  />
);

// --- Select ---
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
}
export const Select: React.FC<SelectProps> = ({ options, className = '', ...props }) => (
  <select
    className={`w-full px-4 py-2.5 text-sm rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-black/50 backdrop-blur-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all cursor-pointer ${className}`}
    {...props}
  >
    {options.map((opt) => (
      <option key={opt.value} value={opt.value} className="bg-white dark:bg-[#0A0A0A] text-neutral-900 dark:text-white">
        {opt.label}
      </option>
    ))}
  </select>
);

// --- Slider ---
interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  min: number;
  max: number;
  step?: number;
  labelValue?: string | number;
}
export const Slider: React.FC<SliderProps> = ({ min, max, step = 1, labelValue, className = '', ...props }) => (
  <div className="w-full flex items-center space-x-4">
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      className={`w-full h-1 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-accent focus:outline-none ${className}`}
      {...props}
    />
    {labelValue !== undefined && (
      <span className="text-xs font-mono font-bold text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
        {labelValue}
      </span>
    )}
  </div>
);

// --- Switch ---
interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
}
export const Switch: React.FC<SwitchProps> = ({ checked, onChange, id }) => (
  <button
    id={id}
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent/40 ${
      checked ? 'bg-accent' : 'bg-neutral-200 dark:bg-neutral-800'
    }`}
  >
    <span
      aria-hidden="true"
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);
