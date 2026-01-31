import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, User, Heart, Phone, Pill, Activity } from 'lucide-react';

interface PatientDetails {
  id: string;
  user_id: string;
  full_name: string;
  gender: string;
  age: number;
  height_cm: number;
  weight_kg: number;
  bmi: number;
  previous_medications: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  allergies: string;
  medical_conditions: string;
  created_at: string;
  updated_at: string;
}

interface EmergencyPatientDetailsProps {
  userId?: string;
  showEmergencyContact?: boolean;
}

export function EmergencyPatientDetails({ userId, showEmergencyContact = true }: EmergencyPatientDetailsProps) {
  const [patientDetails, setPatientDetails] = useState<PatientDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      fetchPatientDetails(userId);
    }
  }, [userId]);

  const fetchPatientDetails = async (targetUserId: string) => {
    setIsLoading(true);
    try {
      const data = await apiClient.getPatientDetailsByUserId(targetUserId);
      setPatientDetails(data);
    } catch (error: any) {
      if (error?.message && /not found/i.test(error.message)) {
        setPatientDetails(null);
      } else {
        console.error('Error fetching patient details:', error);
        toast({
          title: "Error loading patient details",
          description: "Unable to retrieve patient information",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const callEmergencyContact = () => {
    if (patientDetails?.emergency_contact_phone) {
      window.open(`tel:${patientDetails.emergency_contact_phone}`, '_self');
    }
  };

  if (isLoading) {
    return (
      <Card className="medical-card border-orange-200">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!patientDetails) {
    return (
      <Card className="medical-card border-yellow-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <CardTitle className="text-lg">Patient Details Not Available</CardTitle>
          </div>
          <CardDescription>
            No patient information found. Please ensure the patient has completed their medical profile.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const getBmiCategory = (bmi: number) => {
    if (bmi < 18.5) return { text: 'Underweight', color: 'text-blue-600' };
    if (bmi < 25) return { text: 'Normal', color: 'text-green-600' };
    if (bmi < 30) return { text: 'Overweight', color: 'text-yellow-600' };
    return { text: 'Obese', color: 'text-red-600' };
  };

  const bmiCategory = getBmiCategory(patientDetails.bmi);

  return (
    <div className="space-y-4">
      {/* Emergency Contact Card */}
      {showEmergencyContact && patientDetails.emergency_contact_name && (
        <Card className="medical-card border-red-200 bg-red-50/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-red-600" />
                <CardTitle className="text-lg text-red-800">Emergency Contact</CardTitle>
              </div>
              <Button 
                onClick={callEmergencyContact}
                className="bg-red-600 hover:bg-red-700 text-white"
                size="sm"
              >
                <Phone className="h-4 w-4 mr-1" />
                Call Now
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1">
              <p className="font-medium text-red-900">{patientDetails.emergency_contact_name}</p>
              <p className="text-red-700">{patientDetails.emergency_contact_phone}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Patient Information */}
      <Card className="medical-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <CardTitle>Patient Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="font-semibold">{patientDetails.full_name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Age</p>
              <p className="font-semibold">{patientDetails.age} years</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Gender</p>
              <p className="font-semibold capitalize">{patientDetails.gender.replace('_', ' ')}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">BMI</p>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{patientDetails.bmi}</span>
                <Badge variant="outline" className={bmiCategory.color}>
                  {bmiCategory.text}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Height</p>
              <p className="font-semibold">{patientDetails.height_cm} cm</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Weight</p>
              <p className="font-semibold">{patientDetails.weight_kg} kg</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medical History */}
      {(patientDetails.medical_conditions || patientDetails.allergies || patientDetails.previous_medications) && (
        <Card className="medical-card border-orange-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-orange-600" />
              <CardTitle>Medical History</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {patientDetails.medical_conditions && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Medical Conditions</p>
                <p className="text-sm bg-orange-50 p-2 rounded">{patientDetails.medical_conditions}</p>
              </div>
            )}
            
            {patientDetails.allergies && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Allergies</p>
                <p className="text-sm bg-red-50 p-2 rounded text-red-800">{patientDetails.allergies}</p>
              </div>
            )}
            
            {patientDetails.previous_medications && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Current/Previous Medications</p>
                <p className="text-sm bg-blue-50 p-2 rounded">{patientDetails.previous_medications}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}