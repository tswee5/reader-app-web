import { useEffect } from 'react';
import { useRouter } from 'next/router';

// This is a fallback page that will redirect to the App Router home page
export default function IndexPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the App Router home page
    router.replace('/');
  }, [router]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh', 
      textAlign: 'center',
      padding: '20px'
    }}>
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
          Reader App
        </h1>
        <p>
          Redirecting to the main application...
        </p>
      </div>
    </div>
  );
} 