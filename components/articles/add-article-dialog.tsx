"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AddArticleForm } from "@/components/articles/add-article-form";
import { useSupabase } from "@/components/providers/supabase-provider";

export function AddArticleDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { refreshSession } = useSupabase();

  const handleSuccess = async () => {
    setOpen(false);
    
    // Refresh session to ensure we have the latest user data
    await refreshSession();
    
    // Refresh the current route to show the new article
    router.refresh();
    
    // Force a server revalidation after a delay to ensure fresh data
    setTimeout(() => {
      router.refresh();
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Article</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Article</DialogTitle>
          <DialogDescription>
            Enter the URL of an article or upload a PDF file to save for later reading.
          </DialogDescription>
        </DialogHeader>
        <AddArticleForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
} 