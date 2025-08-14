"use client";

import { useState, useEffect, useCallback } from "react";
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
import { useSupabase } from "@/components/providers/supabase-provider";
import { useToast } from "@/components/ui/use-toast";
import { Upload, FileText, Link, X } from "lucide-react";
import { cn } from "@/lib/utils";

const addArticleSchema = z.object({
  url: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
});

type AddArticleFormValues = z.infer<typeof addArticleSchema>;

export function AddArticleForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const { user } = useSupabase();
  const { toast } = useToast();

  const form = useForm<AddArticleFormValues>({
    resolver: zodResolver(addArticleSchema),
    defaultValues: {
      url: "",
    },
  });

  const handleFileSelect = useCallback((file: File) => {
    if (file.type !== "application/pdf") {
      toast({
        title: "Invalid file type",
        description: "Please select a PDF file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      toast({
        title: "File too large",
        description: "Please select a PDF file smaller than 50MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    form.setValue("url", ""); // Clear URL when file is selected
  }, [form, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const removeFile = useCallback(() => {
    setSelectedFile(null);
  }, []);

  async function onSubmit(data: AddArticleFormValues) {
    setIsLoading(true);
    setError(null);

    try {
      let response;

      if (selectedFile) {
        // Handle PDF upload
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("userId", user?.id || "");

        response = await fetch("/api/parse-pdf", {
          method: "POST",
          credentials: 'include',
          body: formData,
        });
      } else if (data.url) {
        // Handle URL
        response = await fetch("/api/parse-article", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: 'include',
          body: JSON.stringify({ 
            url: data.url,
            userId: user?.id
          }),
        });
      } else {
        setError("Please provide either a URL or upload a PDF file");
        return;
      }

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to add article");
        return;
      }

      // Reset form
      form.reset();
      setSelectedFile(null);
      
      // Show success message
      toast({
        title: "Article added successfully",
        description: selectedFile ? "PDF has been added to your library" : "Article has been added to your library",
      });
      
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
          {/* URL Input */}
          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  Article URL
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder="https://example.com/article" 
                    {...field}
                    disabled={!!selectedFile}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or
              </span>
            </div>
          </div>

          {/* File Upload Area */}
          <div className="space-y-2">
            <FormLabel className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Upload PDF
            </FormLabel>
            
            {selectedFile ? (
              <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
                <FileText className="h-4 w-4 text-blue-500" />
                <span className="flex-1 text-sm truncate">{selectedFile.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                  isDragOver
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-muted-foreground/50"
                )}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drag and drop a PDF file here, or click to browse
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("file-input")?.click()}
                  disabled={isLoading}
                >
                  Choose File
                </Button>
                <input
                  id="file-input"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {error && (
            <div className="text-sm font-medium text-destructive">{error}</div>
          )}

          <Button type="submit" disabled={isLoading || (!form.watch("url") && !selectedFile)}>
            {isLoading ? "Adding article..." : "Add Article"}
          </Button>
        </form>
      </Form>
    </div>
  );
} 