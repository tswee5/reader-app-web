"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useSupabase } from "@/components/providers/supabase-provider";
import { enhancedErrorRecovery } from "@/lib/auth/enhanced-error-recovery";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { supabase } = useSupabase();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Handle URL errors on mount
  useEffect(() => {
    const urlError = searchParams.get('error');
    if (urlError) {
      const userFriendlyError = enhancedErrorRecovery.getErrorMessage({ message: urlError });
      setError(userFriendlyError);
      
      // Clear the error from URL without triggering navigation
      const url = new URL(window.location.href);
      url.searchParams.delete('error');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams]);

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    setError(null);

    try {
      const { error: signInError } = await enhancedErrorRecovery.authenticateWithRecovery(
        () => supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        }),
        {
          maxAttempts: 2,
          baseDelay: 1000,
        }
      );

      if (signInError) {
        const userFriendlyError = enhancedErrorRecovery.getErrorMessage(signInError);
        setError(userFriendlyError);
        return;
      }

      // Successful login - redirect to library
      router.push("/library");
      router.refresh();
    } catch (error) {
      const userFriendlyError = enhancedErrorRecovery.getErrorMessage(error);
      setError(userFriendlyError);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Welcome back</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Enter your credentials to sign in to your account
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="you@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {error && (
            <div className="text-sm font-medium text-destructive">{error}</div>
          )}
          <div className="flex items-center justify-end">
            <Button
              variant="link"
              className="p-0"
              type="button"
              onClick={() => router.push("/reset-password")}
            >
              Forgot password?
            </Button>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </Form>
      <div className="text-center text-sm">
        Don't have an account?{" "}
        <Button variant="link" className="p-0" onClick={() => router.push("/signup")}>
          Sign up
        </Button>
      </div>
    </div>
  );
}

export function LoginForm() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Welcome back</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Loading...
          </p>
        </div>
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  );
} 