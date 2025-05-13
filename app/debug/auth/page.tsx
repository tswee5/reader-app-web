import { AuthDebugger } from "@/components/debug/auth-debugger";
import { ClaudeTester } from "@/components/debug/claude-tester";
import { AuthTestClient } from "@/components/debug/auth-test-client";
import { CookieDebugger } from "@/components/debug/cookie-debugger";

export const metadata = {
  title: 'Auth Debugger',
  description: 'Test and debug authentication functionality',
};

export default function AuthDebugPage() {
  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-8">Authentication Debugger</h1>
      <p className="text-muted-foreground mb-6">
        This page helps diagnose authentication issues between the front-end and backend APIs.
        Use this tool to verify that your session is properly transmitted to API routes.
      </p>
      
      <div className="space-y-10">
        <div>
          <h2 className="text-xl font-bold mb-4">Cookie Transmission Test</h2>
          <p className="text-muted-foreground mb-4">
            This is the most comprehensive test tool to verify cookies are being properly 
            transmitted between client and server, which is critical for authentication.
          </p>
          <CookieDebugger />
        </div>
        
        <AuthTestClient />
        
        <AuthDebugger />
        
        <div>
          <h2 className="text-xl font-bold mb-6">Claude API Integration Test</h2>
          <p className="text-muted-foreground mb-6">
            Test if the Claude API integration is working properly. This helps determine if 
            authentication issues are related to Supabase or the Anthropic API.
          </p>
          <ClaudeTester />
        </div>
      </div>
    </div>
  );
} 