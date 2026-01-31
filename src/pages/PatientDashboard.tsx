import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/apiClient';
import { thingSpeakService } from '@/lib/thingSpeakService';
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
  ChevronUp,
  Mic,
  Square,
  RefreshCw,
  Wifi,
  Settings
} from 'lucide-react';

interface VitalRecord {
  _id: string;
  bloodPressure: string;
  heartRate: string;
  temperature: string;
  analysis: string;
  recordedAt: string;
}

interface MLPrediction {
  disease: string;
  confidence: number;
  probability_distribution: Record<string, number>;
  risk_level: string;
  recommendations: string[];
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
  const [voiceBusy, setVoiceBusy] = useState(false);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [channelId, setChannelId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [spo2, setSpo2] = useState('');
  const [humidity, setHumidity] = useState('');
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
  const [mlPrediction, setMlPrediction] = useState<MLPrediction | null>(null);
  const [mlLoading, setMlLoading] = useState(false);
  
  const displayName = profile?.full_name?.split(' ')[0] || profile?.email?.split('@')[0] || 'there';

  // Load records from MongoDB on mount
  useEffect(() => {
    loadVitalRecords();
    // Load saved channel ID from localStorage
    const savedChannelId = localStorage.getItem('thingspeak_channel_id');
    if (savedChannelId) {
      setChannelId(savedChannelId);
      thingSpeakService.setChannelId(savedChannelId);
      setIsConnected(true);
    }
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh && isConnected) {
      const interval = setInterval(() => {
        fetchThingSpeakData();
      }, 15000); // Refresh every 15 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, isConnected]);

  const loadVitalRecords = async () => {
    try {
      const records = await apiClient.getVitalRecords();
      setVitalRecords(records);
    } catch (error) {
      console.error('Error loading vital records:', error);
    }
  };

  const connectToThingSpeak = () => {
    if (!channelId.trim()) {
      toast({
        title: "Channel ID Required",
        description: "Please enter your ThingSpeak Channel ID",
        variant: "destructive"
      });
      return;
    }
    
    thingSpeakService.setChannelId(channelId);
    localStorage.setItem('thingspeak_channel_id', channelId);
    setIsConnected(true);
    
    toast({
      title: "Connected",
      description: "Successfully connected to ThingSpeak channel",
    });
    
    // Fetch initial data
    fetchThingSpeakData();
  };

  const disconnectThingSpeak = () => {
    setIsConnected(false);
    setAutoRefresh(false);
    localStorage.removeItem('thingspeak_channel_id');
    
    toast({
      title: "Disconnected",
      description: "Disconnected from ThingSpeak",
    });
  };

  const fetchThingSpeakData = async () => {
    if (!isConnected) return;
    
    setIsFetching(true);
    try {
      const data = await thingSpeakService.getLatestData();
      
      if (data) {
        // Update the vitals with IoT data
        setTemperature(data.temperature);
        setHeartRate(data.heartRate);
        setSpo2(data.spo2);
        setHumidity(data.humidity);
        setLastFetchTime(new Date(data.timestamp));
        
        // Calculate blood pressure estimate (this is a placeholder - actual BP needs proper sensor)
        // In a real scenario, you'd have a BP sensor in field5/field6
        const systolic = Math.round(110 + (parseFloat(data.heartRate) - 70) * 0.5);
        const diastolic = Math.round(70 + (parseFloat(data.heartRate) - 70) * 0.3);
        setBloodPressure(`${systolic}/${diastolic}`);
        
        toast({
          title: "Data Updated",
          description: `Latest sensor readings fetched from IoT device`,
        });
      } else {
        toast({
          title: "No Data",
          description: "No data available from ThingSpeak channel",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching ThingSpeak data:', error);
      toast({
        title: "Fetch Failed",
        description: error instanceof Error ? error.message : "Failed to fetch data from ThingSpeak",
        variant: "destructive"
      });
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const analyzeHealthMetrics = async () => {
    if (!bloodPressure || !heartRate || !temperature || !spo2) {
      toast({
        title: "Missing Information",
        description: "Please fill in all health metrics (BP, Heart Rate, Temperature, SpO₂)",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    setMlLoading(true);
    try {
      // Parse the values
      const bpParts = bloodPressure.split('/');
      const systolic = parseInt(bpParts[0]);
      const diastolic = parseInt(bpParts[1]);
      const hr = parseInt(heartRate);
      const temp = parseFloat(temperature);
      const o2 = parseFloat(spo2);

      // Get ML prediction
      let mlData = null;
      try {
        mlData = await apiClient.predictDisease({
          blood_pressure_systolic: systolic,
          blood_pressure_diastolic: diastolic,
          heart_rate: hr,
          temperature: temp,
          spo2: o2
        });
        setMlPrediction(mlData);
      } catch (mlError) {
        console.warn('ML prediction failed, using basic analysis:', mlError);
      }

      // Basic health analysis logic combined with ML insights
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

      // Add ML prediction to analysis
      if (mlData) {
        analysis += `\n🤖 ML Disease Prediction:\n`;
        analysis += `Disease: ${mlData.disease}\n`;
        analysis += `Confidence: ${(mlData.confidence * 100).toFixed(1)}%\n`;
        analysis += `Risk Level: ${mlData.risk_level.toUpperCase()}\n`;
        
        if (mlData.recommendations && mlData.recommendations.length > 0) {
          analysis += `\n💡 Recommendations:\n`;
          mlData.recommendations.slice(0, 3).forEach(rec => {
            analysis += `- ${rec}\n`;
          });
        }
      }

      if (issues.length > 0) {
        if (!mlData) {
          analysis += '\n⚠️ Alerts:\n' + issues.join('\n');
          analysis += '\n\n💡 Recommendations:\n- Consult a healthcare provider\n- Stay hydrated\n- Rest and monitor your vitals';
        }
      } else if (!mlData) {
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
      setMlLoading(false);
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

  const speakLatestVitals = () => {
    if (typeof window === 'undefined' || !("speechSynthesis" in window)) {
      toast({ title: 'Not supported', description: 'Speech is not available in this browser', variant: 'destructive' });
      return;
    }
    if (!vitalRecords.length) {
      toast({ title: 'No vitals yet', description: 'Add a reading first to use voice summary' });
      return;
    }

    const latest = vitalRecords[0];
    const recorded = new Date(latest.recordedAt).toLocaleString();
    const summary = `Latest vitals. Blood pressure ${latest.bloodPressure}. Heart rate ${latest.heartRate} beats per minute. Temperature ${latest.temperature} degrees. Recorded at ${recorded}.`;

    const engine = window.speechSynthesis;
    engine.cancel();
    const utterance = new SpeechSynthesisUtterance(summary);
    speechRef.current = utterance;
    setVoiceBusy(true);
    utterance.onend = () => setVoiceBusy(false);
    engine.speak(utterance);
  };

  const stopVoice = () => {
    if (typeof window === 'undefined' || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setVoiceBusy(false);
  };

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

        {/* ThingSpeak IoT Connection Section */}
        <Card className="medical-card border-0 overflow-hidden">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                <Wifi className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">IoT Sensor Connection</h2>
                <p className="text-muted-foreground text-sm">Connect to ThingSpeak for real-time sensor data</p>
              </div>
            </div>

            {!isConnected ? (
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 space-y-2">
                    <label className="text-sm font-semibold text-foreground">ThingSpeak Channel ID</label>
                    <Input
                      type="text"
                      placeholder="Enter your channel ID"
                      value={channelId}
                      onChange={(e) => setChannelId(e.target.value)}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Find your Channel ID in ThingSpeak dashboard. Read API Key: 3QS1ZZ61IU0EWCHG
                    </p>
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={connectToThingSpeak}
                      className="text-white font-semibold"
                      style={{ background: 'linear-gradient(to right, #0066cc, #2e8b57)' }}
                    >
                      <Wifi className="h-4 w-4 mr-2" />
                      Connect
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Connected to Channel: {channelId}</p>
                      {lastFetchTime && (
                        <p className="text-xs text-muted-foreground">
                          Last updated: {lastFetchTime.toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={fetchThingSpeakData}
                      disabled={isFetching}
                      variant="outline"
                      size="sm"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                      {isFetching ? 'Fetching...' : 'Fetch Now'}
                    </Button>
                    <Button
                      onClick={() => setAutoRefresh(!autoRefresh)}
                      variant={autoRefresh ? "default" : "outline"}
                      size="sm"
                    >
                      {autoRefresh ? 'Auto-Refresh ON' : 'Auto-Refresh OFF'}
                    </Button>
                    <Button
                      onClick={disconnectThingSpeak}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      Disconnect
                    </Button>
                  </div>
                </div>
                
                {/* IoT Sensor Readings Display */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
                    <p className="text-xs text-muted-foreground mb-1">Heart Rate (BPM)</p>
                    <p className="text-2xl font-bold text-foreground">{heartRate || '--'}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-green-500/10 to-teal-500/10 rounded-lg border border-green-500/20">
                    <p className="text-xs text-muted-foreground mb-1">SpO2</p>
                    <p className="text-2xl font-bold text-foreground">{spo2 || '--'}%</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-lg border border-red-500/20">
                    <p className="text-xs text-muted-foreground mb-1">Temperature</p>
                    <p className="text-2xl font-bold text-foreground">{temperature || '--'}°C</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-lg border border-cyan-500/20">
                    <p className="text-xs text-muted-foreground mb-1">Humidity</p>
                    <p className="text-2xl font-bold text-foreground">{humidity || '--'}%</p>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground text-center">
                  {autoRefresh && '🔄 Auto-refreshing every 15 seconds'}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Health Vitals Input Section */}
        <Card className="medical-card border-0 overflow-hidden">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Health Vitals Monitor</h2>
                <p className="text-muted-foreground text-sm">
                  {isConnected ? 'IoT sensors connected - data auto-populated' : 'Track and analyze your vital signs'}
                </p>
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
                    disabled={isConnected && autoRefresh}
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
                    disabled={isConnected && autoRefresh}
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
                    disabled={isConnected && autoRefresh}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Normal: 36.5-37.5°C</p>
              </div>

              {/* SpO2 Input */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">SpO₂ (Oxygen Saturation %)</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="e.g., 98"
                    value={spo2}
                    onChange={(e) => setSpo2(e.target.value)}
                    min="0"
                    max="100"
                    disabled={isConnected && autoRefresh}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Normal: 95-100%</p>
              </div>
            </div>

            {/* Additional IoT Sensor Readings */}
            {isConnected && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Humidity Input */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Humidity (%)</label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="e.g., 65"
                      value={humidity}
                      onChange={(e) => setHumidity(e.target.value)}
                      min="0"
                      max="100"
                      disabled={autoRefresh}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Comfortable: 30-60%</p>
                </div>
              </div>
            )}

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

            {/* ML Disease Prediction Card */}
            {mlLoading && (
              <div className="mt-6 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-200/50">
                <div className="flex items-center gap-2">
                  <div className="animate-spin">
                    <Sparkles className="h-5 w-5 text-amber-600" />
                  </div>
                  <p className="text-sm font-medium text-foreground">ML Model analyzing vitals...</p>
                </div>
              </div>
            )}

            {mlPrediction && !mlLoading && (
              <div className={`mt-6 p-6 rounded-xl border-2 ${
                mlPrediction.risk_level === 'high' 
                  ? 'bg-red-500/10 border-red-300/50' 
                  : mlPrediction.risk_level === 'medium'
                  ? 'bg-amber-500/10 border-amber-300/50'
                  : 'bg-green-500/10 border-green-300/50'
              }`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Sparkles className={`h-6 w-6 ${
                      mlPrediction.risk_level === 'high' 
                        ? 'text-red-600' 
                        : mlPrediction.risk_level === 'medium'
                        ? 'text-amber-600'
                        : 'text-green-600'
                    }`} />
                    <div>
                      <h3 className="font-bold text-lg text-foreground">AI Health Prediction</h3>
                      <p className="text-xs text-muted-foreground">Powered by ML Model (95% accuracy)</p>
                    </div>
                  </div>
                  <Badge className={
                    mlPrediction.risk_level === 'high' 
                      ? 'bg-red-600 text-white' 
                      : mlPrediction.risk_level === 'medium'
                      ? 'bg-amber-600 text-white'
                      : 'bg-green-600 text-white'
                  }>
                    {mlPrediction.risk_level.toUpperCase()}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Predicted Condition</p>
                    <p className="text-xl font-bold text-foreground">{mlPrediction.disease}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Confidence Score</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-full rounded-full ${
                            mlPrediction.confidence >= 0.9 
                              ? 'bg-red-600' 
                              : mlPrediction.confidence >= 0.8
                              ? 'bg-amber-600'
                              : 'bg-green-600'
                          }`}
                          style={{ width: `${mlPrediction.confidence * 100}%` }}
                        />
                      </div>
                      <span className="font-bold text-foreground min-w-[50px]">
                        {(mlPrediction.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                {mlPrediction.recommendations && mlPrediction.recommendations.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-2">Recommendations:</p>
                    <ul className="space-y-1">
                      {mlPrediction.recommendations.slice(0, 4).map((rec, idx) => (
                        <li key={idx} className="text-sm text-foreground flex items-start gap-2">
                          <span className="text-green-600 font-bold mt-0.5">✓</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {mlPrediction.probability_distribution && (
                  <div className="mt-4 pt-4 border-t border-gray-300/30">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Disease Probabilities:</p>
                    <div className="space-y-2">
                      {Object.entries(mlPrediction.probability_distribution)
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 5)
                        .map(([disease, prob]) => (
                          <div key={disease} className="flex items-center justify-between text-xs">
                            <span className="text-foreground">{disease}</span>
                            <span className="font-mono text-muted-foreground">{(prob * 100).toFixed(1)}%</span>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Voice Assistant (quick vitals readout) */}
        <Card className="medical-card border-0 overflow-hidden">
          <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Mic className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Voice Assistant</h3>
              </div>
              <p className="text-sm text-muted-foreground">Hear a quick summary of your latest recorded vitals. Runs locally; nothing is uploaded.</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button onClick={voiceBusy ? stopVoice : speakLatestVitals} className="flex-1 md:flex-none">
                {voiceBusy ? (
                  <>
                    <Square className="h-4 w-4 mr-2" /> Stop
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 mr-2" /> Speak latest vitals
                  </>
                )}
              </Button>
              {!voiceBusy && (
                <Button variant="outline" onClick={() => window.open('/health-insights', '_self')} className="flex-1 md:flex-none">
                  Open full insights
                </Button>
              )}
            </div>
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