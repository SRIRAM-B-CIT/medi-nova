import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Stethoscope, UserCheck, LogOut, Mail } from 'lucide-react';

export const UserProfile = () => {
  const { profile, signOut } = useAuth();

  if (!profile) {
    return null;
  }

  const isDoctor = profile.role === 'doctor';
  const initials = profile.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

  return (
    <div className="w-full">
      <div className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback className={`${isDoctor ? 'bg-blue-500' : 'bg-green-500'} text-white font-semibold`}>
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            {profile.full_name && (
              <p className="text-sm font-semibold text-foreground truncate">{profile.full_name}</p>
            )}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Mail className="h-3 w-3" />
              <span className="truncate">{profile.email}</span>
            </div>
          </div>
        </div>
        
        <div className="mt-3">
          <Badge 
            variant={isDoctor ? "default" : "secondary"}
            className={`${isDoctor 
              ? 'bg-blue-500 text-white hover:bg-blue-600' 
              : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {isDoctor ? (
              <>
                <Stethoscope className="h-3 w-3 mr-1" />
                Medical Professional
              </>
            ) : (
              <>
                <UserCheck className="h-3 w-3 mr-1" />
                Patient
              </>
            )}
          </Badge>
        </div>
      </div>

      <Separator />

      <div className="p-2">
        <Button 
          onClick={signOut} 
          variant="ghost" 
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};
