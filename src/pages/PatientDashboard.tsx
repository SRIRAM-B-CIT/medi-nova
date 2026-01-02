import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import MedicationReminder from '@/components/MedicationReminder';
import {
  Heart, 
  Stethoscope, 
  Shield, 
  Clock, 
  Users,
  Activity,
  Sparkles
} from 'lucide-react';

export default function PatientDashboard() {
  const { profile } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const displayName = profile?.full_name?.split(' ')[0] || profile?.email?.split('@')[0] || 'there';

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const healthMetrics = [
    { label: 'Active Users', value: '2.4K+', icon: Users, trend: '+12%' },
    { label: 'Consultations', value: '15.7K+', icon: Stethoscope, trend: '+8%' },
    { label: 'Emergency Calls', value: '247', icon: Shield, trend: '-5%' },
    { label: 'Avg Response', value: '2.3m', icon: Clock, trend: '+3%' }
  ];

  return (
    <div className="min-h-screen creative-bg">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Hero Welcome Section */}
        <div className="relative overflow-hidden medical-card rounded-3xl p-8 md:p-12">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0066cc]/10 via-[#2e8b57]/5 to-[#00bcd4]/10"></div>
          <div className="absolute top-4 right-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {currentTime.toLocaleTimeString()}
            </div>
          </div>
          
          <div className="relative z-10 max-w-4xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(to right, #0066cc, #2e8b57)' }}>
                <Heart className="h-8 w-8 text-white animate-pulse" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">
                  {getGreeting()}, {displayName}!
                </h1>
                <p className="text-xl text-muted-foreground">
                  Welcome to MediNova - Your AI Healthcare Companion
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 mt-6">
              <Badge className="text-sm px-4 py-2 bg-green-500 text-white hover:bg-green-600">
                <Users className="h-4 w-4 mr-2" />
                Patient Account
              </Badge>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="h-4 w-4 text-green-500" />
                <span>System Status: Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Medication Reminders */}
        <MedicationReminder />

        {/* Health Metrics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {healthMetrics.map((metric, index) => {
            const Icon = metric.icon;
            const isPositive = metric.trend.startsWith('+');
            
            return (
              <Card key={metric.label} className="medical-card border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <Badge 
                      variant={isPositive ? "default" : "secondary"}
                      className={`text-xs ${isPositive 
                        ? 'bg-green-500 text-white' 
                        : 'bg-orange-500 text-white'
                      }`}
                    >
                      {metric.trend}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground mb-1">
                      {metric.value}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {metric.label}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Feature Highlight */}
        <Card className="medical-card border-0 overflow-hidden">
          <div className="relative bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 p-8">
            <div className="absolute top-4 right-4">
              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            </div>
            <div className="max-w-4xl">
              <h3 className="text-2xl font-bold text-foreground mb-3">
                Experience Next-Generation Healthcare
              </h3>
              <p className="text-muted-foreground mb-6 max-w-2xl">
                MediNova combines artificial intelligence with compassionate care to provide 
                instant medical guidance, emergency assistance, and wellness support whenever you need it.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/voice-ai">
                  <Button className="text-white hover:scale-105 transition-transform" style={{ background: 'linear-gradient(to right, #0066cc, #2e8b57)' }}>
                    Try Voice AI
                  </Button>
                </Link>
                <Link to="/medical-chatbot">
                  <Button variant="outline" className="hover:scale-105 transition-transform">
                    Chat with AI
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}