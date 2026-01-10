import React, { useState } from 'react';
import { Settings, X } from 'lucide-react';

const ThemeCustomizer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState({
    primaryColor: '#7cd1b4',
    accentColor: '#5fc1d7',
    fontSize: 'base',
    spacing: 'normal',
    borderRadius: 'rounded'
  });

  const applySettings = () => {
    const root = document.documentElement;
    
    // Apply primary color
    if (settings.primaryColor) {
      root.style.setProperty('--primary-custom', settings.primaryColor);
    }
    
    // Apply font size
    const fontSizes = {
      small: '14px',
      base: '16px',
      large: '18px'
    };
    root.style.setProperty('font-size', fontSizes[settings.fontSize]);
    
    // Apply spacing
    const spacings = {
      compact: '0.75',
      normal: '1',
      relaxed: '1.5'
    };
    root.style.setProperty('--spacing-scale', spacings[settings.spacing]);
    
    // Apply border radius
    const radiuses = {
      sharp: '0px',
      rounded: '8px',
      pill: '999px'
    };
    root.style.setProperty('--radius', radiuses[settings.borderRadius]);
  };

  React.useEffect(() => {
    applySettings();
  }, [settings]);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-[#7cd1b4] to-[#5fc1d7] text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all"
        data-testid="theme-customizer-button"
      >
        <Settings size={24} />
      </button>

      {/* Customizer Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-end p-4">
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={() => setIsOpen(false)}
          ></div>
          
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-[#7cd1b4] to-[#5fc1d7] text-white p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Theme Customizer</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Settings */}
            <div className="p-6 space-y-6">
              {/* Primary Color */}
              <div>
                <label className="block text-sm font-semibold text-accent mb-3">
                  Primary Color
                </label>
                <div className="flex gap-3">
                  {['#7cd1b4', '#5fc1d7', '#6d8fa9', '#f2d9a2', '#d28b5e'].map(color => (
                    <button
                      key={color}
                      onClick={() => setSettings({...settings, primaryColor: color})}
                      className={`w-12 h-12 rounded-lg border-2 transition-all ${
                        settings.primaryColor === color ? 'border-accent scale-110' : 'border-border'
                      }`}
                      style={{backgroundColor: color}}
                    />
                  ))}
                </div>
              </div>

              {/* Font Size */}
              <div>
                <label className="block text-sm font-semibold text-accent mb-3">
                  Font Size
                </label>
                <div className="flex gap-2">
                  {[
                    {value: 'small', label: 'Small'},
                    {value: 'base', label: 'Normal'},
                    {value: 'large', label: 'Large'}
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setSettings({...settings, fontSize: option.value})}
                      className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all font-medium ${
                        settings.fontSize === option.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Spacing */}
              <div>
                <label className="block text-sm font-semibold text-accent mb-3">
                  Layout Spacing
                </label>
                <div className="flex gap-2">
                  {[
                    {value: 'compact', label: 'Compact'},
                    {value: 'normal', label: 'Normal'},
                    {value: 'relaxed', label: 'Relaxed'}
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setSettings({...settings, spacing: option.value})}
                      className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all font-medium ${
                        settings.spacing === option.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Border Radius */}
              <div>
                <label className="block text-sm font-semibold text-accent mb-3">
                  Border Radius
                </label>
                <div className="flex gap-2">
                  {[
                    {value: 'sharp', label: 'Sharp'},
                    {value: 'rounded', label: 'Rounded'},
                    {value: 'pill', label: 'Pill'}
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setSettings({...settings, borderRadius: option.value})}
                      className={`flex-1 px-4 py-3 border-2 transition-all font-medium ${
                        settings.borderRadius === option.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                      style={{
                        borderRadius: option.value === 'sharp' ? '0px' : option.value === 'rounded' ? '8px' : '999px'
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset Button */}
              <div className="pt-4 border-t border-border">
                <button
                  onClick={() => setSettings({
                    primaryColor: '#7cd1b4',
                    accentColor: '#5fc1d7',
                    fontSize: 'base',
                    spacing: 'normal',
                    borderRadius: 'rounded'
                  })}
                  className="w-full bg-muted text-muted-foreground px-6 py-3 rounded-full hover:bg-muted/80 transition-all font-semibold"
                >
                  Reset to Default
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ThemeCustomizer;
