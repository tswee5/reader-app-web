"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { supabase } from "@/lib/supabase/client";
import { useSupabase } from "@/components/providers/supabase-provider";

const addArticleSchema = z.object({
  url: z.string().url({ message: "Please enter a valid URL" }),
});

type AddArticleFormValues = z.infer<typeof addArticleSchema>;

export function AddArticleForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useSupabase(); // Get user from the Supabase provider instead

  const form = useForm<AddArticleFormValues>({
    resolver: zodResolver(addArticleSchema),
    defaultValues: {
      url: "",
    },
  });

  async function onSubmit(data: AddArticleFormValues) {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/parse-article", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({ 
          url: data.url,
          userId: user?.id // Use user ID from the provider
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to add article");
        return;
      }

      // Reset form
      form.reset();
      
      // Refresh the page or call success callback
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
      
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Article URL</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="https://example.com/article" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {error && (
            <div className="text-sm font-medium text-destructive">{error}</div>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Adding article..." : "Add Article"}
          </Button>
        </form>
      </Form>
    </div>
  );
} 