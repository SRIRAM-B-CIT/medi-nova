import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/apiClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { User, Calculator, Heart, Phone, AlertTriangle, Pill, Info } from 'lucide-react';

interface PatientDetailsForm {
  full_name: string;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  age: number;
  height_cm: number;
  weight_kg: number;
  blood_group: string;
  previous_medications: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  allergies: string;
  medical_conditions: string;
}

export default function PatientDetails() {
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(true);
  const [bmi, setBmi] = useState<number | null>(null);
  const [bmiCategory, setBmiCategory] = useState<string>('');
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { user, profile, setHasHealthRecord, hasHealthRecord } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<PatientDetailsForm>({
    full_name: '',
    gender: 'prefer_not_to_say',
    age: 0,
    height_cm: 0,
    weight_kg: 0,
    blood_group: '',
    previous_medications: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    allergies: '',
    medical_conditions: ''
  });

  // Load existing patient details
  useEffect(() => {
    const loadPatientDetails = async () => {
      if (!user) return;
      
      try {
        const data = await apiClient.getPatientDetails();

        if (data) {
          setFormData({
            full_name: data.full_name || '',
            gender: data.gender || 'prefer_not_to_say',
            age: data.age || 0,
            height_cm: data.height || 0,
            weight_kg: data.weight || 0,
            blood_group: data.blood_group || '',
            previous_medications: data.current_medications?.join(', ') || '',
            emergency_contact_name: data.emergency_contact_name || '',
            emergency_contact_phone: data.emergency_contact_phone || '',
            allergies: data.allergies?.join(', ') || '',
            medical_conditions: data.chronic_conditions?.join(', ') || ''
          });
          setIsEditing(false);
          setIsNewPatient(false);
        }
      } catch (error: any) {
        if (error.message.includes('404') || error.message.includes('not found')) {
          setIsNewPatient(true);
          setIsEditing(true);
          if (profile?.full_name) {
            setFormData(prev => ({ ...prev, full_name: profile.full_name || '' }));
          }
        } else {
          console.error('Error loading patient details:', error);
        }
      }
    };

    loadPatientDetails();
  }, [user, profile]);

  // Redirect if not authenticated or if doctor
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (profile?.role === 'doctor') {
      navigate('/');
      return;
    }
  }, [user, profile, navigate]);

  // Calculate BMI when height or weight changes
  useEffect(() => {
    if (formData.height_cm > 0 && formData.weight_kg > 0) {
      const heightInMeters = formData.height_cm / 100;
      const calculatedBmi = formData.weight_kg / (heightInMeters * heightInMeters);
      setBmi(Math.round(calculatedBmi * 10) / 10);
      
      // BMI Categories
      if (calculatedBmi < 18.5) {
        setBmiCategory('Underweight');
      } else if (calculatedBmi < 25) {
        setBmiCategory('Normal weight');
      } else if (calculatedBmi < 30) {
        setBmiCategory('Overweight');
      } else {
        setBmiCategory('Obese');
      }
    } else {
      setBmi(null);
      setBmiCategory('');
    }
  }, [formData.height_cm, formData.weight_kg]);

  const validateForm = (): boolean => {
    const errors: string[] = [];
    
    if (!formData.full_name.trim()) {
      errors.push('Full Name is required');
    }
    if (!formData.age || formData.age <= 0) {
      errors.push('Please enter a valid age');
    }
    if (!formData.height_cm || formData.height_cm <= 0) {
      errors.push('Please enter your height');
    }
    if (!formData.weight_kg || formData.weight_kg <= 0) {
      errors.push('Please enter your weight');
    }
    if (!formData.emergency_contact_name.trim()) {
      errors.push('Emergency contact name is required');
    }
    if (!formData.emergency_contact_phone.trim()) {
      errors.push('Emergency contact phone is required');
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Please fill all required fields",
        description: "Some required information is missing.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);

    try {
      const submitData: any = {
        full_name: formData.full_name,
        gender: formData.gender,
        age: formData.age,
        height: formData.height_cm,
        weight: formData.weight_kg,
        current_medications: formData.previous_medications.split(',').map(s => s.trim()).filter(Boolean),
        emergency_contact_name: formData.emergency_contact_name,
        emergency_contact_phone: formData.emergency_contact_phone,
        allergies: formData.allergies.split(',').map(s => s.trim()).filter(Boolean),
        chronic_conditions: formData.medical_conditions.split(',').map(s => s.trim()).filter(Boolean),
      };
      
      // Only include blood_group if it's not empty
      if (formData.blood_group) {
        submitData.blood_group = formData.blood_group;
      }
      
      const data = await apiClient.createOrUpdatePatientDetails(submitData);

      setHasHealthRecord(true);
      setIsNewPatient(false);
      
      toast({
        title: "Details saved successfully!",
        description: isNewPatient ? "Welcome to MediNova! Redirecting to your dashboard..." : "Your patient information has been updated.",
      });
      setIsEditing(false);
      
      if (isNewPatient) {
        setTimeout(() => {
          navigate('/');
        }, 1500);
      }
    } catch (error: any) {
      toast({
        title: "Error saving details",
        description: error.message || "There was an error saving your details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof PatientDetailsForm, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getBmiColor = () => {
    if (!bmi) return 'text-muted-foreground';
    if (bmi < 18.5) return 'text-blue-600';
    if (bmi < 25) return 'text-green-600';
    if (bmi < 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!user) return null;

  return (
    <div className="min-h-screen creative-bg p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Welcome Alert for New Patients */}
        {isNewPatient && (
          <Alert className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/30 dark:to-blue-950/30 border-green-200 dark:border-green-800">
            <Info className="h-5 w-5 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              <span className="font-semibold">Welcome to MediNova!</span> Please complete your health profile below. 
              All fields marked as required must be filled before you can access your dashboard.
            </AlertDescription>
          </Alert>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-5 w-5" />
            <AlertDescription>
              <ul className="list-disc list-inside">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="medical-card p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground font-['Poppins']">
                  {isNewPatient ? 'Complete Your Health Profile' : 'Patient Details'}
                </h1>
                <p className="text-muted-foreground">
                  {isNewPatient ? 'Fill in your details to get started' : 'Manage your health information'}
                </p>
              </div>
            </div>
            {!isEditing && !isNewPatient && (
              <Button onClick={() => setIsEditing(true)} variant="outline">
                Edit Details
              </Button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <Card className="medical-card border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>Basic demographic and contact information</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name <span className="text-red-500">*</span></Label>
                <Input
                  id="fullName"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  placeholder="Enter your full name"
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select 
                  value={formData.gender} 
                  onValueChange={(value) => handleInputChange('gender', value)}
                  disabled={!isEditing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">Age <span className="text-red-500">*</span></Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age || ''}
                  onChange={(e) => handleInputChange('age', parseInt(e.target.value) || 0)}
                  placeholder="Enter your age"
                  disabled={!isEditing}
                  min="1"
                  max="150"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bloodGroup">Blood Group</Label>
                <Select 
                  value={formData.blood_group} 
                  onValueChange={(value) => handleInputChange('blood_group', value)}
                  disabled={!isEditing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select blood group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Physical Measurements */}
          <Card className="medical-card border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Physical Measurements
              </CardTitle>
              <CardDescription>Height, weight, and BMI calculation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="height">Height (cm) <span className="text-red-500">*</span></Label>
                  <Input
                    id="height"
                    type="number"
                    value={formData.height_cm || ''}
                    onChange={(e) => handleInputChange('height_cm', parseFloat(e.target.value) || 0)}
                    placeholder="Enter height in cm"
                    disabled={!isEditing}
                    min="50"
                    max="300"
                    step="0.1"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg) <span className="text-red-500">*</span></Label>
                  <Input
                    id="weight"
                    type="number"
                    value={formData.weight_kg || ''}
                    onChange={(e) => handleInputChange('weight_kg', parseFloat(e.target.value) || 0)}
                    placeholder="Enter weight in kg"
                    disabled={!isEditing}
                    min="10"
                    max="500"
                    step="0.1"
                    required
                  />
                </div>
              </div>

              {/* BMI Display */}
              {bmi && (
                <div className="data-card p-4 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <Calculator className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Body Mass Index (BMI)</p>
                        <div className="flex items-center gap-2">
                          <span className={`text-2xl font-bold ${getBmiColor()}`}>{bmi}</span>
                          <span className={`text-sm font-medium ${getBmiColor()}`}>({bmiCategory})</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Medical History */}
          <Card className="medical-card border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Medical History
              </CardTitle>
              <CardDescription>Previous medications, allergies, and conditions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="medications">Previous Medications</Label>
                <Textarea
                  id="medications"
                  value={formData.previous_medications}
                  onChange={(e) => handleInputChange('previous_medications', e.target.value)}
                  placeholder="List any medications you are currently taking or have taken recently..."
                  disabled={!isEditing}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="allergies">Allergies</Label>
                <Textarea
                  id="allergies"
                  value={formData.allergies}
                  onChange={(e) => handleInputChange('allergies', e.target.value)}
                  placeholder="List any known allergies to medications, foods, or substances..."
                  disabled={!isEditing}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="conditions">Medical Conditions</Label>
                <Textarea
                  id="conditions"
                  value={formData.medical_conditions}
                  onChange={(e) => handleInputChange('medical_conditions', e.target.value)}
                  placeholder="List any current or past medical conditions..."
                  disabled={!isEditing}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card className="medical-card border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Emergency Contact
              </CardTitle>
              <CardDescription>Person to contact in case of emergency</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyName">Contact Name <span className="text-red-500">*</span></Label>
                <Input
                  id="emergencyName"
                  value={formData.emergency_contact_name}
                  onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                  placeholder="Emergency contact full name"
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyPhone">Contact Phone <span className="text-red-500">*</span></Label>
                <Input
                  id="emergencyPhone"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  disabled={!isEditing}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-4 justify-end">
              {!isNewPatient && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditing(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              )}
              <Button 
                type="submit" 
                disabled={isLoading}
                className="text-white"
                style={{ background: 'linear-gradient(to right, #0066cc, #2e8b57)' }}
              >
                {isLoading ? "Saving..." : isNewPatient ? "Save Details & Continue" : "Save Details"}
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}