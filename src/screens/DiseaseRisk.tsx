import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CloudRain,
  Droplets,
  Loader2,
  LocateFixed,
  RefreshCw,
  ShieldCheck,
  Sun,
  ThermometerSun,
  Wind,
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type RiskLevel = 'Low' | 'Moderate' | 'High';

interface WeatherSnapshot {
  temperatureC: number;
  apparentTemperatureC: number;
  humidityPercent: number;
  precipitationMm: number;
  windSpeedKmh: number;
  uvIndex: number;
  weatherDescription: string;
  observedAt: string;
  timezone: string;
}

interface WeatherRiskAnalysis {
  overview: string;
  overallRisk: RiskLevel;
  concerns: Array<{
    name: string;
    riskLevel: RiskLevel;
    reason: string;
    preventionActions: string[];
  }>;
  model: string;
}

const weatherDescriptions: Record<number, string> = {
  0: 'Clear sky', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Freezing fog', 51: 'Light drizzle', 53: 'Drizzle',
  55: 'Heavy drizzle', 61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
  71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 80: 'Rain showers',
  81: 'Rain showers', 82: 'Heavy showers', 95: 'Thunderstorm',
  96: 'Thunderstorm with hail', 99: 'Severe thunderstorm with hail',
};

const badgeClass = (level: RiskLevel) => {
  if (level === 'High') return 'border-red-500 bg-red-50 text-red-700';
  if (level === 'Moderate') return 'border-amber-500 bg-amber-50 text-amber-700';
  return 'border-green-600 bg-green-50 text-green-700';
};

export default function DiseaseRisk() {
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [analysis, setAnalysis] = useState<WeatherRiskAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadRisk = () => {
    if (!('geolocation' in navigator)) {
      setError('Location is not supported by this browser.');
      return;
    }

    setLoading(true);
    setError('');
    setAnalysis(null);
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const params = new URLSearchParams({
          latitude: String(coords.latitude),
          longitude: String(coords.longitude),
          current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,uv_index',
          timezone: 'auto',
        });
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
        if (!response.ok) throw new Error('Weather service did not respond.');
        const data = await response.json();
        const current = data?.current;
        if (!current) throw new Error('Current weather is unavailable.');

        const snapshot: WeatherSnapshot = {
          temperatureC: Number(current.temperature_2m),
          apparentTemperatureC: Number(current.apparent_temperature),
          humidityPercent: Number(current.relative_humidity_2m),
          precipitationMm: Number(current.precipitation),
          windSpeedKmh: Number(current.wind_speed_10m),
          uvIndex: Number(current.uv_index || 0),
          weatherDescription: weatherDescriptions[current.weather_code] || 'Current conditions',
          observedAt: current.time,
          timezone: data.timezone || 'Local time',
        };
        setWeather(snapshot);

        // Coordinates remain in the browser; only weather measurements reach the AI endpoint.
        const result = await apiClient.analyzeWeatherDiseaseRisk(snapshot as unknown as Record<string, unknown>);
        setAnalysis(result);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Could not analyze local weather.');
      } finally {
        setLoading(false);
      }
    }, (locationError) => {
      setLoading(false);
      setError(locationError.code === locationError.PERMISSION_DENIED
        ? 'Location permission is required to analyze weather in your area.'
        : 'Your location could not be determined. Please try again.');
    }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
  };

  useEffect(() => {
    document.title = 'Weather Health Risks | MediNova';
    loadRisk();
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <ThermometerSun className="h-7 w-7 text-primary" /> Weather Health Risks
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            AI-assisted information about health concerns associated with current weather in your area.
          </p>
        </div>
        <Button onClick={loadRisk} variant="outline" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : weather ? <RefreshCw className="mr-2 h-4 w-4" /> : <LocateFixed className="mr-2 h-4 w-4" />}
          {weather ? 'Refresh analysis' : 'Use my location'}
        </Button>
      </div>

      <Alert>
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle>Environmental guidance, not a diagnosis</AlertTitle>
        <AlertDescription>
          Weather can affect exposure and symptoms, but it cannot confirm that you have or will develop a disease. Seek professional care for concerning symptoms.
        </AlertDescription>
      </Alert>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Analysis unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && !weather && (
        <Card className="border-dashed">
          <CardContent className="flex min-h-48 flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p>Reading local weather and preparing health information…</p>
          </CardContent>
        </Card>
      )}

      {weather && (
        <Card className="medical-card border-0">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>Current conditions</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">{weather.weatherDescription} · {weather.timezone}</p>
            </div>
            {analysis && <Badge variant="outline" className={badgeClass(analysis.overallRisk)}>{analysis.overallRisk} overall risk</Badge>}
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <WeatherMetric icon={ThermometerSun} label="Temperature" value={`${weather.temperatureC.toFixed(1)}°C`} />
            <WeatherMetric icon={Droplets} label="Humidity" value={`${weather.humidityPercent.toFixed(0)}%`} />
            <WeatherMetric icon={CloudRain} label="Rain" value={`${weather.precipitationMm.toFixed(1)} mm`} />
            <WeatherMetric icon={Wind} label="Wind" value={`${weather.windSpeedKmh.toFixed(0)} km/h`} />
            <WeatherMetric icon={Sun} label="UV index" value={weather.uvIndex.toFixed(1)} />
          </CardContent>
        </Card>
      )}

      {loading && weather && (
        <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Analyzing weather-related concerns…
        </div>
      )}

      {analysis && !loading && (
        <>
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-5">
              <p className="text-sm leading-6 text-foreground">{analysis.overview}</p>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {analysis.concerns.map((concern, index) => (
              <Card key={`${concern.name}-${index}`} className="medical-card border-0">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-lg">{concern.name}</CardTitle>
                    <Badge variant="outline" className={badgeClass(concern.riskLevel)}>{concern.riskLevel}</Badge>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">{concern.reason}</p>
                </CardHeader>
                <CardContent>
                  <h3 className="mb-2 text-sm font-semibold">Prevention actions</h3>
                  <ul className="space-y-2 text-sm">
                    {concern.preventionActions.map((action, actionIndex) => (
                      <li key={actionIndex} className="flex gap-2">
                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Weather data from Open-Meteo. Analysis by {analysis.model}. Your precise coordinates are not sent to the AI.
          </p>
        </>
      )}
    </div>
  );
}

function WeatherMetric({ icon: Icon, label, value }: {
  icon: typeof Sun;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border bg-muted/30 p-3">
      <Icon className="mb-2 h-4 w-4 text-primary" />
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-semibold text-foreground">{value}</div>
    </div>
  );
}
