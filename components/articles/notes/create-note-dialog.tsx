"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useToast } from "@/components/ui/use-toast";

// Schema for note form validation
const noteSchema = z.object({
  content: z
    .string()
    .min(1, { message: "Note content is required" })
    .max(2000, { message: "Note content must be 2000 characters or less" }),
});

type NoteFormValues = z.infer<typeof noteSchema>;

interface CreateNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  articleId: string;
  highlightId: string;
  highlightedText: string;
  onNoteCreated?: () => void;
}

export function CreateNoteDialog({
  open,
  onOpenChange,
  articleId,
  highlightId,
  highlightedText,
  onNoteCreated,
}: CreateNoteDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { supabase, user } = useSupabase();
  const { toast } = useToast();

  // Initialize form with zod resolver
  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      content: "",
    },
  });

  // Handle form submission
  const onSubmit = async (data: NoteFormValues) => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // Create the note
      const { data: noteData, error } = await supabase
        .from("notes")
        .insert({
          user_id: user.id,
          article_id: articleId,
          highlight_id: highlightId,
          content: data.content,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
        
      if (error) {
        console.error("Error creating note:", error);
        toast({
          title: "Error creating note",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      // Reset form and close dialog
      form.reset();
      onOpenChange(false);
      
      toast({
        title: "Note created",
        description: "Your note has been saved",
      });
      
      // Call callback if provided
      if (onNoteCreated) {
        onNoteCreated();
      }
    } catch (error) {
      console.error("Error in note creation:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Add Note</DialogTitle>
          <DialogDescription>
            Create a note for the highlighted text.
          </DialogDescription>
        </DialogHeader>
        
        {/* Show the highlighted text */}
        <div className="my-2 rounded-md bg-muted p-3 text-sm italic">
          "{highlightedText}"
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Write your thoughts about this highlight..." 
                      className="min-h-[120px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Note"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 