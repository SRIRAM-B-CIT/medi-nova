import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/apiClient';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Clock,
  Activity,
  Thermometer,
  Heart,
  RefreshCw,
  BarChart3,
  Download,
  Sparkles,
} from 'lucide-react';

interface TrendAnalysisData {
  success: boolean;
  dataPoints: number;
  latestVitals: {
    bloodPressure: string;
    heartRate: string;
    temperature: string;
    recordedAt: string;
  };
  trends: {
    bpTrend: number;
    hrTrend: number;
    tempTrend: number;
    interpretation: {
      bp: string;
      hr: string;
      temp: string;
    };
  };
  peakTimes: {
    bloodPressure: string;
    heartRate: string;
    temperature: string;
    details: {
      bp: Record<string, string>;
      hr: Record<string, string>;
      temp: Record<string, string>;
    };
  };
  diseasePrediction: string;
  riskSeverity: 'low' | 'moderate' | 'high';
  riskFactors: string[];
  mlPrediction?: {
    disease: string;
    confidence: number;
    probabilities: Record<string, number>;
    recommendations: string[];
  } | null;
  vitalHistory: Array<{
    bpSystolic: number;
    heartRate: number;
    temperature: number;
    recordedAt: string;
  }>;
}

export default function TrendAnalysis() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState<TrendAnalysisData | null>(null);
  const [showChart, setShowChart] = useState(false);

  const getTrendIcon = (trend: number) => {
    if (trend > 0.1) return <TrendingUp className="w-4 h-4 text-red-500" />;
    if (trend < -0.1) return <TrendingDown className="w-4 h-4 text-green-500" />;
    return <Minus className="w-4 h-4 text-yellow-500" />;
  };

  const getRiskColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 border-red-300 text-red-900';
      case 'moderate':
        return 'bg-yellow-100 border-yellow-300 text-yellow-900';
      default:
        return 'bg-green-100 border-green-300 text-green-900';
    }
  };

  const getRiskIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'moderate':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    }
  };

  const formatRiskFactor = (factor: string) => {
    return factor
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const analyzeTrend = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getTrendAnalysis(20);
      setAnalysisData(data);
      setShowChart(true);
      toast({
        title: 'Analysis Complete',
        description: `Analyzed ${data.dataPoints} vital records from last 10 days`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze trends';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadAsWord = () => {
    if (!analysisData) return;

    // Create HTML content that Word can open
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Medical Trend Analysis Report</title>
  <style>
    @page {
      margin: 2.5cm;
    }
    body { 
      font-family: 'Times New Roman', Times, serif; 
      margin: 0;
      padding: 20px;
      line-height: 1.8;
      color: #000;
      font-size: 11pt;
    }
    .header {
      text-align: center;
      border-bottom: 3px double #000;
      padding-bottom: 15px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0;
      font-size: 18pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #000;
    }
    .header p {
      margin: 5px 0;
      font-size: 10pt;
      color: #333;
    }
    .report-info {
      background: #f5f5f5;
      padding: 15px;
      border-left: 4px solid #2563eb;
      margin-bottom: 25px;
    }
    .report-info table {
      width: 100%;
      border: none;
    }
    .report-info td {
      padding: 5px;
      border: none;
    }
    .report-info .label {
      font-weight: bold;
      width: 180px;
    }
    .section {
      margin-bottom: 30px;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 14pt;
      font-weight: bold;
      color: #1e40af;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 5px;
      margin-bottom: 15px;
      margin-top: 25px;
      text-transform: uppercase;
    }
    .subsection-title {
      font-size: 12pt;
      font-weight: bold;
      color: #1e3a8a;
      margin-top: 15px;
      margin-bottom: 10px;
    }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin: 15px 0;
      font-size: 10pt;
    }
    th { 
      background: #2563eb;
      color: white;
      font-weight: bold;
      padding: 10px;
      text-align: left;
      border: 1px solid #1e40af;
    }
    td { 
      border: 1px solid #cbd5e1;
      padding: 10px;
      vertical-align: top;
    }
    tr:nth-child(even) {
      background: #f8fafc;
    }
    .risk-box {
      padding: 20px;
      border: 3px solid;
      margin: 20px 0;
      page-break-inside: avoid;
    }
    .risk-high { 
      background: #fef2f2;
      border-color: #dc2626;
    }
    .risk-moderate { 
      background: #fefce8;
      border-color: #eab308;
    }
    .risk-low { 
      background: #f0fdf4;
      border-color: #16a34a;
    }
    .risk-title {
      font-size: 13pt;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .risk-severity {
      display: inline-block;
      padding: 5px 15px;
      font-weight: bold;
      color: white;
      margin: 10px 0;
      font-size: 11pt;
    }
    .severity-high { background: #dc2626; }
    .severity-moderate { background: #eab308; }
    .severity-low { background: #16a34a; }
    .factor-list {
      margin: 15px 0;
      padding-left: 20px;
    }
    .factor-item {
      margin: 8px 0;
      padding: 8px;
      background: white;
      border-left: 3px solid #2563eb;
      list-style: none;
    }
    .trend-up { 
      color: #dc2626; 
      font-weight: bold;
    }
    .trend-down { 
      color: #16a34a; 
      font-weight: bold;
    }
    .trend-stable { 
      color: #eab308; 
      font-weight: bold;
    }
    .summary-box {
      background: #eff6ff;
      padding: 15px;
      border-left: 5px solid #2563eb;
      margin: 20px 0;
      page-break-inside: avoid;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #cbd5e1;
      text-align: center;
      font-size: 9pt;
      color: #64748b;
      page-break-before: avoid;
    }
    .disclaimer {
      background: #fef3c7;
      border: 2px solid #f59e0b;
      padding: 15px;
      margin: 20px 0;
      font-size: 10pt;
      page-break-inside: avoid;
    }
    .data-table {
      font-size: 9pt;
    }
    .data-table th {
      background: #475569;
    }
  </style>
</head>
<body>
  
  <!-- Header -->
  <div class="header">
    <h1>Medical Trend Analysis Report</h1>
    <p><strong>MediNova Health Platform</strong></p>
    <p>Automated Health Monitoring & Risk Assessment</p>
  </div>

  <!-- Report Information -->
  <div class="report-info">
    <table>
      <tr>
        <td class="label">Report Date:</td>
        <td>${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
        <td class="label">Report Time:</td>
        <td>${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
      </tr>
      <tr>
        <td class="label">Analysis Period:</td>
        <td>Last 10 Days</td>
        <td class="label">Data Points:</td>
        <td>${analysisData.dataPoints} Vital Records</td>
      </tr>
      <tr>
        <td class="label">Report ID:</td>
        <td colspan="3">TRA-${Date.now()}</td>
      </tr>
    </table>
  </div>

  <!-- Executive Summary -->
  <div class="section">
    <div class="section-title">I. Executive Summary</div>
    <div class="summary-box">
      <p><strong>Analysis Overview:</strong> This report presents a comprehensive analysis of ${analysisData.dataPoints} vital sign measurements collected over the past 10 days. The assessment includes trend analysis, temporal pattern recognition, and predictive risk evaluation based on established medical guidelines.</p>
    </div>
  </div>

  <!-- Risk Assessment -->
  <div class="section">
    <div class="section-title">II. Risk Assessment & Disease Prediction</div>
    <div class="risk-box risk-${analysisData.riskSeverity}">
      <div class="risk-title">Clinical Assessment</div>
      <p><strong>Predicted Condition:</strong> ${analysisData.diseasePrediction}</p>
      <p><strong>Risk Classification:</strong> <span class="risk-severity severity-${analysisData.riskSeverity}">${analysisData.riskSeverity.toUpperCase()} RISK</span></p>
      ${analysisData.riskFactors.length > 0 ? `
      <div class="subsection-title">Identified Risk Factors:</div>
      <ul class="factor-list">
        ${analysisData.riskFactors.map(factor => `<li class="factor-item">${factor.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</li>`).join('')}
      </ul>
      ` : '<p><em>No significant risk factors identified.</em></p>'}
    </div>
  </div>

  <!-- Current Vital Signs -->
  <div class="section">
    <div class="section-title">III. Current Vital Signs Status</div>
    <p><strong>Last Recorded:</strong> ${new Date(analysisData.latestVitals.recordedAt).toLocaleString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}</p>
    <table>
      <thead>
        <tr>
          <th style="width: 40%;">Vital Parameter</th>
          <th style="width: 30%;">Measured Value</th>
          <th style="width: 30%;">Unit of Measure</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Blood Pressure (Systolic/Diastolic)</strong></td>
          <td>${analysisData.latestVitals.bloodPressure}</td>
          <td>mmHg</td>
        </tr>
        <tr>
          <td><strong>Heart Rate</strong></td>
          <td>${analysisData.latestVitals.heartRate}</td>
          <td>beats per minute (bpm)</td>
        </tr>
        <tr>
          <td><strong>Body Temperature</strong></td>
          <td>${analysisData.latestVitals.temperature}</td>
          <td>degrees Celsius (°C)</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Trend Analysis -->
  <div class="section">
    <div class="section-title">IV. Longitudinal Trend Analysis</div>
    <p>The following table presents the directional trends observed in vital parameters over the analysis period, calculated using linear regression analysis.</p>
    <table>
      <thead>
        <tr>
          <th style="width: 25%;">Parameter</th>
          <th style="width: 20%;">Trend Direction</th>
          <th style="width: 15%;">Slope Value</th>
          <th style="width: 40%;">Clinical Interpretation</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Blood Pressure</strong></td>
          <td class="${analysisData.trends.bpTrend > 0.1 ? 'trend-up' : analysisData.trends.bpTrend < -0.1 ? 'trend-down' : 'trend-stable'}">
            ${analysisData.trends.bpTrend > 0.1 ? '↑ INCREASING' : analysisData.trends.bpTrend < -0.1 ? '↓ DECREASING' : '→ STABLE'}
          </td>
          <td>${analysisData.trends.bpTrend.toFixed(4)}</td>
          <td>${analysisData.trends.interpretation.bp}</td>
        </tr>
        <tr>
          <td><strong>Heart Rate</strong></td>
          <td class="${analysisData.trends.hrTrend > 0.1 ? 'trend-up' : analysisData.trends.hrTrend < -0.1 ? 'trend-down' : 'trend-stable'}">
            ${analysisData.trends.hrTrend > 0.1 ? '↑ INCREASING' : analysisData.trends.hrTrend < -0.1 ? '↓ DECREASING' : '→ STABLE'}
          </td>
          <td>${analysisData.trends.hrTrend.toFixed(4)}</td>
          <td>${analysisData.trends.interpretation.hr}</td>
        </tr>
        <tr>
          <td><strong>Body Temperature</strong></td>
          <td class="${analysisData.trends.tempTrend > 0.1 ? 'trend-up' : analysisData.trends.tempTrend < -0.1 ? 'trend-down' : 'trend-stable'}">
            ${analysisData.trends.tempTrend > 0.1 ? '↑ INCREASING' : analysisData.trends.tempTrend < -0.1 ? '↓ DECREASING' : '→ STABLE'}
          </td>
          <td>${analysisData.trends.tempTrend.toFixed(4)}</td>
          <td>${analysisData.trends.interpretation.temp}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Peak Times Analysis -->
  <div class="section">
    <div class="section-title">V. Circadian Pattern Analysis</div>
    <p>Analysis of vital sign variations across different times of day (Morning: 05:00-12:00, Afternoon: 12:00-17:00, Night: 17:00-05:00).</p>
    <table>
      <thead>
        <tr>
          <th style="width: 22%;">Parameter</th>
          <th style="width: 22%;">Peak Time Period</th>
          <th style="width: 18%;">Morning Average</th>
          <th style="width: 19%;">Afternoon Average</th>
          <th style="width: 19%;">Night Average</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Blood Pressure</strong></td>
          <td><strong>${analysisData.peakTimes.bloodPressure.toUpperCase()}</strong></td>
          <td>${analysisData.peakTimes.details.bp.morning || 'No Data'}</td>
          <td>${analysisData.peakTimes.details.bp.afternoon || 'No Data'}</td>
          <td>${analysisData.peakTimes.details.bp.night || 'No Data'}</td>
        </tr>
        <tr>
          <td><strong>Heart Rate</strong></td>
          <td><strong>${analysisData.peakTimes.heartRate.toUpperCase()}</strong></td>
          <td>${analysisData.peakTimes.details.hr.morning || 'No Data'}</td>
          <td>${analysisData.peakTimes.details.hr.afternoon || 'No Data'}</td>
          <td>${analysisData.peakTimes.details.hr.night || 'No Data'}</td>
        </tr>
        <tr>
          <td><strong>Body Temperature</strong></td>
          <td><strong>${analysisData.peakTimes.temperature.toUpperCase()}</strong></td>
          <td>${analysisData.peakTimes.details.temp.morning || 'No Data'}</td>
          <td>${analysisData.peakTimes.details.temp.afternoon || 'No Data'}</td>
          <td>${analysisData.peakTimes.details.temp.night || 'No Data'}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Historical Data -->
  <div class="section">
    <div class="section-title">VI. Complete Vital Signs History</div>
    <p>Chronological record of all ${analysisData.vitalHistory.length} vital sign measurements included in this analysis.</p>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 8%;">Record #</th>
          <th style="width: 32%;">Date & Time</th>
          <th style="width: 20%;">Blood Pressure<br/>(mmHg)</th>
          <th style="width: 20%;">Heart Rate<br/>(bpm)</th>
          <th style="width: 20%;">Temperature<br/>(°C)</th>
        </tr>
      </thead>
      <tbody>
        ${analysisData.vitalHistory.map((record, idx) => `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td>${new Date(record.recordedAt).toLocaleString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</td>
          <td style="text-align: center;">${record.bpSystolic}</td>
          <td style="text-align: center;">${record.heartRate}</td>
          <td style="text-align: center;">${record.temperature}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <!-- Medical Disclaimer -->
  <div class="disclaimer">
    <strong>⚕ MEDICAL DISCLAIMER:</strong> This report is generated through automated analysis of recorded vital signs and is intended for informational purposes only. It should NOT be used as a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of a qualified healthcare provider with any questions regarding your medical condition. Never disregard professional medical advice or delay seeking it because of information in this report.
  </div>

  <!-- Footer -->
  <div class="footer">
    <p><strong>MediNova Health Platform</strong></p>
    <p>Automated Health Monitoring & Risk Assessment System</p>
    <p>Report Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
    <p>Document ID: TRA-${Date.now()} | Confidential Medical Record</p>
    <p>© ${new Date().getFullYear()} MediNova. All rights reserved.</p>
  </div>

</body>
</html>
    `;

    // Create blob and download
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Trend_Analysis_Report_${new Date().toISOString().split('T')[0]}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Download Started',
      description: 'Your trend analysis report has been downloaded',
    });
  };

  if (!analysisData) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Trend Analysis & Risk Prediction
          </CardTitle>
          <CardDescription>
            Minimum 5 records needed from last 10 days to analyze trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={analyzeTrend}
            disabled={isLoading}
            size="lg"
            className="w-full"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <BarChart3 className="w-4 h-4 mr-2" />
                Analyze Trend & Predict Risk
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 w-full">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Trend Analysis Results
              </CardTitle>
              <CardDescription>Based on {analysisData.dataPoints} vital records</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={downloadAsWord}
                variant="outline"
                size="sm"
                className="text-green-600 border-green-600 hover:bg-green-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Report
              </Button>
              <Button
                onClick={analyzeTrend}
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Risk Prediction Alert */}
      <Alert className={`border-2 ${getRiskColor(analysisData.riskSeverity)}`}>
        <div className="flex items-start gap-3">
          {getRiskIcon(analysisData.riskSeverity)}
          <div className="flex-1">
            <div className="font-semibold text-lg">{analysisData.diseasePrediction}</div>
            {analysisData.riskFactors.length > 0 && (
              <div className="mt-2 text-sm">
                <div className="font-medium mb-2">Detected Factors:</div>
                <div className="space-y-1">
                  {analysisData.riskFactors.map((factor, idx) => (
                    <div key={idx} className="text-sm">
                      • {formatRiskFactor(factor)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Alert>

      {/* ML Disease Prediction Card */}
      {analysisData.mlPrediction && (
        <Card className={`border-2 ${
          analysisData.mlPrediction.confidence >= 0.95 
            ? 'border-red-300 bg-red-50/50' 
            : analysisData.mlPrediction.confidence >= 0.85
            ? 'border-amber-300 bg-amber-50/50'
            : 'border-green-300 bg-green-50/50'
        }`}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className={`w-5 h-5 ${
                    analysisData.mlPrediction.confidence >= 0.95 
                      ? 'text-red-600' 
                      : analysisData.mlPrediction.confidence >= 0.85
                      ? 'text-amber-600'
                      : 'text-green-600'
                  }`} />
                  AI Health Prediction
                </CardTitle>
                <CardDescription>Machine Learning Model Analysis (95% Accuracy)</CardDescription>
              </div>
              <Badge className={
                analysisData.mlPrediction.confidence >= 0.95 
                  ? 'bg-red-600' 
                  : analysisData.mlPrediction.confidence >= 0.85
                  ? 'bg-amber-600'
                  : 'bg-green-600'
              }>
                {(analysisData.mlPrediction.confidence * 100).toFixed(1)}% confidence
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Predicted Condition</p>
              <p className="text-2xl font-bold text-foreground">{analysisData.mlPrediction.disease}</p>
            </div>

            {analysisData.mlPrediction.probabilities && (
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-3">Disease Probability Distribution</p>
                <div className="space-y-2">
                  {Object.entries(analysisData.mlPrediction.probabilities)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([disease, prob]) => (
                      <div key={disease} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{disease}</span>
                          <span className="text-muted-foreground">{(prob * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-full rounded-full ${
                              disease === analysisData.mlPrediction?.disease 
                                ? 'bg-blue-600' 
                                : 'bg-gray-400'
                            }`}
                            style={{ width: `${prob * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {analysisData.mlPrediction.recommendations && analysisData.mlPrediction.recommendations.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-2">AI Recommendations</p>
                <ul className="space-y-1">
                  {analysisData.mlPrediction.recommendations.slice(0, 3).map((rec, idx) => (
                    <li key={idx} className="text-sm text-foreground flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Trends Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Blood Pressure Trend */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Blood Pressure
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-2xl font-bold">{analysisData.latestVitals.bloodPressure}</div>
              <div className="text-xs text-gray-500">Latest reading</div>
            </div>
            <div className="border-t pt-3">
              <div className="flex items-center gap-2 mb-2">
                {getTrendIcon(analysisData.trends.bpTrend)}
                <div>
                  <div className="text-xs text-gray-600">Trend</div>
                  <div className="font-semibold">
                    {analysisData.trends.interpretation.bp}
                  </div>
                  <div className="text-xs text-gray-500">
                    Slope: {analysisData.trends.bpTrend > 0 ? '+' : ''}
                    {analysisData.trends.bpTrend.toFixed(3)}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 p-2 rounded text-xs">
              <div className="font-medium text-blue-900 mb-1">Peak Time:</div>
              <div className="text-blue-700 capitalize">
                {analysisData.peakTimes.bloodPressure}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Heart Rate Trend */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Heart Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-2xl font-bold">{analysisData.latestVitals.heartRate}</div>
              <div className="text-xs text-gray-500">bpm</div>
            </div>
            <div className="border-t pt-3">
              <div className="flex items-center gap-2 mb-2">
                {getTrendIcon(analysisData.trends.hrTrend)}
                <div>
                  <div className="text-xs text-gray-600">Trend</div>
                  <div className="font-semibold">
                    {analysisData.trends.interpretation.hr}
                  </div>
                  <div className="text-xs text-gray-500">
                    Slope: {analysisData.trends.hrTrend > 0 ? '+' : ''}
                    {analysisData.trends.hrTrend.toFixed(3)}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-pink-50 p-2 rounded text-xs">
              <div className="font-medium text-pink-900 mb-1">Peak Time:</div>
              <div className="text-pink-700 capitalize">
                {analysisData.peakTimes.heartRate}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Temperature Trend */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Thermometer className="w-4 h-4" />
              Temperature
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-2xl font-bold">{analysisData.latestVitals.temperature}°C</div>
              <div className="text-xs text-gray-500">Latest reading</div>
            </div>
            <div className="border-t pt-3">
              <div className="flex items-center gap-2 mb-2">
                {getTrendIcon(analysisData.trends.tempTrend)}
                <div>
                  <div className="text-xs text-gray-600">Trend</div>
                  <div className="font-semibold">
                    {analysisData.trends.interpretation.temp}
                  </div>
                  <div className="text-xs text-gray-500">
                    Slope: {analysisData.trends.tempTrend > 0 ? '+' : ''}
                    {analysisData.trends.tempTrend.toFixed(4)}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-orange-50 p-2 rounded text-xs">
              <div className="font-medium text-orange-900 mb-1">Peak Time:</div>
              <div className="text-orange-700 capitalize">
                {analysisData.peakTimes.temperature}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Peak Times Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Peak Times Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="font-medium text-sm">Blood Pressure</div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Morning:</span>
                  <span className="font-medium">{analysisData.peakTimes.details.bp.morning}</span>
                </div>
                <div className="flex justify-between">
                  <span>Afternoon:</span>
                  <span className="font-medium">{analysisData.peakTimes.details.bp.afternoon}</span>
                </div>
                <div className="flex justify-between">
                  <span>Night:</span>
                  <span className="font-medium">{analysisData.peakTimes.details.bp.night}</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="font-medium text-sm">Heart Rate</div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Morning:</span>
                  <span className="font-medium">{analysisData.peakTimes.details.hr.morning}</span>
                </div>
                <div className="flex justify-between">
                  <span>Afternoon:</span>
                  <span className="font-medium">{analysisData.peakTimes.details.hr.afternoon}</span>
                </div>
                <div className="flex justify-between">
                  <span>Night:</span>
                  <span className="font-medium">{analysisData.peakTimes.details.hr.night}</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="font-medium text-sm">Temperature</div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Morning:</span>
                  <span className="font-medium">{analysisData.peakTimes.details.temp.morning}</span>
                </div>
                <div className="flex justify-between">
                  <span>Afternoon:</span>
                  <span className="font-medium">{analysisData.peakTimes.details.temp.afternoon}</span>
                </div>
                <div className="flex justify-between">
                  <span>Night:</span>
                  <span className="font-medium">{analysisData.peakTimes.details.temp.night}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vital History Chart Toggle */}
      <div className="flex justify-center">
        <Button
          onClick={() => setShowChart(!showChart)}
          variant="outline"
          size="sm"
        >
          {showChart ? 'Hide' : 'Show'} Vital History Chart
        </Button>
      </div>

      {/* Combined Vital History Line Chart */}
      {showChart && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Vital History Trends (Last {analysisData.vitalHistory.length} readings)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto">
              <svg width="100%" height="300" viewBox="0 0 800 300" className="min-w-full">
                {/* Background Grid */}
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f0f0f0" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="800" height="300" fill="url(#grid)" />

                {/* Y-axis labels and lines */}
                <text x="10" y="20" fontSize="10" fill="#666">180</text>
                <line x1="40" y1="20" x2="750" y2="20" stroke="#e0e0e0" strokeWidth="1" strokeDasharray="2" />

                <text x="10" y="100" fontSize="10" fill="#666">120</text>
                <line x1="40" y1="100" x2="750" y2="100" stroke="#e0e0e0" strokeWidth="1" strokeDasharray="2" />

                <text x="10" y="180" fontSize="10" fill="#666">60</text>
                <line x1="40" y1="180" x2="750" y2="180" stroke="#e0e0e0" strokeWidth="1" strokeDasharray="2" />

                {/* Axes */}
                <line x1="40" y1="20" x2="40" y2="260" stroke="#333" strokeWidth="2" />
                <line x1="40" y1="260" x2="750" y2="260" stroke="#333" strokeWidth="2" />

                {/* Blood Pressure Line (Blue) */}
                <polyline
                  points={analysisData.vitalHistory
                    .map((reading, idx) => {
                      const x = 40 + (idx / (analysisData.vitalHistory.length - 1 || 1)) * 710;
                      const y = 260 - (reading.bpSystolic / 180) * 240;
                      return `${x},${y}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  opacity="0.8"
                />

                {/* Heart Rate Line (Pink) */}
                <polyline
                  points={analysisData.vitalHistory
                    .map((reading, idx) => {
                      const x = 40 + (idx / (analysisData.vitalHistory.length - 1 || 1)) * 710;
                      const y = 260 - (reading.heartRate / 120) * 240;
                      return `${x},${y}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#ec4899"
                  strokeWidth="2.5"
                  opacity="0.8"
                />

                {/* Temperature Line (Orange) - scaled to 35-38°C range */}
                <polyline
                  points={analysisData.vitalHistory
                    .map((reading, idx) => {
                      const x = 40 + (idx / (analysisData.vitalHistory.length - 1 || 1)) * 710;
                      const y = 260 - ((reading.temperature - 35) / 3) * 240;
                      return `${x},${y}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="2.5"
                  opacity="0.8"
                />

                {/* Data points for BP */}
                {analysisData.vitalHistory.map((reading, idx) => {
                  const x = 40 + (idx / (analysisData.vitalHistory.length - 1 || 1)) * 710;
                  const y = 260 - (reading.bpSystolic / 180) * 240;
                  return (
                    <circle
                      key={`bp-${idx}`}
                      cx={x}
                      cy={y}
                      r="3"
                      fill="#3b82f6"
                      opacity="0.8"
                    />
                  );
                })}

                {/* Data points for HR */}
                {analysisData.vitalHistory.map((reading, idx) => {
                  const x = 40 + (idx / (analysisData.vitalHistory.length - 1 || 1)) * 710;
                  const y = 260 - (reading.heartRate / 120) * 240;
                  return (
                    <circle
                      key={`hr-${idx}`}
                      cx={x}
                      cy={y}
                      r="3"
                      fill="#ec4899"
                      opacity="0.8"
                    />
                  );
                })}

                {/* Data points for Temp */}
                {analysisData.vitalHistory.map((reading, idx) => {
                  const x = 40 + (idx / (analysisData.vitalHistory.length - 1 || 1)) * 710;
                  const y = 260 - ((reading.temperature - 35) / 3) * 240;
                  return (
                    <circle
                      key={`temp-${idx}`}
                      cx={x}
                      cy={y}
                      r="3"
                      fill="#f97316"
                      opacity="0.8"
                    />
                  );
                })}
              </svg>
            </div>

            {/* Legend */}
            <div className="flex gap-6 mt-6 justify-center text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-blue-500"></div>
                <span>Blood Pressure (mmHg)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-pink-500"></div>
                <span>Heart Rate (bpm)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-orange-500"></div>
                <span>Temperature (°C)</span>
              </div>
            </div>

            <div className="text-xs text-gray-500 mt-4 text-center">
              Lines show trend progression from left (oldest) to right (newest)
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {analysisData.riskSeverity !== 'low' && (
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="w-4 h-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <div className="font-medium mb-2">Recommendations</div>
            <ul className="text-sm space-y-1 ml-2">
              {analysisData.riskSeverity === 'high' && (
                <>
                  <li>• Consider consulting a healthcare professional urgently</li>
                  <li>• Monitor your vitals more frequently</li>
                  <li>• Keep track of any symptoms or changes in how you feel</li>
                </>
              )}
              {analysisData.riskSeverity === 'moderate' && (
                <>
                  <li>• Schedule a check-up with your doctor</li>
                  <li>• Continue regular vital monitoring</li>
                  <li>• Note any patterns or changes</li>
                </>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
