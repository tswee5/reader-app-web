"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupabase } from "@/components/providers/supabase-provider";
import { 
  User, 
  BookOpen, 
  MessageSquare, 
  Headphones, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle,
  Sparkles
} from "lucide-react";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ReactNode;
}

export function OnboardingFlow() {
  const router = useRouter();
  const { user, supabase } = useSupabase();
  const [currentStep, setCurrentStep] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      // Update user profile with display name
      if (displayName.trim()) {
        const { error: updateError } = await supabase.auth.updateUser({
          data: { display_name: displayName.trim() }
        });

        if (updateError) {
          setError(updateError.message);
          return;
        }

        // Update profile in database
        const { error: profileError } = await supabase
          .from("users")
          .update({ display_name: displayName.trim() })
          .eq("id", user.id);

        if (profileError) {
          setError(profileError.message);
          return;
        }
      }

      // Complete onboarding
      router.push("/library");
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    router.push("/library");
  };

  const steps: OnboardingStep[] = [
    {
      id: "welcome",
      title: "Welcome to Reader App!",
      description: "Let's get you set up to start reading smarter.",
      component: (
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-full">
            <Sparkles className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Welcome aboard!</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Your account is now verified and ready to use. Let's take a quick tour to help you get the most out of our reading platform.
            </p>
          </div>
        </div>
      )
    },
    {
      id: "profile",
      title: "Complete Your Profile",
      description: "Add your display name to personalize your experience.",
      component: (
        <div className="space-y-6">
          <div className="space-y-4">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              placeholder="Enter your name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              This name will be displayed in your profile and notes.
            </p>
          </div>
          {error && (
            <div className="text-sm font-medium text-destructive bg-red-50 dark:bg-red-950/30 p-3 rounded-md">
              {error}
            </div>
          )}
        </div>
      )
    },
    {
      id: "features",
      title: "Discover Our Features",
      description: "Learn about the powerful tools available to enhance your reading.",
      component: (
        <div className="space-y-6">
          <div className="grid gap-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-lg">Smart Article Parsing</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Import any article URL and we'll extract the content, making it easy to read and annotate.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <MessageSquare className="w-5 h-5 text-green-600" />
                  <CardTitle className="text-lg">AI-Powered Insights</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Get summaries, ask questions, and gain deeper understanding with Claude AI assistance.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <Headphones className="w-5 h-5 text-purple-600" />
                  <CardTitle className="text-lg">Text-to-Speech</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Listen to your articles with high-quality text-to-speech technology.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    },
    {
      id: "complete",
      title: "You're All Set!",
      description: "Ready to start your enhanced reading journey.",
      component: (
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Setup Complete!</h2>
            <p className="text-gray-600 dark:text-gray-400">
              You're ready to start reading smarter. Import your first article and experience the power of AI-enhanced reading.
            </p>
          </div>
        </div>
      )
    }
  ];

  const currentStepData = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto max-w-2xl w-full space-y-8">
        {/* Progress indicator */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-8 rounded-full transition-colors ${
                  index <= currentStep 
                    ? "bg-blue-600" 
                    : "bg-gray-200 dark:bg-gray-700"
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-500">
            {currentStep + 1} of {steps.length}
          </span>
        </div>

        {/* Step content */}
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{currentStepData.title}</CardTitle>
            <CardDescription className="text-lg">
              {currentStepData.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentStepData.component}
          </CardContent>
        </Card>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={isFirstStep}
            className="flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="flex space-x-3">
            <Button
              variant="ghost"
              onClick={handleSkip}
              disabled={isLoading}
            >
              Skip
            </Button>

            {isLastStep ? (
              <Button
                onClick={handleComplete}
                disabled={isLoading}
                className="flex items-center"
              >
                {isLoading ? "Completing..." : "Get Started"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                className="flex items-center"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 