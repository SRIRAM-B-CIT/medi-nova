import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Activity, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/apiClient';
import { HealthInsights } from '@/components/HealthInsights';

interface VitalRecord {
  _id: string;
  bloodPressure: string;
  heartRate: string;
  temperature: string;
  analysis: string;
  recordedAt: string;
}

interface PatientDetailsShape {
  age?: number;
  chronic_conditions?: string[];
  lifestyle?: string[];
}

export default function HealthInsightsPage() {
  const { toast } = useToast();
  const [vitals, setVitals] = useState<VitalRecord[]>([]);
  const [patientDetails, setPatientDetails] = useState<PatientDetailsShape | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [records, details] = await Promise.all([
          apiClient.getVitalRecords(),
          apiClient.getPatientDetails().catch(() => null),
        ]);
        setVitals(records || []);
        setPatientDetails(details);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load insights data';
        toast({ title: 'Error', description: message, variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [toast]);

  const showEmpty = !isLoading && vitals.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10 text-primary">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">AI Health Insights</h1>
            <p className="text-sm text-muted-foreground">Personalized risk scores, anomalies, and preventive guidance</p>
          </div>
        </div>
        <Link to="/">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {isLoading && (
        <Card className="border-dashed border-border">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Loading insights...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-24 rounded-lg bg-muted/40 animate-pulse" />
          </CardContent>
        </Card>
      )}

      {showEmpty && (
        <Alert className="border-2 border-dashed">
          <AlertTitle>No vitals yet</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>Add a few readings to unlock your Health Risk Index, predictive alerts, and passport.</p>
            <Link to="/">
              <Button size="sm">Add vitals from Dashboard</Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && vitals.length > 0 && (
        <HealthInsights vitals={vitals} patientDetails={patientDetails} />
      )}
    </div>
  );
}
