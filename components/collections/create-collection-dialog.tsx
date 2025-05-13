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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useToast } from "@/components/ui/use-toast";
import { FolderPlus } from "lucide-react";

const collectionSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Collection name is required" })
    .max(100, { message: "Collection name must be 100 characters or less" }),
  description: z
    .string()
    .max(500, { message: "Description must be 500 characters or less" })
    .optional(),
  is_public: z.boolean().default(false),
});

type CollectionFormValues = z.infer<typeof collectionSchema>;

interface CreateCollectionDialogProps {
  onCollectionCreated?: (collectionId: string) => void;
  triggerButton?: React.ReactNode;
}

export function CreateCollectionDialog({
  onCollectionCreated,
  triggerButton,
}: CreateCollectionDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { supabase, user } = useSupabase();
  const { toast } = useToast();

  const form = useForm<CollectionFormValues>({
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      name: "",
      description: "",
      is_public: false,
    },
  });

  const onSubmit = async (data: CollectionFormValues) => {
    if (!user) return;

    setIsLoading(true);

    try {
      // Create the collection
      const { data: collectionData, error } = await supabase
        .from("collections")
        .insert({
          user_id: user.id,
          name: data.name,
          description: data.description || null,
          is_public: data.is_public,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Collection already exists",
            description: "You already have a collection with this name",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error creating collection",
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
        title: "Collection created",
        description: `Collection "${data.name}" has been created successfully`,
      });

      // Call callback if provided
      if (onCollectionCreated && collectionData) {
        onCollectionCreated(collectionData.id);
      }
    } catch (error) {
      console.error("Error creating collection:", error);
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
            <FolderPlus className="mr-2 h-4 w-4" />
            New Collection
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Collection</DialogTitle>
          <DialogDescription>
            Create a new collection to organize your saved articles.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Collection Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter collection name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter collection description"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_public"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Public Collection</FormLabel>
                    <FormDescription>
                      Make this collection visible to others
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Collection"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 