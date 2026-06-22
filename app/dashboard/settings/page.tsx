import ChangeAvatar from "./_components/ChangeAvatar";
import { requireAuth } from "@/helper/require-auth";
import { SettingsTabs } from "./_components/SettingsTabs";

export default async function SettingsPage() {
  const session = await requireAuth();

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto max-w-4xl px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <ChangeAvatar image={session?.user?.image ?? null} />
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>
        </div>

        <SettingsTabs user={session.user} />
      </div>
    </div>
  );
}
