import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PasswordUpdatedPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto max-w-md space-y-6 text-center">
        <h1 className="text-3xl font-bold">Password updated</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Your password has been successfully updated. You can now sign in with your new password.
        </p>
        <Button asChild>
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    </div>
  );
} 