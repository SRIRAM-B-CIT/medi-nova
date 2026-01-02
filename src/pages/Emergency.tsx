import { useState } from 'react';
import { EmergencyButton } from '@/components/EmergencyButton';
import { EmergencyPatientDetails } from '@/components/EmergencyPatientDetails';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Heart, 
  Scissors, 
  Wind, 
  Flame, 
  AlertTriangle,
  Phone,
  User,
  Shield,
  Search
} from 'lucide-react';

export default function Emergency() {
  const { user } = useAuth();
  const [searchUserId, setSearchUserId] = useState('');
  const [activeTab, setActiveTab] = useState('emergency');

  const handleEmergencyClick = (emergency: string) => {
    console.log(`Emergency selected: ${emergency}`);
    // Navigate to specific emergency guidance
  };

  const handleSearchPatient = () => {
    if (searchUserId.trim()) {
      setActiveTab('patient-details');
    }
  };

  return (
    <div className="min-h-screen creative-bg p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="medical-card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground font-['Poppins']">Emergency Response</h1>
              <p className="text-muted-foreground">Immediate medical assistance and patient information</p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="emergency">Emergency Actions</TabsTrigger>
            <TabsTrigger value="my-details">My Details</TabsTrigger>
            <TabsTrigger value="patient-details">Patient Lookup</TabsTrigger>
          </TabsList>

          <TabsContent value="emergency" className="space-y-6">
            {/* Emergency Call Section */}
            <Card className="medical-card border-red-200 bg-red-50/30">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-red-600" />
                  <CardTitle className="text-red-800">Emergency Services</CardTitle>
                </div>
                <CardDescription>Call emergency services immediately for life-threatening situations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <EmergencyButton
                    icon={Phone}
                    title="Call 911"
                    description="Emergency services"
                    onClick={() => window.open('tel:911', '_self')}
                    variant="emergency"
                  />
                  <EmergencyButton
                    icon={Phone}
                    title="Poison Control"
                    description="1-800-222-1222"
                    onClick={() => window.open('tel:18002221222', '_self')}
                    variant="emergency"
                  />
                  <EmergencyButton
                    icon={Phone}
                    title="Crisis Hotline"
                    description="988 - Mental Health"
                    onClick={() => window.open('tel:988', '_self')}
                    variant="emergency"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Quick Emergency Actions */}
            <Card className="medical-card">
              <CardHeader>
                <CardTitle>Common Emergency Situations</CardTitle>
                <CardDescription>Quick access to emergency response guidelines</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <EmergencyButton
                    icon={Heart}
                    title="Heart Attack"
                    description="Chest pain response"
                    onClick={() => handleEmergencyClick('heart-attack')}
                    variant="emergency"
                  />
                  <EmergencyButton
                    icon={Wind}
                    title="Choking"
                    description="Heimlich maneuver"
                    onClick={() => handleEmergencyClick('choking')}
                    variant="emergency"
                  />
                  <EmergencyButton
                    icon={Flame}
                    title="Burns"
                    description="Burn treatment"
                    onClick={() => handleEmergencyClick('burns')}
                    variant="emergency"
                  />
                  <EmergencyButton
                    icon={Scissors}
                    title="Cuts"
                    description="Wound care"
                    onClick={() => handleEmergencyClick('cuts')}
                    variant="emergency"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="my-details" className="space-y-6">
            <Card className="medical-card">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <CardTitle>My Emergency Medical Information</CardTitle>
                </div>
                <CardDescription>Your medical details for emergency responders</CardDescription>
              </CardHeader>
              <CardContent>
                {user ? (
                  <EmergencyPatientDetails userId={user.id} showEmergencyContact={true} />
                ) : (
                  <p className="text-muted-foreground">Please log in to view your emergency medical information.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="patient-details" className="space-y-6">
            <Card className="medical-card">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-secondary" />
                  <CardTitle>Patient Information Lookup</CardTitle>
                </div>
                <CardDescription>Access patient medical details for emergency care (Medical professionals only)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label htmlFor="search-user">Patient User ID</Label>
                      <Input
                        id="search-user"
                        value={searchUserId}
                        onChange={(e) => setSearchUserId(e.target.value)}
                        placeholder="Enter patient user ID"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={handleSearchPatient} className="bg-secondary hover:bg-secondary/90">
                        <Search className="h-4 w-4 mr-2" />
                        Search
                      </Button>
                    </div>
                  </div>
                  
                  {searchUserId.trim() && (
                    <div className="mt-6">
                      <EmergencyPatientDetails userId={searchUserId.trim()} showEmergencyContact={true} />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}