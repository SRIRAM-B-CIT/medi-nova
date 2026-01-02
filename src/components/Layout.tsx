import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Heart, Stethoscope, UserCheck, Sun, Moon, LogOut, User, Mail } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { AppSidebar } from '@/components/AppSidebar';

interface LayoutProps {
  children: React.ReactNode;
}


export function Layout({ children }: LayoutProps) {
  const { profile, signOut } = useAuth();
  const isDoctor = profile?.role === 'doctor';
  const firstLetter = profile?.full_name?.charAt(0).toUpperCase() || profile?.email?.charAt(0).toUpperCase() || 'U';
  const displayName = profile?.full_name || profile?.email?.split('@')[0] || 'User';
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode');
      return saved === 'true';
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', String(isDarkMode));
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen w-full creative-bg">
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          
          <div className="flex-1 flex flex-col">
            <header className="medical-card sticky top-0 z-40 border-b border-border/50 backdrop-blur-sm">
              <div className="flex items-center justify-between max-w-6xl mx-auto p-4">
                <div className="flex items-center gap-4">
                  <SidebarTrigger className="transition-all duration-300 hover:scale-105 hover:bg-primary/10 rounded-lg p-2 text-foreground" />
                  
                  <div className="flex items-center gap-3">
                    <div className="relative medical-float">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(to right, #0066cc, #2e8b57)' }}>
                        <Heart className="h-6 w-6 text-white heartbeat" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-foreground font-['Poppins']">
                        MediNova
                      </h1>
                      <p className="text-sm text-muted-foreground font-['Inter']">Compassionate AI Healthcare Companion</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleDarkMode}
                    className="rounded-full w-10 h-10 border-border/50 hover:bg-primary/10"
                    aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                  >
                    {isDarkMode ? (
                      <Sun className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <Moon className="h-5 w-5 text-slate-700" />
                    )}
                  </Button>

                  {profile && (
                    <div className="hidden sm:flex items-center gap-3 calm-card p-3 rounded-xl">
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-medium text-foreground font-['Inter']">{profile.full_name}</span>
                        <Badge 
                          variant={isDoctor ? "default" : "secondary"}
                          className={`text-xs ${isDoctor 
                            ? "bg-blue-500 text-white hover:bg-blue-600" 
                            : "bg-green-500 text-white hover:bg-green-600"
                          }`}
                        >
                          {isDoctor ? (
                            <>
                              <Stethoscope className="h-3 w-3 mr-1" />
                              Doctor
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
                  )}
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-2 h-auto transition-all duration-300 hover:scale-105 hover:bg-primary/10 rounded-xl">
                        <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                          <AvatarFallback className={`${isDoctor 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-green-500 text-white'
                          } font-semibold font-['Poppins'] text-lg`}>
                            {firstLetter}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64 medical-card border-0" align="end">
                      <DropdownMenuLabel className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className={`${isDoctor ? 'bg-blue-500' : 'bg-green-500'} text-white font-semibold text-lg`}>
                              {firstLetter}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              <span className="truncate">{profile?.email}</span>
                            </div>
                            <Badge 
                              variant={isDoctor ? "default" : "secondary"}
                              className={`mt-2 text-xs ${isDoctor 
                                ? 'bg-blue-500 text-white hover:bg-blue-600' 
                                : 'bg-green-500 text-white hover:bg-green-600'
                              }`}
                            >
                              {isDoctor ? (
                                <>
                                  <Stethoscope className="h-3 w-3 mr-1" />
                                  Doctor
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
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={signOut}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer m-2 rounded-lg"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </header>

            <main className="flex-1 min-h-0 overflow-auto">
              <div className="max-w-7xl mx-auto p-6 space-y-6">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
