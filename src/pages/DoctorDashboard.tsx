import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';
import MedicationReminder from '@/components/MedicationReminder';
import { EmergencyPatientDetails } from '@/components/EmergencyPatientDetails';
import {
  Stethoscope,
  Search,
  Users,
  Clock,
  Activity,
  Heart,
  FileText,
  Pill,
  User,
  Calendar
} from 'lucide-react';

interface PatientRecord {
  id: string;
  user_id: string;
  full_name: string;
  age: number;
  gender: string;
  medical_conditions: string | null;
  allergies: string | null;
  created_at: string;
}

export default function DoctorDashboard() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const displayName = profile?.full_name?.split(' ')[0] || profile?.email?.split('@')[0] || 'Doctor';

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getMedicationReminders();
      // Extract unique patients from medication reminders
      const uniquePatients = new Map();
      data.forEach((reminder: any) => {
        if (reminder.patient_id && !uniquePatients.has(reminder.patient_id._id)) {
          uniquePatients.set(reminder.patient_id._id, {
            id: reminder.patient_id._id,
            user_id: reminder.patient_id._id,
            full_name: reminder.patient_id.full_name,
            age: 0,
            gender: '',
            medical_conditions: null,
            allergies: null,
            created_at: reminder.created_at,
          });
        }
      });
      setPatients(Array.from(uniquePatients.values()));
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast({
        title: "Error",
        description: "Failed to load patient records",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const filteredPatients = patients.filter(patient =>
    patient.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.user_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = [
    { label: 'Total Patients', value: patients.length, icon: Users, color: 'from-blue-500 to-cyan-500' },
    { label: 'Today\'s Date', value: currentTime.toLocaleDateString(), icon: Calendar, color: 'from-green-500 to-emerald-500' },
    { label: 'Active Records', value: patients.length, icon: FileText, color: 'from-purple-500 to-indigo-500' },
    { label: 'System Status', value: 'Online', icon: Activity, color: 'from-orange-500 to-amber-500' }
  ];

  return (
    <div className="min-h-screen creative-bg">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Hero Welcome Section */}
        <div className="relative overflow-hidden medical-card rounded-3xl p-8 md:p-12">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-secondary/5 to-cyan-500/10"></div>
          <div className="absolute top-4 right-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {currentTime.toLocaleTimeString()}
            </div>
          </div>
          
          <div className="relative z-10 max-w-4xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Stethoscope className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">
                  {getGreeting()}, Dr. {displayName}!
                </h1>
                <p className="text-xl text-muted-foreground">
                  Welcome to MediNova - Doctor's Portal
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 mt-6">
              <Badge className="text-sm px-4 py-2 bg-blue-500 text-white hover:bg-blue-600">
                <Stethoscope className="h-4 w-4 mr-2" />
                Medical Professional
              </Badge>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="h-4 w-4 text-green-500" />
                <span>System Status: Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="medical-card border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground mb-1">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Content */}
        <Tabs defaultValue="patients" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="patients" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Patient Records
            </TabsTrigger>
            <TabsTrigger value="reminders" className="flex items-center gap-2">
              <Pill className="h-4 w-4" />
              Medication Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="patients" className="space-y-6">
            {/* Search */}
            <Card className="medical-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Search Patients
                </CardTitle>
                <CardDescription>
                  Search by patient name or user ID
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search patients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Patient List */}
              <Card className="medical-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Patient Records ({filteredPatients.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="max-h-[500px] overflow-y-auto">
                  {isLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading patients...</div>
                  ) : filteredPatients.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No patients found
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredPatients.map((patient) => (
                        <div
                          key={patient.id}
                          onClick={() => setSelectedPatient(patient)}
                          className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                            selectedPatient?.id === patient.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                              <User className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold">{patient.full_name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {patient.age} years • {patient.gender}
                              </p>
                              {patient.medical_conditions && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                  Conditions: {patient.medical_conditions}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Selected Patient Details */}
              <Card className="medical-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Patient Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedPatient ? (
                    <EmergencyPatientDetails 
                      userId={selectedPatient.user_id} 
                      showEmergencyContact={true}
                    />
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Select a patient to view their details</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reminders" className="space-y-6">
            {selectedPatient ? (
              <div className="space-y-4">
                <Card className="medical-card border-0 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Managing reminders for: {selectedPatient.full_name}</h3>
                      <p className="text-sm text-muted-foreground">Patient ID: {selectedPatient.user_id}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedPatient(null)}
                      className="ml-auto"
                    >
                      Change Patient
                    </Button>
                  </div>
                </Card>
                <MedicationReminder patientId={selectedPatient.user_id} isDoctor={true} />
              </div>
            ) : (
              <Card className="medical-card border-0">
                <CardContent className="py-12">
                  <div className="text-center text-muted-foreground">
                    <Pill className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">Select a patient first</p>
                    <p className="text-sm">Go to Patient Records tab and select a patient to manage their medication reminders</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}