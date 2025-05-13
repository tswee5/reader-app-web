import { ProtectedRoute } from "@/components/auth/protected-route";
import { UserProfile } from "@/components/auth/user-profile";

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <div className="container py-10">
        <UserProfile />
      </div>
    </ProtectedRoute>
  );
} 