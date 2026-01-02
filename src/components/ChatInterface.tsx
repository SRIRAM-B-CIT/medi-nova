import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Send, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm GenMediBot, your AI emergency assistant. I'm here to help with first aid guidance and emotional support. How can I assist you today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const addMessage = (text: string, sender: 'user' | 'bot') => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const generateBotResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    // Emergency responses
    if (message.includes('cpr') || message.includes('heart') || message.includes('cardiac')) {
      return "🚨 CPR EMERGENCY: 1) Call 911 immediately 2) Place hands on center of chest 3) Push hard and fast at least 2 inches deep 4) 30 compressions, then 2 breaths 5) Continue until help arrives. You're doing great - keep going!";
    }
    
    if (message.includes('choking')) {
      return "🚨 CHOKING: If person can cough/speak, encourage coughing. If not: 1) Stand behind them 2) 5 back blows between shoulder blades 3) 5 abdominal thrusts (Heimlich) 4) Repeat until object comes out 5) Call 911 if unsuccessful.";
    }
    
    if (message.includes('bleeding') || message.includes('cut') || message.includes('wound')) {
      return "🩹 BLEEDING: 1) Apply direct pressure with clean cloth 2) Elevate the wound above heart if possible 3) Don't remove embedded objects 4) If blood soaks through, add more cloth on top 5) Seek medical attention for deep cuts.";
    }
    
    if (message.includes('burn')) {
      return "🔥 BURNS: 1) Remove from heat source 2) Cool with running water for 10-15 minutes 3) Don't use ice 4) Cover with clean, loose bandage 5) For severe burns (larger than palm), seek immediate medical attention.";
    }
    
    // Mental health responses
    if (message.includes('anxiety') || message.includes('panic') || message.includes('stress')) {
      return "💙 ANXIETY SUPPORT: You're safe. Try the 5-4-3-2-1 technique: Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste. Breathe slowly: 4 seconds in, 4 hold, 4 out. You've got this!";
    }
    
    if (message.includes('breath') || message.includes('hyperventilat')) {
      return "🫁 BREATHING HELP: Slow down your breathing. Breathe into a paper bag or cupped hands if available. Focus on exhaling slowly - longer exhales than inhales. Try our Calm Corner breathing exercise. You're going to be okay.";
    }
    
    if (message.includes('depres') || message.includes('sad') || message.includes('hopeless')) {
      return "💚 EMOTIONAL SUPPORT: Your feelings are valid. Remember: you matter, this feeling will pass, and help is available. Crisis hotline: 988. Consider reaching out to friends, family, or a counselor. Take small steps - even just breathing is enough right now.";
    }

    // General responses
    if (message.includes('emergency') || message.includes('911')) {
      return "🚨 In a life-threatening emergency, call 911 immediately. I can provide guidance while you wait for help. What's the specific situation you're dealing with?";
    }
    
    return "I'm here to help with first aid and emotional support. Could you tell me more about your situation? For medical emergencies, please call 911. For mental health crisis, call 988.";
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    
    addMessage(inputText, 'user');
    const botResponse = generateBotResponse(inputText);
    
    setTimeout(() => {
      addMessage(botResponse, 'bot');
      // Auto-speak bot responses
      speakText(botResponse);
    }, 1000);
    
    setInputText('');
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Voice not supported",
        description: "Speech recognition is not supported in this browser.",
        variant: "destructive"
      });
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast({
        title: "Voice input error",
        description: "There was an error with voice recognition. Please try again.",
        variant: "destructive"
      });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      speechSynthesis.cancel();
      
      // Remove emojis and medical symbols for better speech
      const cleanText = text.replace(/[🚨🩹🔥💙🫁💚]/g, '').replace(/\n/g, ' ');
      
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 0.7;
      
      // Wait for voices to load if needed
      if (speechSynthesis.getVoices().length === 0) {
        speechSynthesis.addEventListener('voiceschanged', () => {
          const voices = speechSynthesis.getVoices();
          const englishVoice = voices.find(voice => voice.lang.startsWith('en'));
          if (englishVoice) utterance.voice = englishVoice;
          
          utterance.onstart = () => setIsSpeaking(true);
          utterance.onend = () => setIsSpeaking(false);
          utterance.onerror = () => setIsSpeaking(false);
          
          speechSynthesis.speak(utterance);
        }, { once: true });
      } else {
        const voices = speechSynthesis.getVoices();
        const englishVoice = voices.find(voice => voice.lang.startsWith('en'));
        if (englishVoice) utterance.voice = englishVoice;
        
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        
        speechSynthesis.speak(utterance);
      }
    } else {
      toast({
        title: "Speech not supported",
        description: "Text-to-speech is not supported in this browser.",
        variant: "destructive"
      });
    }
  };

  const toggleSpeech = () => {
    if (isSpeaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <Card className={`max-w-[80%] ${
              message.sender === 'user' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-card'
            }`}>
              <CardContent className="p-3">
                <p className="text-sm leading-relaxed">{message.text}</p>
                <div className={`text-xs mt-1 ${
                  message.sender === 'user' 
                    ? 'text-primary-foreground/70' 
                    : 'text-muted-foreground'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t bg-card">
        <div className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Describe your emergency or ask for help..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="pr-12"
            />
            <Button
              onClick={toggleSpeech}
              size="sm"
              variant="ghost"
              className="absolute right-1 top-1/2 transform -translate-y-1/2"
              disabled={!isSpeaking}
            >
              {isSpeaking ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          <Button
            onClick={handleVoiceInput}
            size="icon"
            variant={isListening ? "destructive" : "outline"}
            className={isListening ? "animate-pulse" : ""}
          >
            {isListening ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
          
          <Button onClick={handleSendMessage} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}