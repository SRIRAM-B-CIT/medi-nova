import { ChatInterface } from '@/components/ChatInterface';
import { EmergencyButton } from '@/components/EmergencyButton';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MedicalDataCard } from '@/components/MedicalDataCard';
import { CalmingImageSection } from '@/components/CalmingImageSection';
import { 
  Heart, 
  Scissors, 
  Wind, 
  Flame, 
  AlertTriangle,
  Phone,
  Stethoscope,
  Brain,
  Users,
  BookOpen,
  Activity,
  Sparkles,
  Shield
} from 'lucide-react';

export default function Chat() {
  const { profile } = useAuth();
  const isDoctor = profile?.role === 'doctor';

  const handleEmergencyClick = (emergency: string) => {
    console.log(`Emergency selected: ${emergency}`);
  };

  return (
    <div className="min-h-screen creative-bg">
      <div className="space-y-6">
        {/* Creative Welcome Section */}
        <div className="medical-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {isDoctor ? (
                <>
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center heartbeat">
                    <Stethoscope className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-foreground font-['Poppins']">
                      Welcome, Dr. {profile?.full_name || 'Doctor'}!
                    </h1>
                    <p className="text-muted-foreground font-['Inter']">
                      Providing professional medical expertise and compassionate care
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center medical-float">
                    <Heart className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-foreground font-['Poppins']">
                      Hello, {profile?.full_name || 'Friend'}!
                    </h1>
                    <p className="text-muted-foreground font-['Inter']">
                      Your personalized health companion is here to help
                    </p>
                  </div>
                </>
              )}
            </div>
            <div className="hidden md:flex items-center gap-2 calm-card p-3 rounded-xl">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground">AI-Powered</span>
            </div>
          </div>
        </div>

        {/* Medical Data Dashboard & Calming Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MedicalDataCard />
          <CalmingImageSection />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {isDoctor ? (
            <>
              <div className="medical-card p-6 cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">Patient Consultations</h3>
                    <p className="text-sm text-muted-foreground">Provide expert medical advice and guidance</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Shield className="h-4 w-4 text-blue-500" />
                      <span className="text-xs text-blue-600 font-medium">Professional Tools</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="data-card p-6 cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <BookOpen className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">Medical Resources</h3>
                    <p className="text-sm text-muted-foreground">Access clinical guidelines and research</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Activity className="h-4 w-4 text-green-500" />
                      <span className="text-xs text-green-600 font-medium">Evidence-Based</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="data-card p-6 cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Activity className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">Health Check</h3>
                    <p className="text-sm text-muted-foreground">Monitor your wellbeing and vital signs</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Heart className="h-4 w-4 text-green-500" />
                      <span className="text-xs text-green-600 font-medium">Personalized Care</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="calm-card p-6 cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Brain className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">Mental Wellness</h3>
                    <p className="text-sm text-muted-foreground">Emotional support and mindfulness guidance</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Sparkles className="h-4 w-4 text-purple-500" />
                      <span className="text-xs text-purple-600 font-medium">Mindful Support</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Health Tools & Resources */}
        <div className="medical-card p-6 border-l-4 border-l-blue-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {isDoctor ? "Medical Assessment Tools" : "Health Assessment Tools"}
              </h3>
              <p className="text-sm text-muted-foreground">Comprehensive health evaluation and guidance</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <EmergencyButton
                icon={Heart}
                title="Symptom Check"
                description="Analyze symptoms"
                onClick={() => window.open('/disease-identifier', '_blank')}
                variant="primary"
              />
              <EmergencyButton
                icon={Activity}
                title="Risk Assessment"
                description="Disease risk factors"
                onClick={() => window.open('/disease-risk', '_blank')}
                variant="primary"
              />
              <EmergencyButton
                icon={BookOpen}
                title="First Aid"
                description="Medical guidance"
                onClick={() => window.open('/first-aid', '_blank')}
                variant="primary"
              />
              <EmergencyButton
                icon={Brain}
                title="Mental Health"
                description="Wellness support"
                onClick={() => window.open('/calm', '_blank')}
                variant="secondary"
              />
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <EmergencyButton
                icon={Stethoscope}
                title="Consultation"
                description="Expert advice"
                onClick={() => window.open('/medical-chatbot', '_blank')}
                variant="secondary"
              />
              <EmergencyButton
                icon={Users}
                title="Health Monitor"
                description="Track vitals"
                onClick={() => alert('Health monitoring feature - Track your daily health metrics and get personalized insights!')}
                variant="secondary"
              />
              <EmergencyButton
                icon={Shield}
                title="Prevention"
                description="Health tips"
                onClick={() => alert('Prevention guide - Get personalized recommendations for maintaining optimal health!')}
                variant="secondary"
              />
              <EmergencyButton
                icon={Sparkles}
                title="Wellness Plan"
                description="Custom health plan"
                onClick={() => alert('Wellness planning - Create a personalized health and wellness roadmap tailored to your needs!')}
                variant="primary"
              />
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="medical-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
              <Heart className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">AI Medical Assistant</h3>
          </div>
          <div className="bg-white/50 rounded-xl border border-border/20">
            <ChatInterface />
          </div>
        </div>
      </div>
    </div>
  );
}