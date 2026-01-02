import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface EmergencyButtonProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
  variant?: 'emergency' | 'primary' | 'secondary';
}

export function EmergencyButton({ 
  icon: Icon, 
  title, 
  description, 
  onClick, 
  variant = 'emergency' 
}: EmergencyButtonProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'emergency':
        return 'bg-emergency hover:bg-emergency/90 text-emergency-foreground border-emergency/20';
      case 'primary':
        return 'bg-primary hover:bg-primary/90 text-primary-foreground';
      case 'secondary':
        return 'bg-secondary hover:bg-secondary/90 text-secondary-foreground';
      default:
        return 'bg-emergency hover:bg-emergency/90 text-emergency-foreground';
    }
  };

  return (
    <Button
      onClick={onClick}
      className={`h-auto p-4 flex flex-col items-center gap-2 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${getVariantClasses()}`}
      variant="outline"
    >
      <Icon className="h-6 w-6" />
      <div className="text-center">
        <div className="font-semibold text-sm">{title}</div>
        <div className="text-xs opacity-90 font-normal">{description}</div>
      </div>
    </Button>
  );
}