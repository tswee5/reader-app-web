"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Settings, 
  ChevronDown, 
  RotateCcw, 
  RotateCw, 
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/components/ui/use-toast";
import { refreshSession, setFreshAuthCookie } from "@/lib/auth/refresh-session";
import { supabase } from "@/lib/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Available ElevenLabs voices
const VOICES = [
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel (Default)" },
  { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella" },
  { id: "ErXwobaYiN019PkySvjV", name: "Antoni" },
  { id: "MF3mGyEYCl7XYWbV9V6O", name: "Elli" },
  { id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh" },
  { id: "VR6AewLTigWG4xSOukaG", name: "Arnold" },
  { id: "pNInz6obpgDQGcFmaJgB", name: "Adam" },
  { id: "yoZ06aMxZJJ28mfd3POQ", name: "Sam" },
];

// Playback speed options
const PLAYBACK_SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2];

interface ArticleSpeechPlayerProps {
  articleId: string;
  content: string;
  title: string;
}

export function ArticleSpeechPlayer({ articleId, content, title }: ArticleSpeechPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolume] = useState(80);
  const [currentVoice, setCurrentVoice] = useState(VOICES[0]);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentWord, setCurrentWord] = useState("");
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const contentChunks = useRef<string[]>([]);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const contentWords = useRef<string[]>([]);
  const { toast } = useToast();
  
  // Create a stable reference for the audio ended handler
  const handleAudioEndedRef = useRef(() => {});
  
  // Create a stable wrapper function for the audio ended event
  const handleEndedRef = useRef<EventListener>(() => {
    handleAudioEndedRef.current();
  });

  // Split the content into words for highlighting
  useEffect(() => {
    contentWords.current = content.split(/\s+/).filter(word => word.trim().length > 0);
  }, [content]);
  
  // Update the handler when relevant dependencies change
  useEffect(() => {
    // Update the handler function
    handleAudioEndedRef.current = () => {
      console.log(`Chunk ${currentChunk + 1}/${contentChunks.current.length} ended`);
      if (currentChunk < contentChunks.current.length - 1) {
        // Move to the next chunk
        setCurrentChunk(currentChunk + 1);
      } else {
        // Reset when all chunks have been played
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentChunk(0);
        setCurrentTime(0);
        console.log("All chunks completed");
      }
    };
  }, [currentChunk, contentChunks, setIsPlaying]);
  
  // Monitor changes to currentChunk to trigger loading the next audio chunk
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    if (isPlaying && !isPaused && currentChunk > 0) {
      // Add a small delay before loading the next chunk
      timeoutId = setTimeout(() => {
        loadAudio();
      }, 300);
    }
    
    // Cleanup timeout if component unmounts or dependencies change
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  // We intentionally exclude loadAudio from deps to avoid infinite loops
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChunk, isPlaying, isPaused]);

  // Set up progress tracking
  useEffect(() => {
    if (isPlaying && !isPaused && audioRef.current) {
      // Update current time every 100ms
      progressIntervalRef.current = setInterval(() => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
          
          // Simulate word tracking based on audio progress
          // This is a simplified version - in a real implementation, you'd need
          // word timestamps from your TTS provider
          const progress = audioRef.current.currentTime / audioRef.current.duration;
          const totalWords = contentWords.current.length;
          const estimatedWordIndex = Math.floor(progress * totalWords);
          
          if (estimatedWordIndex >= 0 && estimatedWordIndex < totalWords) {
            setCurrentWord(contentWords.current[estimatedWordIndex]);
            setCurrentWordIndex(estimatedWordIndex);
          }
        }
      }, 100);
      
      // Get the duration once it's available
      const handleDurationChange = () => {
        if (audioRef.current) {
          setDuration(audioRef.current.duration);
        }
      };
      
      audioRef.current.addEventListener('durationchange', handleDurationChange);
      
      return () => {
        clearInterval(progressIntervalRef.current as NodeJS.Timeout);
        if (audioRef.current) {
          audioRef.current.removeEventListener('durationchange', handleDurationChange);
        }
      };
    } else {
      // Clear the interval if not playing
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }
  }, [isPlaying, isPaused]);

  // Split content into reasonable chunks for API limits
  useEffect(() => {
    // Split by paragraphs first
    const paragraphs = content.split(/\n+/).filter(p => p.trim().length > 0);
    const chunks: string[] = [];
    let currentChunk = "";
    
    // ElevenLabs has a character limit, so we create chunks
    const MAX_CHUNK_LENGTH = 4000; // Characters per API call
    
    paragraphs.forEach(paragraph => {
      // If adding this paragraph would exceed the limit, create a new chunk
      if (currentChunk.length + paragraph.length > MAX_CHUNK_LENGTH) {
        if (currentChunk.length > 0) {
          chunks.push(currentChunk);
          currentChunk = "";
        }
        
        // If the paragraph itself is too long, split it into sentences
        if (paragraph.length > MAX_CHUNK_LENGTH) {
          const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
          
          sentences.forEach(sentence => {
            if (currentChunk.length + sentence.length > MAX_CHUNK_LENGTH) {
              if (currentChunk.length > 0) {
                chunks.push(currentChunk);
                currentChunk = "";
              }
              // If a single sentence is too long, we'll have to truncate it
              if (sentence.length > MAX_CHUNK_LENGTH) {
                let remaining = sentence;
                while (remaining.length > 0) {
                  chunks.push(remaining.slice(0, MAX_CHUNK_LENGTH));
                  remaining = remaining.slice(MAX_CHUNK_LENGTH);
                }
              } else {
                currentChunk = sentence;
              }
            } else {
              currentChunk += sentence;
            }
          });
        } else {
          currentChunk = paragraph;
        }
      } else {
        currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
      }
    });
    
    // Add the last chunk if not empty
    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }
    
    contentChunks.current = chunks;
  }, [content]);

  // Load a chunk of audio with retry capability
  const loadAudio = async () => {
    if (contentChunks.current.length === 0 || isLoading) return;
    
    try {
      setIsLoading(true);
      
      const chunkToLoad = contentChunks.current[currentChunk];
      if (!chunkToLoad) return;
      
      // For very long articles, we'll add context to each chunk
      const contextPrefix = currentChunk > 0 
        ? `Continuing from the article titled "${title}". `
        : `From the article titled "${title}". `;
      
      // First, verify authentication is working by checking auth status API
      let authVerified = false;
      try {
        const authStatusResponse = await fetch('/api/auth-status', {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${JSON.parse(localStorage.getItem('supabase-auth') || '{}')?.session?.access_token || ''}`
          }
        });
        
        if (authStatusResponse.ok) {
          const authStatus = await authStatusResponse.json();
          if (authStatus.auth.getUser.has_user || authStatus.auth.getSession.has_session) {
            console.log("Authentication verified via auth-status API");
            authVerified = true;
          } else {
            console.warn("Auth status check indicates no active session");
            // Try to refresh the session
            await refreshSession();
            // Set fresh cookie regardless
            await setFreshAuthCookie();
          }
        } else {
          console.error("Error checking auth status:", await authStatusResponse.text());
        }
      } catch (authCheckError) {
        console.error("Error verifying authentication:", authCheckError);
      }
      
      // If auth verification failed, try refreshing session
      if (!authVerified) {
        console.log("Auth verification failed, trying session refresh");
        const refreshed = await refreshSession();
        await setFreshAuthCookie();
        
        if (!refreshed) {
          // Try one last approach - direct login status check
          try {
            const { data } = await supabase.auth.getSession();
            if (!data.session) {
              toast({
                title: "Authentication Error",
                description: "Your session has expired. Please log in again.",
                variant: "destructive",
                action: (
                  <div className="flex items-center">
                    <Button variant="outline" size="sm" onClick={() => {
                      window.location.href = "/login?returnUrl=" + encodeURIComponent(window.location.pathname);
                    }}>
                      Log in
                    </Button>
                  </div>
                )
              });
              throw new Error("Authentication failed - no active session");
            }
          } catch (e) {
            console.error("Final authentication check failed:", e);
            throw new Error("Authentication failed after all attempts");
          }
        }
      }
      
      // Ensure fresh cookie is set before making the request
      await setFreshAuthCookie();
      
      // Try to get the auth token for header-based authorization as a fallback
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      
      // Extract user_id and token to send directly with the request
      let userId: string | undefined;
      let accessToken: string | undefined;
      
      try {
        // Try getting user data from Supabase client first (most reliable)
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          userId = data.user.id;
          console.log("Got user ID directly from Supabase client:", userId);
          
          // Also try to get the access token
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData.session?.access_token) {
            accessToken = sessionData.session.access_token;
            headers["Authorization"] = `Bearer ${accessToken}`;
            console.log("Added auth token from active Supabase session");
          }
        }
        
        // If that failed, try localStorage as backup
        if (!userId || !accessToken) {
          const authData = localStorage.getItem('supabase-auth');
          if (authData) {
            const parsed = JSON.parse(authData);
            
            // Get user ID if needed
            if (!userId && parsed?.user?.id) {
              userId = parsed.user.id;
              console.log("Extracted user ID from localStorage:", userId);
            }
            
            // Get token if needed
            if (!accessToken && parsed?.session?.access_token) {
              accessToken = parsed.session.access_token;
              headers["Authorization"] = `Bearer ${accessToken}`;
              console.log("Added auth token from localStorage");
            }
          }
        }
      } catch (e) {
        console.error("Error processing auth data:", e);
      }
      
      // Final check - if we don't have a userId, we can't proceed
      if (!userId) {
        toast({
          title: "Authentication Error",
          description: "Unable to identify your user account. Please log in again.",
          variant: "destructive",
          action: (
            <div className="flex items-center">
              <Button variant="outline" size="sm" onClick={() => {
                window.location.href = "/login?returnUrl=" + encodeURIComponent(window.location.pathname);
              }}>
                Log in
              </Button>
            </div>
          )
        });
        throw new Error("Authentication failed - could not determine user ID");
      }
      
      console.log("Making TTS request with user ID:", userId);
      const response = await fetch("/api/tts", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          articleId,
          text: contextPrefix + chunkToLoad,
          voiceId: currentVoice.id,
          model: "eleven_monolingual_v1",
          user_id: userId // Pass the user ID directly
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("TTS API error:", response.status, errorData);
        
        let errorMessage = "Failed to generate speech.";
        let needsLogin = false;
        
        // Provide more specific error messages based on status code
        if (response.status === 401) {
          errorMessage = "Your session has expired. Please log in again.";
          needsLogin = true;
        } else if (response.status === 404) {
          errorMessage = "Article not found or you don't have access to it.";
        } else if (response.status === 500) {
          errorMessage = errorData.details || "Server error. Please try again later.";
        }
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
          action: needsLogin ? (
            <div className="flex items-center">
              <Button variant="outline" size="sm" onClick={() => {
                // Redirect to login page
                window.location.href = "/login?returnUrl=" + encodeURIComponent(window.location.pathname);
              }}>
                Log in
              </Button>
            </div>
          ) : undefined
        });
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      
      // Create an audio element and set the base64 audio content
      if (audioRef.current) {
        const audioSrc = `data:audio/mpeg;base64,${data.audioContent}`;
        audioRef.current.src = audioSrc;
        audioRef.current.volume = volume / 100;
        audioRef.current.muted = isMuted;
        
        // Remove any existing event listeners
        audioRef.current.removeEventListener("ended", handleEndedRef.current);
        
        // Add the event listener using our stable reference
        audioRef.current.addEventListener("ended", handleEndedRef.current);
        
        setIsPlaying(true);
        setIsPaused(false);
        
        // Play the audio
        await audioRef.current.play();
      }
    } catch (error) {
      console.error("Error loading audio:", error);
      
      // Only show toast if we haven't already shown one from the response handling
      if (error instanceof Error && !error.message.startsWith("Failed to generate speech")) {
        toast({
          title: "Error",
          description: "Failed to generate speech. Please try again.",
          variant: "destructive",
        });
      }
      
      // Reset player state on error
      setIsPlaying(false);
      setIsPaused(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle play/pause button click
  const togglePlayPause = async () => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      // We'll set up the event listener in loadAudio instead
    }
    
    if (isPlaying && !isPaused) {
      // Pause playback
      audioRef.current.pause();
      setIsPaused(true);
    } else if (isPlaying && isPaused) {
      // Resume playback
      await audioRef.current.play();
      setIsPaused(false);
    } else {
      // Start new playback
      await loadAudio();
    }
  };

  // Handle mute/unmute
  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
  };

  // Handle volume change
  const handleVolumeChange = (newVolume: number[]) => {
    const value = newVolume[0];
    setVolume(value);
    if (audioRef.current) {
      audioRef.current.volume = value / 100;
    }
  };

  // Change voice
  const changeVoice = (voice: typeof VOICES[0]) => {
    setCurrentVoice(voice);
    // If currently playing, we should restart with the new voice
    if (isPlaying) {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentTime(0);
      if (audioRef.current) {
        // Remove event listeners before cleaning up the audio element
        audioRef.current.removeEventListener("ended", handleEndedRef.current);
        audioRef.current.pause();
        audioRef.current = null;
      }
      // Reset to first chunk
      setCurrentChunk(0);
    }
  };

  // Change playback speed
  const changePlaybackSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  // Seek backward 15 seconds
  const seekBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 15);
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  // Seek forward 15 seconds
  const seekForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(
        audioRef.current.duration,
        audioRef.current.currentTime + 15
      );
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  // Handle progress bar change
  const handleProgressChange = (newPosition: number[]) => {
    if (audioRef.current) {
      const newTime = (newPosition[0] / 100) * audioRef.current.duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Format time in MM:SS
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calculate estimated total duration (for entire article)
  const calculateTotalDuration = (): number => {
    // Roughly estimate 1 second per 3 words at normal speed
    const wordsPerSecond = 3;
    const totalWords = contentWords.current.length;
    return totalWords / wordsPerSecond;
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        // Remove event listeners
        audioRef.current.removeEventListener("ended", handleEndedRef.current);
        // Stop playback
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // Estimated total duration in seconds
  const estimatedTotalDuration = calculateTotalDuration();

  return (
    <div className="flex flex-col space-y-3 rounded-lg border p-4 shadow-sm sticky top-4 bg-white z-40">
      {/* Player Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-md bg-gray-100 flex items-center justify-center">
            <div className="h-4 w-4 rounded-full bg-gray-300 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-gray-500"></div>
            </div>
          </div>
          <h3 className="text-sm font-medium">AI Supremacy</h3>
        </div>
        
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs px-2 rounded-full">
                {playbackSpeed}x
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="center" 
              side="bottom" 
              sideOffset={5}
              className="w-24 z-[100] bg-white shadow-lg rounded-md border border-gray-200"
            >
              <DropdownMenuLabel className="px-3 py-2">Playback Speed</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {PLAYBACK_SPEEDS.map(speed => (
                <DropdownMenuItem 
                  key={speed}
                  className={
                    speed === playbackSpeed 
                      ? "bg-slate-100 hover:bg-slate-200 focus:bg-slate-200" 
                      : "bg-white hover:bg-slate-100 focus:bg-slate-100"
                  }
                  onClick={() => changePlaybackSpeed(speed)}
                >
                  {speed}x
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              side="bottom" 
              sideOffset={5}
              className="w-56 z-[100] bg-white shadow-lg rounded-md border border-gray-200"
            >
              <DropdownMenuLabel className="px-3 py-2">Voice Selection</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {VOICES.map(voice => (
                <DropdownMenuItem 
                  key={voice.id}
                  className={
                    voice.id === currentVoice.id 
                      ? "bg-slate-100 hover:bg-slate-200 focus:bg-slate-200" 
                      : "bg-white hover:bg-slate-100 focus:bg-slate-100"
                  }
                  onClick={() => changeVoice(voice)}
                >
                  {voice.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="flex items-center space-x-2 text-xs">
        <span className="text-muted-foreground w-10">{formatTime(currentTime)}</span>
        <Slider
          value={[audioRef.current ? (currentTime / audioRef.current.duration) * 100 : 0]}
          max={100}
          step={0.1}
          onValueChange={handleProgressChange}
          className="flex-1"
        />
        <span className="text-muted-foreground w-10">
          {isPlaying && audioRef.current 
            ? formatTime(audioRef.current.duration) 
            : formatTime(estimatedTotalDuration)}
        </span>
      </div>
      
      {/* Playback Controls */}
      <div className="flex items-center justify-center space-x-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={seekBackward}
          disabled={!isPlaying}
          className="h-10 w-10 rounded-full p-0"
        >
          <RotateCcw className="h-5 w-5" />
        </Button>
        
        <Button
          onClick={togglePlayPause}
          disabled={isLoading}
          className="h-12 w-12 rounded-full p-0 bg-blue-500 hover:bg-blue-600 text-white"
        >
          {isLoading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : isPlaying && !isPaused ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-1" />
          )}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={seekForward}
          disabled={!isPlaying}
          className="h-10 w-10 rounded-full p-0"
        >
          <RotateCw className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Current Word Highlight (in article text this would highlight the current word) */}
      {currentWord && (
        <div className="text-xs text-center mt-2">
          <span>Current word: </span>
          <span className="bg-blue-100 px-1 rounded">{currentWord}</span>
        </div>
      )}
    </div>
  );
} 