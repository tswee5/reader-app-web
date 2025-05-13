import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SignUpSuccessPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto max-w-md space-y-6 text-center">
        <h1 className="text-3xl font-bold">Check your email</h1>
        <p className="text-gray-500 dark:text-gray-400">
          We've sent you a confirmation email. Please check your inbox and click the link to verify your account.
        </p>
        <Button asChild>
          <Link href="/login">Back to login</Link>
        </Button>
      </div>
    </div>
  );
} 