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
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { TagColorPicker } from "@/components/articles/tags/tag-color-picker";
import { useToast } from "@/components/ui/use-toast";
import { Plus } from "lucide-react";

const tagSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Tag name is required" })
    .max(50, { message: "Tag name must be 50 characters or less" }),
});

type TagFormValues = z.infer<typeof tagSchema>;

interface CreateTagDialogProps {
  onTagCreated?: (tagId: string) => void;
  triggerButton?: React.ReactNode;
}

export function CreateTagDialog({ onTagCreated, triggerButton }: CreateTagDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>("gray");
  const { supabase, user } = useSupabase();
  const { toast } = useToast();

  const form = useForm<TagFormValues>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = async (data: TagFormValues) => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // Create the tag
      const { data: tagData, error } = await supabase
        .from("tags")
        .insert({
          user_id: user.id,
          name: data.name,
          color: selectedColor,
        })
        .select()
        .single();
        
      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Tag already exists",
            description: "You already have a tag with this name",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error creating tag",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }
      
      // Reset form and close dialog
      form.reset();
      setOpen(false);
      
      toast({
        title: "Tag created",
        description: `Tag "${data.name}" has been created successfully`,
      });
      
      // Call callback if provided
      if (onTagCreated && tagData) {
        onTagCreated(tagData.id);
      }
    } catch (error) {
      console.error("Error creating tag:", error);
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button size="sm" variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            New Tag
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Tag</DialogTitle>
          <DialogDescription>
            Create a new tag to organize your articles.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tag Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter tag name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-2">
              <FormLabel>Tag Color</FormLabel>
              <TagColorPicker
                selectedColor={selectedColor}
                onColorSelect={setSelectedColor}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Tag"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 