import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { HiEye, HiVolumeUp, HiHand, HiCog, HiTranslate, HiColorSwatch } from 'react-icons/hi';
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation';

type TextSize = 'normal' | 'large' | 'xlarge';
type ColorMode = 'default' | 'deuteranopia' | 'protanopia' | 'tritanopia';

interface AccessibilitySettings {
  highContrast: boolean;
  screenReader: boolean;
  signLanguage: boolean;
  textSize: TextSize;
  speechRate: number;
  colorMode: ColorMode;
}

type OptionBase = {
  id: string;
  label: string;
};

type ToggleOption = OptionBase & {
  type: 'toggle';
  value: boolean;
  onChange: () => void;
};

type SelectOption<T> = OptionBase & {
  type: 'select';
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
};

type RangeOption = OptionBase & {
  type: 'range';
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
};

type AccessibilityOption = 
  | ToggleOption 
  | SelectOption<TextSize>
  | SelectOption<ColorMode>
  | RangeOption;

type FeatureSection = {
  id: string;
  title: string;
  description: string;
  icon: typeof HiEye | typeof HiVolumeUp | typeof HiHand | typeof HiTranslate | typeof HiColorSwatch;
  options: AccessibilityOption[];
};

export default function AccessibilityPanel() {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    highContrast: false,
    screenReader: false,
    signLanguage: false,
    textSize: 'normal',
    speechRate: 1,
    colorMode: 'default',
  });

  const [focusedFeatureIndex, setFocusedFeatureIndex] = useState(0);
  const [focusedOptionIndex, setFocusedOptionIndex] = useState(-1);
  const featureRefs = useRef<(HTMLDivElement | null)[]>([]);
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const setFeatureRef = (index: number) => (el: HTMLDivElement | null) => {
    featureRefs.current[index] = el;
  };

  const setOptionRef = (index: number) => (el: HTMLDivElement | null) => {
    optionRefs.current[index] = el;
  };

  useKeyboardNavigation({
    onArrowUp: () => {
      if (focusedOptionIndex > 0) {
        setFocusedOptionIndex(prev => prev - 1);
        optionRefs.current[focusedOptionIndex - 1]?.focus();
      } else if (focusedOptionIndex === 0) {
        setFocusedOptionIndex(-1);
        setFocusedFeatureIndex(prev => Math.max(0, prev - 1));
        featureRefs.current[Math.max(0, focusedFeatureIndex - 1)]?.focus();
      }
    },
    onArrowDown: () => {
      if (focusedOptionIndex === -1) {
        const feature = features[focusedFeatureIndex];
        if (feature?.options.length) {
          setFocusedOptionIndex(0);
          optionRefs.current[0]?.focus();
        } else {
          setFocusedFeatureIndex(prev => Math.min(features.length - 1, prev + 1));
          featureRefs.current[Math.min(features.length - 1, focusedFeatureIndex + 1)]?.focus();
        }
      } else {
        const feature = features[focusedFeatureIndex];
        const maxOptionIndex = feature?.options.length - 1;
        if (focusedOptionIndex < maxOptionIndex) {
          setFocusedOptionIndex(prev => prev + 1);
          optionRefs.current[focusedOptionIndex + 1]?.focus();
        }
      }
    },
    onArrowLeft: () => {
      if (focusedOptionIndex !== -1) {
        const feature = features[focusedFeatureIndex];
        const option = feature?.options[focusedOptionIndex];
        if (option?.type === 'range') {
          const newValue = Math.max(option.min, option.value - option.step);
          option.onChange(newValue);
        }
      }
    },
    onArrowRight: () => {
      if (focusedOptionIndex !== -1) {
        const feature = features[focusedFeatureIndex];
        const option = feature?.options[focusedOptionIndex];
        if (option?.type === 'range') {
          const newValue = Math.min(option.max, option.value + option.step);
          option.onChange(newValue);
        }
      }
    },
    onEnter: () => {
      if (focusedOptionIndex !== -1) {
        const feature = features[focusedFeatureIndex];
        const option = feature?.options[focusedOptionIndex];
        if (option?.type === 'toggle') {
          option.onChange();
        }
      }
    },
    onEscape: () => {
      if (focusedOptionIndex !== -1) {
        setFocusedOptionIndex(-1);
        featureRefs.current[focusedFeatureIndex]?.focus();
      }
    },
  });

  const features: FeatureSection[] = [
    {
      id: 'visualAid',
      title: 'Visual Assistance',
      description: 'Enhance visual clarity and readability',
      icon: HiEye,
      options: [
        {
          id: 'highContrast',
          label: 'High Contrast Mode',
          type: 'toggle',
          value: settings.highContrast,
          onChange: () => updateSetting('highContrast', !settings.highContrast),
        },
        {
          id: 'textSize',
          label: 'Text Size',
          type: 'select',
          value: settings.textSize,
          options: [
            { value: 'normal', label: 'Normal' },
            { value: 'large', label: 'Large' },
            { value: 'xlarge', label: 'Extra Large' },
          ],
          onChange: (value: TextSize) => updateSetting('textSize', value),
        },
      ],
    },
    {
      id: 'audioAid',
      title: 'Audio Assistance',
      description: 'Customize audio and speech settings',
      icon: HiVolumeUp,
      options: [
        {
          id: 'screenReader',
          label: 'Screen Reader',
          type: 'toggle',
          value: settings.screenReader,
          onChange: () => updateSetting('screenReader', !settings.screenReader),
        },
        {
          id: 'speechRate',
          label: 'Speech Rate',
          type: 'range',
          value: settings.speechRate,
          min: 0.5,
          max: 2,
          step: 0.1,
          onChange: (value: number) => updateSetting('speechRate', value),
        },
      ],
    },
    {
      id: 'signLanguage',
      title: 'Sign Language',
      description: 'Enable sign language interpretation',
      icon: HiHand,
      options: [
        {
          id: 'signLanguage',
          label: 'Sign Language Support',
          type: 'toggle',
          value: settings.signLanguage,
          onChange: () => updateSetting('signLanguage', !settings.signLanguage),
        },
      ],
    },
    {
      id: 'colorMode',
      title: 'Color Vision',
      description: 'Adjust colors for different types of color vision',
      icon: HiColorSwatch,
      options: [
        {
          id: 'colorMode',
          label: 'Color Mode',
          type: 'select',
          value: settings.colorMode,
          options: [
            { value: 'default', label: 'Default' },
            { value: 'deuteranopia', label: 'Deuteranopia' },
            { value: 'protanopia', label: 'Protanopia' },
            { value: 'tritanopia', label: 'Tritanopia' },
          ],
          onChange: (value: ColorMode) => updateSetting('colorMode', value),
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white mb-2">Accessibility Settings</h2>
          <p className="text-white/60">Customize your experience for better accessibility</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
        >
          <HiCog className="w-6 h-6" />
        </motion.button>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" role="tablist">
        {features.map((feature, featureIndex) => (
          <motion.div
            key={feature.id}
            ref={setFeatureRef(featureIndex)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-xl bg-black/20 space-y-4 outline-none ${
              focusedFeatureIndex === featureIndex ? 'ring-2 ring-purple-500' : ''
            }`}
            tabIndex={0}
            role="tab"
            aria-selected={focusedFeatureIndex === featureIndex}
            onFocus={() => setFocusedFeatureIndex(featureIndex)}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-purple-500/20">
                <feature.icon className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                <p className="text-sm text-white/60">{feature.description}</p>
              </div>
            </div>

            <div className="space-y-4" role="tabpanel">
              {feature.options.map((option, optionIndex) => (
                <div
                  key={option.id}
                  ref={setOptionRef(optionIndex)}
                  className={`flex items-center justify-between gap-4 p-2 rounded-lg outline-none ${
                    focusedFeatureIndex === featureIndex && focusedOptionIndex === optionIndex
                      ? 'ring-2 ring-purple-500 bg-white/5'
                      : ''
                  }`}
                  tabIndex={-1}
                  role="button"
                  onFocus={() => {
                    setFocusedFeatureIndex(featureIndex);
                    setFocusedOptionIndex(optionIndex);
                  }}
                >
                  <label className="text-white/80">{option.label}</label>
                  {option.type === 'toggle' && (
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={option.onChange}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        option.value
                          ? 'bg-purple-500'
                          : 'bg-white/10'
                      }`}
                      aria-pressed={option.value}
                    >
                      <motion.div
                        className="w-5 h-5 rounded-full bg-white"
                        animate={{
                          x: option.value ? 26 : 2,
                        }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    </motion.button>
                  )}
                  {option.type === 'select' && (
                    <select
                      value={option.value}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (option.options.some(opt => opt.value === value)) {
                          (option as SelectOption<typeof value>).onChange(value);
                        }
                      }}
                      className="px-3 py-1 rounded-lg bg-white/10 text-white border border-white/10 focus:outline-none focus:border-purple-500"
                    >
                      {option.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}
                  {option.type === 'range' && (
                    <div className="flex items-center gap-4 flex-1">
                      <input
                        type="range"
                        min={option.min}
                        max={option.max}
                        step={option.step}
                        value={option.value}
                        onChange={(e) => option.onChange(parseFloat(e.target.value))}
                        className="flex-1 accent-purple-500"
                        aria-valuemin={option.min}
                        aria-valuemax={option.max}
                        aria-valuenow={option.value}
                      />
                      <span className="text-white/80 min-w-[3ch]">
                        {option.value}x
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-white/5">
        <div className="text-white/80">
          <p className="font-medium">Need help with accessibility?</p>
          <p className="text-sm text-white/60">Our support team is here to assist you</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-4 py-2 rounded-lg bg-purple-500/80 hover:bg-purple-600/80 text-white font-medium"
        >
          Get Support
        </motion.button>
      </div>
    </div>
  );
}
