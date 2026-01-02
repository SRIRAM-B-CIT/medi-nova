import { BreathingExercise } from '@/components/BreathingExercise';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Wind, Sparkles, Sun } from 'lucide-react';

export default function CalmCorner() {
  const calmingTips = [
    {
      icon: Wind,
      title: "Box Breathing",
      description: "Breathe in for 4, hold for 4, breathe out for 4, hold for 4. Repeat.",
      color: "bg-calming"
    },
    {
      icon: Sparkles,
      title: "5-4-3-2-1 Grounding",
      description: "Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste.",
      color: "bg-secondary"
    },
    {
      icon: Heart,
      title: "Progressive Relaxation",
      description: "Tense and release each muscle group, starting from your toes to your head.",
      color: "bg-primary-soft"
    },
    {
      icon: Sun,
      title: "Positive Affirmations",
      description: "Repeat: 'I am safe', 'This feeling will pass', 'I can handle this'.",
      color: "bg-accent"
    }
  ];

  const emergencyContacts = [
    { name: "Crisis Text Line", number: "Text HOME to 741741", description: "24/7 crisis support" },
    { name: "National Suicide Prevention", number: "988", description: "24/7 suicide prevention" },
    { name: "SAMHSA Helpline", number: "1-800-662-4357", description: "Mental health & substance abuse" }
  ];

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto pb-20">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-primary mb-2">Calm Corner</h1>
        <p className="text-muted-foreground">Find peace and manage anxiety with these tools</p>
      </div>

      {/* Breathing Exercise */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Wind className="h-5 w-5 text-primary" />
          Guided Breathing
        </h2>
        <BreathingExercise />
      </section>

      {/* Calming Techniques */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Calming Techniques
        </h2>
        <div className="grid gap-4">
          {calmingTips.map((tip) => (
            <Card key={tip.title} className="border-l-4 border-l-primary">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${tip.color}`}>
                    <tip.icon className="h-4 w-4 text-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{tip.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{tip.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Quick Help */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" />
          Need Immediate Support?
        </h2>
        <div className="space-y-3">
          {emergencyContacts.map((contact) => (
            <Card key={contact.name} className="bg-emergency-soft">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-sm">{contact.name}</h3>
                    <p className="text-xs text-muted-foreground">{contact.description}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(`tel:${contact.number}`, '_self')}
                    className="bg-emergency text-emergency-foreground hover:bg-emergency/90"
                  >
                    {contact.number}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Reminder */}
      <Card className="bg-calming/20 border-calming">
        <CardContent className="p-4 text-center">
          <p className="text-sm text-calming-foreground">
            Remember: You are stronger than you think. This feeling will pass. 
            You've overcome challenges before, and you can overcome this too. 💙
          </p>
        </CardContent>
      </Card>
    </div>
  );
}