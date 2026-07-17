import { FormEvent, useEffect, useRef, useState } from 'react';
import { Bot, Loader2, RotateCcw, Send, ShieldAlert, User } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

const welcomeMessage: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: "Hello, I'm MediNova's health information assistant. Tell me what is bothering you. I’ll ask a few short questions before sharing general self-care information.",
};

export default function MedicalChatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const submitMessage = async (event: FormEvent) => {
    event.preventDefault();
    const content = input.trim();
    if (!content || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
    };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setIsLoading(true);

    try {
      const conversation = nextMessages
        .filter((message) => message.id !== 'welcome')
        .map(({ role, content: messageContent }) => ({ role, content: messageContent }));
      const data = await apiClient.sendMedicalChatMessage(conversation);
      setMessages((current) => [...current, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.reply,
      }]);
    } catch (error) {
      toast({
        title: 'Unable to get a response',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetChat = () => {
    setMessages([welcomeMessage]);
    setInput('');
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-9rem)] max-w-4xl flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Bot className="h-7 w-7 text-primary" /> Medical Chatbot
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            General health information powered by openai/gpt-oss-20b
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={resetChat} disabled={isLoading}>
          <RotateCcw className="mr-2 h-4 w-4" /> New chat
        </Button>
      </div>

      <Alert variant="destructive" className="bg-destructive/5">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Not medical advice or an emergency service</AlertTitle>
        <AlertDescription>
          This assistant cannot diagnose or recommend treatment. For severe or sudden symptoms, contact your local emergency service immediately.
        </AlertDescription>
      </Alert>

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6" aria-live="polite">
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
              }`}>
                {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${
                message.role === 'user'
                  ? 'rounded-tr-sm bg-primary text-primary-foreground'
                  : 'rounded-tl-sm bg-muted text-foreground'
              }`}>
                {message.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                <Bot className="h-4 w-4" />
              </div>
              <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form onSubmit={submitMessage} className="border-t bg-background p-4">
          <div className="flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value.slice(0, 2000))}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              placeholder="Describe the issue, symptoms, and when they started…"
              className="min-h-[52px] max-h-32 resize-none"
              disabled={isLoading}
              aria-label="Message"
            />
            <Button type="submit" size="icon" className="h-[52px] w-[52px]" disabled={!input.trim() || isLoading}>
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              <span className="sr-only">Send message</span>
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Do not share names, addresses, phone numbers, or other identifying information.</p>
        </form>
      </Card>
    </div>
  );
}
