import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/apiClient';
import MedicationReminder from '@/components/MedicationReminder';
import TrendAnalysis from '@/components/TrendAnalysis';
import {
  Heart, 
  Stethoscope, 
  Shield, 
  Clock, 
  Users,
  Activity,
  Sparkles,
  Zap,
  Download,
  History,
  Trash2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface VitalRecord {
  _id: string;
  bloodPressure: string;
  heartRate: string;
  temperature: string;
  analysis: string;
  recordedAt: string;
}

export default function PatientDashboard() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [bloodPressure, setBloodPressure] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [temperature, setTemperature] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState('');
  const [vitalRecords, setVitalRecords] = useState<VitalRecord[]>([]);
  const [showAllRecords, setShowAllRecords] = useState(false);
  
  const displayName = profile?.full_name?.split(' ')[0] || profile?.email?.split('@')[0] || 'there';

  // Load records from MongoDB on mount
  useEffect(() => {
    loadVitalRecords();
  }, []);

  const loadVitalRecords = async () => {
    try {
      const records = await apiClient.getVitalRecords();
      setVitalRecords(records);
    } catch (error) {
      console.error('Error loading vital records:', error);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const analyzeHealthMetrics = async () => {
    if (!bloodPressure || !heartRate || !temperature) {
      toast({
        title: "Missing Information",
        description: "Please fill in all health metrics (BP, Heart Rate, Temperature)",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      // Parse the values
      const bpParts = bloodPressure.split('/');
      const systolic = parseInt(bpParts[0]);
      const diastolic = parseInt(bpParts[1]);
      const hr = parseInt(heartRate);
      const temp = parseFloat(temperature);

      // Basic health analysis logic
      let analysis = `📊 Health Vitals Analysis:\n\n`;
      let issues = [];

      // Blood Pressure Analysis
      if (systolic < 90 || diastolic < 60) {
        issues.push('⚠️ Low Blood Pressure (Hypotension)');
      } else if (systolic >= 140 || diastolic >= 90) {
        issues.push('⚠️ High Blood Pressure (Hypertension)');
      } else {
        analysis += '✅ Blood Pressure: Normal\n';
      }

      // Heart Rate Analysis
      if (hr < 60) {
        issues.push('⚠️ Low Heart Rate (Bradycardia)');
      } else if (hr > 100) {
        issues.push('⚠️ High Heart Rate (Tachycardia)');
      } else {
        analysis += '✅ Heart Rate: Normal\n';
      }

      // Temperature Analysis
      if (temp < 36.1) {
        issues.push('⚠️ Low Temperature (Hypothermia)');
      } else if (temp > 38.5) {
        issues.push('⚠️ High Temperature (Fever)');
      } else {
        analysis += '✅ Temperature: Normal\n';
      }

      if (issues.length > 0) {
        analysis += '\n⚠️ Alerts:\n' + issues.join('\n');
        analysis += '\n\n💡 Recommendations:\n- Consult a healthcare provider\n- Stay hydrated\n- Rest and monitor your vitals';
      } else {
        analysis += '\n✅ All vitals are within normal range! Keep maintaining a healthy lifestyle.';
      }

      setAnalysisResult(analysis);
      
      // Save the record to MongoDB
      const newRecord = await apiClient.createVitalRecord({
        bloodPressure,
        heartRate,
        temperature,
        analysis
      });
      
      // Update local state
      setVitalRecords([newRecord, ...vitalRecords]);
      
      toast({
        title: "Analysis Complete",
        description: "Your health metrics have been analyzed and recorded",
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Error",
        description: error instanceof Error ? error.message : "Please enter valid health metrics values",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadAsExcel = () => {
    if (vitalRecords.length === 0) {
      toast({
        title: "No Records",
        description: "There are no vital records to download",
        variant: "destructive"
      });
      return;
    }

    // Create HTML table for Excel
    let htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Health Vitals</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
        <style>
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #4CAF50; color: white; font-weight: bold; }
          tr:nth-child(even) { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Blood Pressure (mmHg)</th>
              <th>Heart Rate (bpm)</th>
              <th>Temperature (°C)</th>
              <th>Analysis</th>
            </tr>
          </thead>
          <tbody>`;

    vitalRecords.forEach(record => {
      const date = new Date(record.recordedAt);
      htmlContent += `
        <tr>
          <td>${date.toLocaleDateString()}</td>
          <td>${date.toLocaleTimeString()}</td>
          <td>${record.bloodPressure}</td>
          <td>${record.heartRate}</td>
          <td>${record.temperature}</td>
          <td>${record.analysis.replace(/\n/g, ' ')}</td>
        </tr>`;
    });

    htmlContent += `
          </tbody>
        </table>
      </body>
      </html>`;

    // Create and download file
    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `health_vitals_${new Date().toISOString().split('T')[0]}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Download Complete",
      description: "Your health records have been downloaded as Excel file",
    });
  };

  const deleteRecord = async (id: string) => {
    try {
      await apiClient.deleteVitalRecord(id);
      setVitalRecords(vitalRecords.filter(record => record._id !== id));
      
      toast({
        title: "Record Deleted",
        description: "The vital record has been removed",
      });
    } catch (error) {
      console.error('Error deleting record:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete the record",
        variant: "destructive"
      });
    }
  };

  const clearAllRecords = async () => {
    if (window.confirm('Are you sure you want to delete all vital records? This action cannot be undone.')) {
      try {
        await apiClient.deleteAllVitalRecords();
        setVitalRecords([]);
        
        toast({
          title: "All Records Cleared",
          description: "All vital records have been deleted",
        });
      } catch (error) {
        console.error('Error clearing records:', error);
        toast({
          title: "Clear Failed",
          description: "Failed to clear all records",
          variant: "destructive"
        });
      }
    }
  };

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

        {/* Health Vitals Input Section */}
        <Card className="medical-card border-0 overflow-hidden">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Health Vitals Monitor</h2>
                <p className="text-muted-foreground text-sm">Track and analyze your vital signs</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Blood Pressure Input */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Blood Pressure (mmHg)</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    placeholder="e.g., 120/80"
                    value={bloodPressure}
                    onChange={(e) => setBloodPressure(e.target.value)}
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Format: systolic/diastolic</p>
              </div>

              {/* Heart Rate Input */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Heart Rate (bpm)</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="e.g., 72"
                    value={heartRate}
                    onChange={(e) => setHeartRate(e.target.value)}
                    min="0"
                    max="200"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Normal: 60-100 bpm</p>
              </div>

              {/* Temperature Input */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Temperature (°C)</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="e.g., 37.0"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    step="0.1"
                    min="35"
                    max="42"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Normal: 36.5-37.5°C</p>
              </div>
            </div>

            {/* Analyze Button */}
            <Button
              onClick={analyzeHealthMetrics}
              disabled={isAnalyzing}
              className="w-full md:w-auto text-white font-semibold"
              style={{ background: 'linear-gradient(to right, #e74c3c, #c0392b)' }}
            >
              <Zap className="h-4 w-4 mr-2" />
              {isAnalyzing ? 'Analyzing...' : 'Analyze Health Metrics'}
            </Button>

            {/* Analysis Result */}
            {analysisResult && (
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-200/50">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-500" />
                  Analysis Result
                </h3>
                <p className="text-sm text-foreground whitespace-pre-wrap font-medium">
                  {analysisResult}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trend Analysis Section */}
        <div className="mt-8">
          <TrendAnalysis />
        </div>

        {/* Health Records History */}
        {vitalRecords.length > 0 && (
          <Card className="medical-card border-0 overflow-hidden">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                    <History className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Health Records History</h2>
                    <p className="text-muted-foreground text-sm">
                      {showAllRecords 
                        ? `Showing all ${vitalRecords.length} records` 
                        : `Showing last ${Math.min(5, vitalRecords.length)} of ${vitalRecords.length} records`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={downloadAsExcel}
                    variant="outline"
                    className="text-green-600 border-green-600 hover:bg-green-50"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Excel
                  </Button>
                  <Button
                    onClick={clearAllRecords}
                    variant="outline"
                    className="text-red-600 border-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                </div>
              </div>

              {/* Records Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Time</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Blood Pressure</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Heart Rate</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Temperature</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Status</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(showAllRecords ? vitalRecords : vitalRecords.slice(0, 5)).map((record) => {
                      const hasIssues = record.analysis.includes('⚠️');
                      const recordDate = new Date(record.recordedAt);
                      return (
                        <tr key={record._id} className="border-b border-border/50 hover:bg-accent/5 transition-colors">
                          <td className="py-4 px-4 text-sm text-foreground">{recordDate.toLocaleDateString()}</td>
                          <td className="py-4 px-4 text-sm text-foreground">{recordDate.toLocaleTimeString()}</td>
                          <td className="py-4 px-4 text-sm text-foreground font-medium">{record.bloodPressure} mmHg</td>
                          <td className="py-4 px-4 text-sm text-foreground font-medium">{record.heartRate} bpm</td>
                          <td className="py-4 px-4 text-sm text-foreground font-medium">{record.temperature}°C</td>
                          <td className="py-4 px-4">
                            <Badge className={hasIssues ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'}>
                              {hasIssues ? 'Abnormal' : 'Normal'}
                            </Badge>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <Button
                              onClick={() => deleteRecord(record._id)}
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Show More/Less Button */}
              {vitalRecords.length > 5 && (
                <div className="mt-6 flex justify-center">
                  <Button
                    onClick={() => setShowAllRecords(!showAllRecords)}
                    variant="outline"
                    className="w-full max-w-md"
                  >
                    {showAllRecords ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-2" />
                        Show Less (Last 5 Records)
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-2" />
                        Show All {vitalRecords.length} Records
                      </>
                    )}
                  </Button>
                </div>
              )}

              <div className="mt-4 text-sm text-muted-foreground">
                Total Records: {vitalRecords.length}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Medication Reminders */}
        <MedicationReminder />

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
                    Lab report summarizer
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