import { useState, useEffect, useRef } from 'react';
import { Leaf, Waves, Mountain, Sun, Play, Pause, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const calmingElements = [
  {
    title: "Nature Therapy",
    description: "Breathe in the fresh air of virtual forests",
    icon: Leaf,
    image: "https://images.unsplash.com/photo-1518005020951-eccb494ad742?w=300&h=200&fit=crop&auto=format",
    color: "from-green-400 to-green-600",
    audioUrl: "https://www.soundjay.com/misc/sounds/wind.wav",
    quotes: [
      "In every walk with nature, one receives far more than they seek.",
      "Nature does not hurry, yet everything is accomplished.",
      "The forest is a peaceful place where the mind can rest."
    ]
  },
  {
    title: "Ocean Sounds", 
    description: "Let the waves wash your stress away",
    icon: Waves,
    image: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=300&h=200&fit=crop&auto=format",
    color: "from-blue-400 to-blue-600",
    audioUrl: "https://www.soundjay.com/misc/sounds/wave.wav",
    quotes: [
      "The ocean stirs the heart, inspires the imagination and brings eternal joy.",
      "Let the waves of the universe rock you to peace.",
      "The sea, once it casts its spell, holds one in its net of wonder forever."
    ]
  },
  {
    title: "Mountain Peace",
    description: "Find serenity in majestic landscapes", 
    icon: Mountain,
    image: "https://images.unsplash.com/photo-1472396961693-142e6e269027?w=300&h=200&fit=crop&auto=format",
    color: "from-purple-400 to-purple-600",
    audioUrl: "https://www.soundjay.com/misc/sounds/wind.wav",
    quotes: [
      "Mountains are the beginning and the end of all natural scenery.",
      "The mountains are calling and I must go.",
      "Climb the mountain so you can see the world, not so the world can see you."
    ]
  },
  {
    title: "Warm Sunlight",
    description: "Bask in golden rays of healing",
    icon: Sun,
    image: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=300&h=200&fit=crop&auto=format", 
    color: "from-orange-400 to-orange-600",
    audioUrl: "https://www.soundjay.com/misc/sounds/bird.wav",
    quotes: [
      "Keep your face always toward the sunshine—and shadows will fall behind you.",
      "Wherever you go, no matter what the weather, always bring your own sunshine.",
      "The sun is a daily reminder that we too can rise again from the darkness."
    ]
  }
];

export function CalmingImageSection() {
  const [currentQuotes, setCurrentQuotes] = useState<{ [key: number]: string }>({});
  const [playingAudio, setPlayingAudio] = useState<number | null>(null);
  const audioRefs = useRef<{ [key: number]: HTMLAudioElement }>({});
  
  // Initialize random quotes for each element
  useEffect(() => {
    const initialQuotes: { [key: number]: string } = {};
    calmingElements.forEach((element, index) => {
      const randomQuote = element.quotes[Math.floor(Math.random() * element.quotes.length)];
      initialQuotes[index] = randomQuote;
    });
    setCurrentQuotes(initialQuotes);
  }, []);

  // Change quotes every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const newQuotes: { [key: number]: string } = {};
      calmingElements.forEach((element, index) => {
        const randomQuote = element.quotes[Math.floor(Math.random() * element.quotes.length)];
        newQuotes[index] = randomQuote;
      });
      setCurrentQuotes(newQuotes);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const toggleAudio = (index: number) => {
    const audio = audioRefs.current[index];
    
    if (playingAudio === index) {
      audio?.pause();
      setPlayingAudio(null);
    } else {
      // Stop any currently playing audio
      if (playingAudio !== null) {
        audioRefs.current[playingAudio]?.pause();
      }
      
      // Create audio element if it doesn't exist
      if (!audio) {
        const newAudio = new Audio();
        newAudio.loop = true;
        newAudio.volume = 0.7;
        newAudio.crossOrigin = 'anonymous';

        const audioSources = [
          'https://www.soundjay.com/misc/sounds/wind-chimes-1.wav',
          'https://www.soundjay.com/misc/sounds/wave-1.wav', 
          'https://www.soundjay.com/misc/sounds/wind-1.wav',
          'https://www.soundjay.com/misc/sounds/bird-1.wav'
        ];

        newAudio.src = audioSources[index] || audioSources[0];
        newAudio.load();
        audioRefs.current[index] = newAudio;
      }
      
      audioRefs.current[index]?.play().catch(() => {
        console.log('Audio play failed, user interaction may be required');
      });
      setPlayingAudio(index);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-foreground mb-2">Calming Moments</h3>
        <p className="text-sm text-muted-foreground">Take a moment to relax and recharge</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {calmingElements.map((element, index) => {
          const Icon = element.icon;
          const currentQuote = currentQuotes[index] || element.quotes[0];
          const isPlaying = playingAudio === index;
          
          return (
            <div key={index} className="calm-card overflow-hidden group" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="relative h-40 overflow-hidden">
                <img 
                  src={element.image}
                  alt={element.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${element.color} opacity-20 group-hover:opacity-30 transition-opacity duration-300`}></div>
                <div className="absolute top-4 left-4">
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/90 text-white bg-gradient-to-r ${element.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="absolute bottom-4 right-4">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="bg-white/90 hover:bg-white text-foreground"
                    onClick={() => toggleAudio(index)}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <Volume2 className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
              <div className="p-4">
                <h4 className="font-semibold text-foreground mb-2">{element.title}</h4>
                <p className="text-xs text-muted-foreground mb-2 italic transition-all duration-500">
                  "{currentQuote}"
                </p>
                <p className="text-sm text-muted-foreground">{element.description}</p>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="calm-card p-6 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center gentle-float">
          <img 
            src="https://images.unsplash.com/photo-1535268647677-300559618651?w=64&h=64&fit=crop&auto=format"
            alt="Peaceful moment"
            className="w-12 h-12 rounded-full object-cover"
          />
        </div>
        <h4 className="font-semibold text-foreground mb-2">Find Your Inner Peace</h4>
        <p className="text-sm text-muted-foreground">Remember to take breaks and care for your mental health</p>
      </div>
    </div>
  );
}