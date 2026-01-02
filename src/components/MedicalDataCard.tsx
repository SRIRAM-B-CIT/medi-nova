import { Activity, Users, Clock, TrendingUp, Heart, Shield } from 'lucide-react';

interface MedicalStat {
  label: string;
  value: string;
  icon: React.ElementType;
  trend?: string;
  color: string;
}

const medicalStats: MedicalStat[] = [
  {
    label: "Patients Helped Today",
    value: "1,247",
    icon: Users,
    trend: "+12%",
    color: "text-blue-600"
  },
  {
    label: "Average Response Time",
    value: "< 2 min",
    icon: Clock,
    trend: "-15%",
    color: "text-green-600"
  },
  {
    label: "Health Screenings",
    value: "456",
    icon: Activity,
    trend: "+8%",
    color: "text-purple-600"
  },
  {
    label: "Emergency Assists",
    value: "23",
    icon: Heart,
    trend: "+3",
    color: "text-red-600"
  },
  {
    label: "Success Rate",
    value: "98.7%",
    icon: TrendingUp,
    trend: "+0.3%",
    color: "text-emerald-600"
  },
  {
    label: "Safety Checks",
    value: "2,891",
    icon: Shield,
    trend: "+25%",
    color: "text-indigo-600"
  }
];

export function MedicalDataCard() {
  return (
    <div className="data-card p-6 w-full">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-foreground mb-2">Medical Dashboard</h3>
        <p className="text-sm text-muted-foreground">Real-time health assistance metrics</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {medicalStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="medical-card p-4 text-center medical-float" style={{ animationDelay: `${index * 0.2}s` }}>
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-sm mb-3 ${stat.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="text-lg font-bold text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground mb-1">{stat.label}</div>
              {stat.trend && (
                <div className={`text-xs font-medium ${stat.trend.startsWith('+') ? 'text-green-600' : stat.trend.startsWith('-') ? 'text-red-600' : 'text-blue-600'}`}>
                  {stat.trend}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="mt-6 text-center">
        <div className="inline-flex items-center justify-center w-6 h-6 bg-green-500 rounded-full mb-2 heartbeat">
          <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>
        <p className="text-xs text-muted-foreground">System Status: All Services Online</p>
      </div>
    </div>
  );
}