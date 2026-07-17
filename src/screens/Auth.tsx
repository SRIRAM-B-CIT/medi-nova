import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Stethoscope, Heart, User, UserPlus, Sun, Moon } from 'lucide-react';

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');
  const [userType, setUserType] = useState<'patient' | 'doctor'>('patient');
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, signIn, signUp } = useAuth();
  
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

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const { error } = await signIn(email, password);

      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Welcome back!",
          description: "You have been signed in successfully.",
        });
      }
    } catch (error) {
      toast({
        title: "An error occurred",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;
    const role = userType === 'doctor' ? 'doctor' : 'non_medic';

    try {
      const { error, isPatient } = await signUp(email, password, fullName, role);

      if (error) {
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Account created successfully!",
          description: isPatient 
            ? "Redirecting to complete your health profile..."
            : "Welcome to MediNova!",
        });
        
        // For patients, navigate to patient-details page
        // For doctors, navigate to dashboard
        if (isPatient) {
          navigate('/patient-details');
        } else {
          navigate('/');
        }
      }
    } catch (error) {
      toast({
        title: "An error occurred",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen creative-bg flex items-center justify-center p-4 relative">
      <Button
        variant="outline"
        size="icon"
        onClick={toggleDarkMode}
        className="absolute top-4 right-4 rounded-full w-10 h-10 border-border/50 hover:bg-primary/10 bg-background/80 backdrop-blur-sm"
        aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDarkMode ? (
          <Sun className="h-5 w-5 text-yellow-500" />
        ) : (
          <Moon className="h-5 w-5 text-slate-700" />
        )}
      </Button>

      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center heartbeat" style={{ background: 'linear-gradient(to right, #0066cc, #2e8b57)' }}>
              <Heart className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground font-['Poppins']">HealthCare AI</h1>
          <p className="text-muted-foreground">Your comprehensive medical companion</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Sign In
            </TabsTrigger>
            <TabsTrigger value="signup" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Sign Up
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <Card className="medical-card border-0 shadow-lg">
              <CardHeader className="text-center">
                <CardTitle className="text-xl font-semibold">Welcome Back</CardTitle>
                <CardDescription>Sign in to your account to continue</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      placeholder="doctor@hospital.com"
                      required
                      className="border-border/30"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        required
                        className="border-border/30 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full text-white"
                    style={{ background: 'linear-gradient(to right, #0066cc, #2e8b57)' }}
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card className="medical-card border-0 shadow-lg">
              <CardHeader className="text-center">
                <CardTitle className="text-xl font-semibold">Create Account</CardTitle>
                <CardDescription>Join our healthcare community</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">I am a:</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant={userType === 'patient' ? 'default' : 'outline'}
                      onClick={() => setUserType('patient')}
                      className={`h-auto p-4 flex flex-col items-center gap-2 ${
                        userType === 'patient' 
                          ? 'text-white' 
                          : 'border-border/30 hover:bg-green-50 dark:hover:bg-green-950/20'
                      }`}
                      style={userType === 'patient' ? { background: 'linear-gradient(to right, #22c55e, #16a34a)' } : {}}
                    >
                      <Heart className="h-6 w-6" />
                      <div className="text-center">
                        <div className="font-medium">Patient</div>
                        <div className="text-xs opacity-80">Seeking care</div>
                      </div>
                    </Button>
                    
                    <Button
                      type="button"
                      variant={userType === 'doctor' ? 'default' : 'outline'}
                      onClick={() => setUserType('doctor')}
                      className={`h-auto p-4 flex flex-col items-center gap-2 ${
                        userType === 'doctor' 
                          ? 'text-white' 
                          : 'border-border/30 hover:bg-blue-50 dark:hover:bg-blue-950/20'
                      }`}
                      style={userType === 'doctor' ? { background: 'linear-gradient(to right, #3b82f6, #2563eb)' } : {}}
                    >
                      <Stethoscope className="h-6 w-6" />
                      <div className="text-center">
                        <div className="font-medium">Doctor</div>
                        <div className="text-xs opacity-80">Healthcare provider</div>
                      </div>
                    </Button>
                  </div>
                </div>

                <Separator />

                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      name="fullName"
                      type="text"
                      placeholder={userType === 'doctor' ? "Dr. Sarah Johnson" : "John Smith"}
                      required
                      className="border-border/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder={userType === 'doctor' ? "doctor@hospital.com" : "patient@email.com"}
                      required
                      className="border-border/30"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        required
                        className="border-border/30 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full text-white"
                    style={userType === 'doctor' 
                      ? { background: 'linear-gradient(to right, #3b82f6, #2563eb)' }
                      : { background: 'linear-gradient(to right, #22c55e, #16a34a)' }
                    }
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating account..." : `Sign Up as ${userType === 'doctor' ? 'Doctor' : 'Patient'}`}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="text-center text-sm text-muted-foreground">
          <p>By continuing, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
}
