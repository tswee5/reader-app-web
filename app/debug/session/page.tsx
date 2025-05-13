import { SessionDebugger } from "@/components/debug/session-debugger";

export const metadata = {
  title: 'Supabase Session Debugger',
  description: 'Debug Supabase session cookie issues',
};

export default function SessionDebugPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Supabase Session Debugger</h1>
          <p className="text-muted-foreground mb-8">
            Use this tool to diagnose issues with Supabase session cookies and authentication. 
            It compares client-side and server-side session state to identify discrepancies.
          </p>
          
          <SessionDebugger />
          
          <div className="mt-8 p-4 bg-muted rounded-md text-sm">
            <h2 className="font-medium mb-2">How to use this debugger</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Examine the client and server-side session information</li>
              <li>Check if both sides have matching session data</li>
              <li>Use "Refresh Session" to update tokens</li>
              <li>Test API authentication to verify tokens are working</li>
              <li>Examine Supabase cookies to see if any are expired or invalid</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

export function clearOldAuthState() {
  if (typeof window === 'undefined') return;
  
  try {
    // Only remove specific legacy localStorage items
    // But don't remove current session data
    localStorage.removeItem('supabase.auth.token');
    
    // Log a less destructive message
    console.log('Checked for legacy auth state in localStorage');
  } catch (e) {
    console.error('Error checking auth state:', e);
  }
} 