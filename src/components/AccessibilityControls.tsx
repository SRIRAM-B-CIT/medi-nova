import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ZoomIn, ZoomOut, Volume2, VolumeX, Sun, Moon } from 'lucide-react';

export function AccessibilityControls() {
  const [fontSize, setFontSize] = useState(16);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;
  }, [fontSize]);

  useEffect(() => {
    if (isHighContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [isHighContrast]);

  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 2, 24));
  };

  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 2, 12));
  };

  const toggleVoice = () => {
    setIsVoiceEnabled(prev => !prev);
    if (isVoiceEnabled) {
      speechSynthesis.cancel();
    }
  };

  const toggleContrast = () => {
    setIsHighContrast(prev => !prev);
  };

  if (!isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        size="sm"
        variant="outline"
        className="fixed top-20 right-4 z-40 bg-card"
        aria-label="Open accessibility controls"
      >
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Card className="fixed top-20 right-4 z-40 w-64">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-sm">Accessibility</h3>
          <Button
            onClick={() => setIsVisible(false)}
            size="sm"
            variant="ghost"
            aria-label="Close accessibility controls"
          >
            ×
          </Button>
        </div>
        
        <div className="space-y-3">
          {/* Font Size Controls */}
          <div className="flex items-center justify-between">
            <span className="text-sm">Text Size</span>
            <div className="flex gap-1">
              <Button
                onClick={decreaseFontSize}
                size="sm"
                variant="outline"
                aria-label="Decrease text size"
              >
                <ZoomOut className="h-3 w-3" />
              </Button>
              <Button
                onClick={increaseFontSize}
                size="sm"
                variant="outline"
                aria-label="Increase text size"
              >
                <ZoomIn className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Voice Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm">Voice Output</span>
            <Button
              onClick={toggleVoice}
              size="sm"
              variant={isVoiceEnabled ? "default" : "outline"}
              aria-label={isVoiceEnabled ? "Disable voice" : "Enable voice"}
            >
              {isVoiceEnabled ? (
                <Volume2 className="h-3 w-3" />
              ) : (
                <VolumeX className="h-3 w-3" />
              )}
            </Button>
          </div>

          {/* High Contrast Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm">High Contrast</span>
            <Button
              onClick={toggleContrast}
              size="sm"
              variant={isHighContrast ? "default" : "outline"}
              aria-label={isHighContrast ? "Disable high contrast" : "Enable high contrast"}
            >
              {isHighContrast ? (
                <Sun className="h-3 w-3" />
              ) : (
                <Moon className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}