import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Activity,
  AlertTriangle,
  Brain,
  Clock,
  Mic,
  ShieldCheck,
  Sparkles,
  Thermometer,
  Waves,
} from "lucide-react";

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

interface WeatherSnapshot {
  temperature?: number;
  humidity?: number;
  source?: string;
  label?: string;
}

interface HealthInsightsProps {
  vitals: VitalRecord[];
  patientDetails?: PatientDetailsShape | null;
}

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

const slope = (values: number[]) => {
  if (values.length < 2) return 0;
  const n = values.length;
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    const x = i - xMean;
    num += x * (values[i] - yMean);
    den += x * x;
  }
  return den === 0 ? 0 : num / den;
};

const stdDev = (values: number[]) => {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
};

const statusLabel = (score: number) => {
  if (score >= 70) return { label: "High", tone: "high" as const };
  if (score >= 40) return { label: "Moderate", tone: "moderate" as const };
  return { label: "Low", tone: "low" as const };
};

export function HealthInsights({ vitals, patientDetails }: HealthInsightsProps) {
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [voiceBusy, setVoiceBusy] = useState(false);
  const recent = useMemo(() => vitals.slice(0, 10), [vitals]);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (recent.length === 0 || typeof navigator === "undefined") return;

    const fetchWeather = (lat: number, lon: number) => {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m`;
      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          if (cancelled) return;
          const current = data?.current;
          setWeather({
            temperature: current?.temperature_2m,
            humidity: current?.relative_humidity_2m,
            source: "Open-Meteo",
            label: "Live weather",
          });
        })
        .catch(() => {
          if (!cancelled) {
            setWeather({ label: "Weather unavailable" });
          }
        });
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
      () => setWeather({ label: "Location blocked" }),
      { timeout: 4000 }
    );

    return () => {
      cancelled = true;
    };
  }, [recent.length]);

  const parsed = useMemo(() => {
    const systolic = recent.map((r) => parseInt(r.bloodPressure.split("/")[0] || "0", 10));
    const diastolic = recent.map((r) => parseInt(r.bloodPressure.split("/")[1] || "0", 10));
    const heartRate = recent.map((r) => parseInt(r.heartRate || "0", 10));
    const temperature = recent.map((r) => parseFloat(r.temperature || "0"));
    return { systolic, diastolic, heartRate, temperature };
  }, [recent]);

  const averages = useMemo(() => {
    const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
    return {
      systolic: avg(parsed.systolic),
      diastolic: avg(parsed.diastolic),
      heartRate: avg(parsed.heartRate),
      temperature: avg(parsed.temperature),
    };
  }, [parsed]);

  const trend = useMemo(() => ({
    bp: slope(parsed.systolic),
    hr: slope(parsed.heartRate),
    temp: slope(parsed.temperature),
  }), [parsed]);

  const stress = useMemo(() => {
    const variability = stdDev(parsed.heartRate);
    if (variability > 12) return { level: "High", hint: "Consider a guided breathing break", variability };
    if (variability > 8) return { level: "Medium", hint: "Wind-down routine recommended", variability };
    return { level: "Low", hint: "Keep steady routines", variability };
  }, [parsed.heartRate]);

  const riskScores = useMemo(() => {
    const ageBump = patientDetails?.age && patientDetails.age > 55 ? 8 : 0;
    const chronicBump = (patientDetails?.chronic_conditions?.length || 0) * 3;
    const hrScore = clamp(((averages.heartRate - 70) / 50) * 50 + trend.hr * 40 + ageBump + chronicBump);
    const bpScore = clamp(((averages.systolic - 120) / 70) * 60 + trend.bp * 40 + ageBump + chronicBump);
    const tempScore = clamp(((averages.temperature - 37) / 2) * 70 + trend.temp * 120);
    const dehydrationBoost = weather?.temperature && weather.temperature > 32 ? 10 : 0;
    const humidityBoost = weather?.humidity && weather.humidity > 70 ? 8 : 0;
    const dehydrationScore = clamp(((averages.temperature - 36.8) * 50) + ((averages.heartRate - 65) * 0.8) + dehydrationBoost + humidityBoost);
    const stressScore = clamp(stress.level === "High" ? 75 : stress.level === "Medium" ? 45 : 20);

    const cardiac = clamp((bpScore * 0.55 + hrScore * 0.35 + ageBump + chronicBump));
    const fever = clamp(tempScore);
    const dehydration = dehydrationScore;
    const overall = clamp((cardiac * 0.35 + fever * 0.25 + dehydration * 0.2 + stressScore * 0.2));

    return {
      overall,
      cardiac,
      fever,
      dehydration,
      stress: stressScore,
    };
  }, [averages, trend, weather?.temperature, weather?.humidity, patientDetails, stress]);

  const anomalies = useMemo(() => {
    if (!recent.length) return [] as string[];
    const latest = recent[0];
    const list: string[] = [];
    const systolic = parseInt(latest.bloodPressure.split("/")[0] || "0", 10);
    const temp = parseFloat(latest.temperature);
    const hr = parseInt(latest.heartRate || "0", 10);

    if (systolic > averages.systolic + 20) list.push("Unusual blood pressure spike vs your baseline");
    if (hr > averages.heartRate + 15) list.push("Heart rate jump above your normal range");
    if (temp >= 38 || temp > averages.temperature + 0.6) list.push("Temperature rising faster than usual");
    if (trend.hr > 1.5) list.push("Sustained upward heart-rate slope detected");
    if (trend.bp > 1.5) list.push("Blood pressure increasing across readings");
    return list;
  }, [recent, averages, trend]);

  const warnings = useMemo(() => {
    const list: { title: string; detail: string; severity: "high" | "moderate" }[] = [];
    if (trend.temp > 0.08 && averages.temperature > 37.4) {
      list.push({
        title: "Fever risk in ~24-48h",
        detail: `Temperature trending up (${trend.temp.toFixed(2)} slope) with warm baseline ${averages.temperature.toFixed(1)}°C`,
        severity: "high",
      });
    }
    if (trend.hr > 1.2 || averages.heartRate > 95) {
      list.push({
        title: "Cardiac strain trend",
        detail: `Heart rate ${averages.heartRate.toFixed(0)} bpm and climbing`,
        severity: "moderate",
      });
    }
    if ((weather?.temperature || 0) > 32 && riskScores.dehydration > 55) {
      list.push({
        title: "Heat + hydration risk",
        detail: `Hot weather ${weather?.temperature?.toFixed(0)}°C with elevated vitals`,
        severity: "moderate",
      });
    }
    return list;
  }, [trend, averages, weather?.temperature, riskScores.dehydration]);

  const suggestions = useMemo(() => {
    const ideas: string[] = [];
    if (riskScores.dehydration > 50) ideas.push("Increase water intake; add electrolytes if active");
    if ((weather?.temperature || 0) > 32) ideas.push("Limit outdoor activity 12-4 PM during peak heat");
    if (stress.level !== "Low") ideas.push("Schedule a 5-minute guided breathing session");
    if (riskScores.fever > 50) ideas.push("Plan lighter meals and monitor temperature tonight");
    if (riskScores.cardiac > 60) ideas.push("Avoid heavy exertion; pick a calm walk instead");
    if (!ideas.length) ideas.push("Keep current routine; stay hydrated and rested");
    return ideas.slice(0, 4);
  }, [riskScores, weather?.temperature, stress.level]);

  const explainers = useMemo(() => {
    const reasons: string[] = [];
    reasons.push(`Heart rate trend ${trend.hr >= 0 ? "+" : ""}${trend.hr.toFixed(2)} with avg ${averages.heartRate.toFixed(0)} bpm`);
    reasons.push(`Temperature avg ${averages.temperature.toFixed(1)}°C with slope ${trend.temp.toFixed(2)}`);
    reasons.push(`BP avg ${averages.systolic.toFixed(0)}/${averages.diastolic.toFixed(0)} mmHg`);
    if (weather?.temperature) reasons.push(`Weather ${weather.temperature.toFixed(0)}°C ${weather.humidity ? `and ${weather.humidity}% humidity` : ""}`);
    if (patientDetails?.age) reasons.push(`Age factor considered (${patientDetails.age} yrs)`);
    if (anomalies.length) reasons.push(`Detected ${anomalies.length} anomaly marker(s)`);
    return reasons;
  }, [averages, trend, weather?.temperature, weather?.humidity, patientDetails?.age, anomalies.length]);

  const timeline = useMemo(() => {
    const groups: Record<string, { hr: number[]; temp: number[]; bp: number[] }> = {};
    recent.forEach((r) => {
      const key = new Date(r.recordedAt).toISOString().split("T")[0];
      if (!groups[key]) groups[key] = { hr: [], temp: [], bp: [] };
      groups[key].hr.push(parseInt(r.heartRate || "0", 10));
      groups[key].temp.push(parseFloat(r.temperature || "0"));
      groups[key].bp.push(parseInt(r.bloodPressure.split("/")[0] || "0", 10));
    });
    return Object.entries(groups)
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .slice(0, 5)
      .map(([date, values]) => ({
        date,
        hr: Math.round(values.hr.reduce((a, b) => a + b, 0) / values.hr.length),
        temp: (values.temp.reduce((a, b) => a + b, 0) / values.temp.length).toFixed(1),
        bp: Math.round(values.bp.reduce((a, b) => a + b, 0) / values.bp.length),
      }));
  }, [recent]);

  const speakSummary = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const engine = window.speechSynthesis;
    if (engine.speaking) engine.cancel();
    const summary = `Overall health risk ${riskScores.overall.toFixed(0)} out of 100, status ${statusLabel(riskScores.overall).label}. Cardiac ${riskScores.cardiac.toFixed(0)}, temperature ${riskScores.fever.toFixed(0)}, hydration ${riskScores.dehydration.toFixed(0)}, stress ${stress.level}.`;
    const utterance = new SpeechSynthesisUtterance(summary);
    speechRef.current = utterance;
    setVoiceBusy(true);
    utterance.onend = () => setVoiceBusy(false);
    engine.speak(utterance);
  };

  const stopVoice = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setVoiceBusy(false);
  };

  const guidance = useMemo(() => {
    const steps = [] as string[];
    if (riskScores.overall >= 70 || anomalies.length) steps.push("Pause activity, sit or lie down safely");
    if (riskScores.dehydration > 55) steps.push("Sip water slowly; add electrolytes if available");
    if (riskScores.fever > 60) steps.push("Cool down with shade or a fan; monitor temperature every 30 minutes");
    if (riskScores.cardiac > 70) steps.push("Avoid exertion; focus on calm, steady breathing");
    steps.push("Seek medical help if symptoms persist or worsen");
    return steps;
  }, [riskScores, anomalies.length]);

  const renderScoreBar = (label: string, score: number) => {
    const status = statusLabel(score);
    const colors = status.tone === "high" ? "bg-red-500" : status.tone === "moderate" ? "bg-yellow-500" : "bg-green-500";
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm font-medium">
          <span>{label}</span>
          <span className="text-muted-foreground">{score.toFixed(0)} / 100</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted">
          <div className={`h-2 rounded-full ${colors}`} style={{ width: `${Math.min(score, 100)}%` }}></div>
        </div>
        <Badge variant="outline" className={status.tone === "high" ? "border-red-500 text-red-600" : status.tone === "moderate" ? "border-yellow-500 text-yellow-700" : "border-green-600 text-green-700"}>
          {status.label} Risk
        </Badge>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Card className="border-0 medical-card">
        <CardHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                Health Risk Index
              </CardTitle>
              <CardDescription>Computed locally from your last 10 readings</CardDescription>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="w-4 h-4" />
              Privacy-first: calculations stay on your device
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              {renderScoreBar("Overall Risk", riskScores.overall)}
              {renderScoreBar("Cardiac Risk", riskScores.cardiac)}
              {renderScoreBar("Fever / Infection", riskScores.fever)}
            </div>
            <div className="space-y-3">
              {renderScoreBar("Dehydration Risk", riskScores.dehydration)}
              {renderScoreBar("Stress Load", riskScores.stress)}
              <div className="rounded-xl border bg-muted/40 p-3 text-sm">
                <div className="font-medium mb-1">Weather assist</div>
                {weather?.temperature ? (
                  <div className="space-y-1">
                    <div>Temp: {weather.temperature.toFixed(1)}°C {weather.humidity ? `· Humidity ${weather.humidity}%` : ""}</div>
                    <div className="text-muted-foreground">Source: {weather.source || "local"}</div>
                  </div>
                ) : (
                  <div className="text-muted-foreground">{weather?.label || "Awaiting weather"}</div>
                )}
              </div>
            </div>
          </div>

          {warnings.length > 0 && (
            <Alert className="border-2">
              <AlertTriangle className="w-4 h-4" />
              <AlertTitle>Predictive alerts</AlertTitle>
              <AlertDescription>
                <div className="space-y-2 mt-2 text-sm">
                  {warnings.map((w, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-muted/60">
                      <div className="font-semibold flex items-center gap-2">
                        <Badge variant="outline" className={w.severity === "high" ? "border-red-500 text-red-600" : "border-yellow-500 text-yellow-700"}>
                          {w.severity === "high" ? "High" : "Moderate"}
                        </Badge>
                        {w.title}
                      </div>
                      <div className="text-muted-foreground">{w.detail}</div>
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-0 medical-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Anomaly Detection
            </CardTitle>
            <CardDescription>Spikes vs your own baseline</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {anomalies.length ? (
              anomalies.map((item, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-900">
                  • {item}
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">No abnormal patterns detected.</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 medical-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Explainable AI
            </CardTitle>
            <CardDescription>Why you see this prediction</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {explainers.map((reason, idx) => (
              <div key={idx} className="text-sm text-foreground">
                • {reason}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-0 medical-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="w-5 h-5" />
              Preventive Coach
            </CardTitle>
            <CardDescription>Lifestyle nudges (not medical advice)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {suggestions.map((s, idx) => (
              <div key={idx} className="text-sm">• {s}</div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-0 medical-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Waves className="w-5 h-5" />
              Stress Indicator
            </CardTitle>
            <CardDescription>Based on heart-rate variability</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={stress.level === "High" ? "border-red-500 text-red-600" : stress.level === "Medium" ? "border-yellow-500 text-yellow-700" : "border-green-600 text-green-700"}>
                {stress.level} stress
              </Badge>
              <span className="text-muted-foreground">Variability {stress.variability.toFixed(1)}</span>
            </div>
            <div>{stress.hint}</div>
            <div className="text-xs text-muted-foreground">Mental health support: try box breathing for 60 seconds.</div>
          </CardContent>
        </Card>

        <Card className="border-0 medical-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              Emergency Self-Guidance
            </CardTitle>
            <CardDescription>For extreme readings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {guidance.map((step, idx) => (
              <div key={idx}>• {step}</div>
            ))}
            <div className="text-xs text-muted-foreground pt-2">Disclaimer: Informational only; not a medical diagnosis.</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-0 medical-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Digital Health Passport
            </CardTitle>
            <CardDescription>Daily snapshots from your last readings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {timeline.length ? (
              timeline.map((day) => (
                <div key={day.date} className="flex items-center justify-between rounded-lg border p-3 bg-muted/40">
                  <div className="font-semibold">{day.date}</div>
                  <div className="flex gap-4 text-muted-foreground">
                    <span>HR {day.hr} bpm</span>
                    <span>Temp {day.temp}°C</span>
                    <span>BP {day.bp} systolic</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-muted-foreground">Add more readings to build your passport.</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 medical-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="w-5 h-5" />
              Voice Assistant
            </CardTitle>
            <CardDescription>Ask "How is my health today?"</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Button onClick={voiceBusy ? stopVoice : speakSummary} className="w-full" variant="outline">
              {voiceBusy ? "Stop" : "Speak summary"}
            </Button>
            <div className="text-xs text-muted-foreground">Audio runs locally. No recordings are sent to servers.</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
