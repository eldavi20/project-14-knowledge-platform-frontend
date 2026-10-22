import { Suspense } from "react";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

async function UserProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const userDisplayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email ||
    "User";

  const userRole =
    user.user_metadata?.role ||
    user.app_metadata?.role ||
    user.role ||
    "authenticated";

  return (
    <div className="max-w-md rounded-lg border bg-card p-6 text-card-foreground shadow-sm space-y-4">
      <h2 className="text-lg font-semibold">User Profile</h2>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between py-1 border-b">
          <span className="text-muted-foreground">User</span>
          <span data-testid="user-email" className="font-medium">
            {userDisplayName}
          </span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-muted-foreground">Role</span>
          <span data-testid="user-role" className="font-medium capitalize">
            {userRole}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <main className="flex-1 p-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your knowledge platform dashboard.
        </p>
      </div>

      <Suspense fallback={<div className="text-muted-foreground">Loading profile...</div>}>
        <UserProfile />
      </Suspense>
    </main>
  );
}
