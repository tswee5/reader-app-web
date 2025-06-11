import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

function LoginFormWrapper() {
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
      <LoginForm />
    </Suspense>
  );
}

export default function LoginPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <LoginFormWrapper />
    </div>
  );
} 