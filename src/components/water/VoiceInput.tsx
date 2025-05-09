import { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Define the WebkitSpeechRecognition types for TypeScript
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
  item(index: number): SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  [index: number]: SpeechRecognitionAlternative;
  item(index: number): SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface WebkitSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (event: Event) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: (event: Event) => void;
  onerror: (event: Event & { error: string }) => void;
  start(): void;
  stop(): void;
}

// Add the webkit prefixed classes to the global scope
declare global {
  interface Window {
    webkitSpeechRecognition: new () => WebkitSpeechRecognition;
    SpeechRecognition: new () => WebkitSpeechRecognition;
  }
}

interface VoiceInputProps {
  onAddWater: (amount: number) => void;
}

export function VoiceInput({ onAddWater }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<WebkitSpeechRecognition | null>(null);

  const startListening = useCallback(() => {
    // Check if browser supports speech recognition (standard or webkit prefixed)
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognitionAPI) {
      toast.error("Voice recognition is not supported in your browser");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      toast.info("Listening... Say an amount like '500 ml' or '2 liters'");
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      console.log('Voice input:', transcript);

      // Extract number and unit from speech
      const match = transcript.match(/(\d+(\.\d+)?)\s*(ml|milliliters|millilitres|l|liter|litre)s?/);
      if (match) {
        const amount = parseFloat(match[1]);
        const unit = match[3];
        
        // Convert to milliliters if necessary
        const mlAmount = unit.startsWith('l') ? amount * 1000 : amount;
        
        if (mlAmount > 0 && mlAmount <= 2000) {
          onAddWater(mlAmount);
          toast.success(`Added ${mlAmount}ml of water`);
        } else {
          toast.error("Please specify a reasonable amount (up to 2000ml)");
        }
      } else {
        toast.error("Could not understand the amount. Please try again.");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setRecognition(null);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      toast.error("Error understanding speech. Please try again.");
      setIsListening(false);
      setRecognition(null);
    };

    recognition.start();
    setRecognition(recognition);
  }, [onAddWater]);

  const stopListening = useCallback(() => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
      setRecognition(null);
    }
  }, [recognition]);

  return (
    <Button
      onClick={isListening ? stopListening : startListening}
      variant="ghost"
      size="icon"
      className={cn(
        "group relative h-14 bg-downscale-blue/20 hover:bg-downscale-blue/30 text-downscale-cream rounded-xl flex items-center justify-center transition-all hover:scale-102 border border-downscale-brown hover:border-downscale-brown/70 focus:outline-none focus:ring-2 focus:ring-downscale-blue",
        isListening && "bg-red-500/20 hover:bg-red-500/30 border-red-500/70"
      )}
    >
      {isListening ? (
        <MicOff className="h-5 w-5 group-hover:scale-125 transition-transform text-red-500" />
      ) : (
        <Mic className="h-5 w-5 group-hover:scale-125 transition-transform" />
      )}
      
      <span className="sr-only">
        {isListening ? "Stop Voice Input" : "Start Voice Input"}
      </span>
    </Button>
  );
}
