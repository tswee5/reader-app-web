"use client";

import { useState, useEffect } from "react";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Type } from "lucide-react";

interface TextFormatSettingsProps {
  onClose?: () => void;
}

export function TextFormatSettings({ onClose }: TextFormatSettingsProps) {
  // Default values
  const [theme, setTheme] = useState<string>("system");
  const [font, setFont] = useState<string>("literata");
  const [fontSize, setFontSize] = useState<number>(18);
  const [lineSpacing, setLineSpacing] = useState<number>(1.5);

  // Load saved settings from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Theme
      const savedTheme = localStorage.getItem('reader-theme');
      if (savedTheme) setTheme(savedTheme);
      
      // Font
      const savedFont = localStorage.getItem('reader-font');
      if (savedFont) setFont(savedFont);
      
      // Font size
      const savedFontSize = localStorage.getItem('reader-font-size');
      if (savedFontSize) setFontSize(parseInt(savedFontSize, 10));
      
      // Line spacing
      const savedLineSpacing = localStorage.getItem('reader-line-spacing');
      if (savedLineSpacing) setLineSpacing(parseFloat(savedLineSpacing));
    }
  }, []);

  // Apply settings effect on mount
  useEffect(() => {
    // Apply saved settings on component mount
    applyTheme(theme);
    applyFont(font);
    applyFontSize(fontSize);
    applyLineSpacing(lineSpacing);
  }, [theme, font, fontSize, lineSpacing]);

  // Apply settings to the document and save them to localStorage
  const applySettings = (
    setting: 'theme' | 'font' | 'fontSize' | 'lineSpacing',
    value: string | number
  ) => {
    switch (setting) {
      case 'theme':
        applyTheme(value as string);
        setTheme(value as string);
        break;
        
      case 'font':
        applyFont(value as string);
        setFont(value as string);
        break;
        
      case 'fontSize':
        applyFontSize(value as number);
        setFontSize(value as number);
        break;
        
      case 'lineSpacing':
        applyLineSpacing(value as number);
        setLineSpacing(value as number);
        break;
    }
  };

  const applyTheme = (value: string) => {
    document.documentElement.classList.remove('theme-white', 'theme-sepia', 'theme-paper', 'theme-dawn');
    document.documentElement.classList.add(`theme-${value}`);
    localStorage.setItem('reader-theme', value);
  };

  const applyFont = (value: string) => {
    // Target article element with data attribute
    const articleElement = document.querySelector('article[data-article-content="true"]');
    if (!articleElement) return;

    articleElement.classList.remove('font-literata', 'font-merriweather', 'font-source-serif-pro', 'font-inter');
    articleElement.classList.add(`font-${value}`);
    localStorage.setItem('reader-font', value);
  };

  const applyFontSize = (value: number) => {
    // Target article element with data attribute
    const articleElement = document.querySelector('article[data-article-content="true"]');
    if (!articleElement) return;
    
    // Apply font size to article
    (articleElement as HTMLElement).style.fontSize = `${value}px`;
    localStorage.setItem('reader-font-size', value.toString());
  };

  const applyLineSpacing = (value: number) => {
    // Target article element with data attribute
    const articleElement = document.querySelector('article[data-article-content="true"]');
    if (!articleElement) return;

    // Apply line height to article
    (articleElement as HTMLElement).style.lineHeight = value.toString();

    // Also target all paragraphs to ensure consistency
    const paragraphs = articleElement.querySelectorAll('p');
    paragraphs.forEach(p => {
      (p as HTMLElement).style.lineHeight = value.toString();
    });

    localStorage.setItem('reader-line-spacing', value.toString());
  };

  // Reset all settings to default
  const resetToDefault = () => {
    // Reset theme
    setTheme('system');
    document.documentElement.classList.remove('theme-white', 'theme-sepia', 'theme-paper', 'theme-dawn');
    localStorage.removeItem('reader-theme');
    
    // Reset font
    setFont('literata');
    const articleElement = document.querySelector('article[data-article-content="true"]');
    if (articleElement) {
      articleElement.classList.remove('font-literata', 'font-merriweather', 'font-source-serif-pro', 'font-inter');
      articleElement.classList.add('font-literata');
      
      // Reset font size and line height for article
      (articleElement as HTMLElement).style.fontSize = '18px';
      (articleElement as HTMLElement).style.lineHeight = '1.5';
      
      // Reset line height for all paragraphs
      const paragraphs = articleElement.querySelectorAll('p');
      paragraphs.forEach(p => {
        (p as HTMLElement).style.lineHeight = '1.5';
      });
    }
    
    localStorage.removeItem('reader-font');
    localStorage.removeItem('reader-font-size');
    localStorage.removeItem('reader-line-spacing');
  };

  return (
    <div className="p-4 w-full max-w-[350px]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg">Display Settings</h3>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <Type className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Theme Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Theme</label>
        <div className="grid grid-cols-5 gap-2">
          <button
            className={`p-2 rounded-md border ${theme === 'system' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => applySettings('theme', 'system')}
          >
            <div className="w-full aspect-square rounded bg-gradient-to-br from-gray-100 to-gray-300 dark:from-gray-700 dark:to-gray-900"></div>
            <span className="text-xs mt-1 block">System</span>
          </button>
          <button
            className={`p-2 rounded-md border ${theme === 'white' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => applySettings('theme', 'white')}
          >
            <div className="w-full aspect-square rounded bg-white border"></div>
            <span className="text-xs mt-1 block">White</span>
          </button>
          <button
            className={`p-2 rounded-md border ${theme === 'sepia' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => applySettings('theme', 'sepia')}
          >
            <div className="w-full aspect-square rounded bg-amber-50"></div>
            <span className="text-xs mt-1 block">Sepia</span>
          </button>
          <button
            className={`p-2 rounded-md border ${theme === 'paper' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => applySettings('theme', 'paper')}
          >
            <div className="w-full aspect-square rounded bg-stone-100"></div>
            <span className="text-xs mt-1 block">Paper</span>
          </button>
          <button
            className={`p-2 rounded-md border ${theme === 'dawn' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => applySettings('theme', 'dawn')}
          >
            <div className="w-full aspect-square rounded bg-rose-50"></div>
            <span className="text-xs mt-1 block">Dawn</span>
          </button>
        </div>
      </div>

      {/* Font Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Font</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            className={`p-2 rounded-md border ${font === 'literata' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => applySettings('font', 'literata')}
          >
            <span className="text-sm block font-['Literata']">Literata</span>
            <p className="text-xs mt-1 text-muted-foreground font-['Literata']">Aa Bb Cc</p>
          </button>
          <button
            className={`p-2 rounded-md border ${font === 'merriweather' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => applySettings('font', 'merriweather')}
          >
            <span className="text-sm block font-['Merriweather']">Merriweather</span>
            <p className="text-xs mt-1 text-muted-foreground font-['Merriweather']">Aa Bb Cc</p>
          </button>
          <button
            className={`p-2 rounded-md border ${font === 'source-serif-pro' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => applySettings('font', 'source-serif-pro')}
          >
            <span className="text-sm block font-['Source_Serif_Pro']">Source Serif</span>
            <p className="text-xs mt-1 text-muted-foreground font-['Source_Serif_Pro']">Aa Bb Cc</p>
          </button>
          <button
            className={`p-2 rounded-md border ${font === 'inter' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => applySettings('font', 'inter')}
          >
            <span className="text-sm block font-['Inter']">Inter</span>
            <p className="text-xs mt-1 text-muted-foreground font-['Inter']">Aa Bb Cc</p>
          </button>
        </div>
      </div>

      {/* Font Size */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium">Font size</label>
          <span className="text-xs text-muted-foreground">{fontSize}px</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            className="p-2 rounded-md border"
            onClick={() => applySettings('fontSize', Math.max(12, fontSize - 1))}
          >
            A
          </button>
          <input
            type="range"
            min="12"
            max="32"
            step="1"
            value={fontSize}
            onChange={(e) => applySettings('fontSize', parseInt(e.target.value, 10))}
            className="flex-1"
          />
          <button 
            className="p-2 rounded-md border text-lg font-semibold"
            onClick={() => applySettings('fontSize', Math.min(32, fontSize + 1))}
          >
            A
          </button>
        </div>
      </div>

      {/* Spacing */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium">Spacing</label>
          <span className="text-xs text-muted-foreground">{lineSpacing.toFixed(1)}</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            className="p-2 rounded-md border text-xs"
            onClick={() => applySettings('lineSpacing', Math.max(1, lineSpacing - 0.1))}
          >
            <div className="flex flex-col gap-[2px]">
              <div className="w-4 h-1 bg-current"></div>
              <div className="w-4 h-1 bg-current"></div>
            </div>
          </button>
          <input
            type="range"
            min="1"
            max="3"
            step="0.1"
            value={lineSpacing}
            onChange={(e) => applySettings('lineSpacing', parseFloat(e.target.value))}
            className="flex-1"
          />
          <button 
            className="p-2 rounded-md border text-xs"
            onClick={() => applySettings('lineSpacing', Math.min(3, lineSpacing + 0.1))}
          >
            <div className="flex flex-col gap-[6px]">
              <div className="w-4 h-1 bg-current"></div>
              <div className="w-4 h-1 bg-current"></div>
            </div>
          </button>
        </div>
      </div>

      {/* Reset Button */}
      <Button 
        variant="outline" 
        className="w-full" 
        onClick={resetToDefault}
      >
        Reset to default
      </Button>
    </div>
  );
} 