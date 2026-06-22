"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  Fingerprint,
  Palette,
  Shield,
  User,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileDetails from "./ProfileDetails";
import { ConnectedAccounts } from "./ConnectedAccounts";
import SecuritySettings from "./SecuritySettings";
import ActiveSessions from "./ActiveSessions";
import AccountInfo from "./AccountInfo";
import type { Session } from "@/lib/auth";

const settingsSections = [
  "profile",
  "account",
  "security",
  "appearance",
] as const;

type SettingsSection = (typeof settingsSections)[number];

function getActiveSection(section: string | null): SettingsSection {
  if (settingsSections.includes(section as SettingsSection)) {
    return section as SettingsSection;
  }

  return "profile";
}

export function SettingsTabs({ user }: { user: Session["user"] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSection = getActiveSection(searchParams.get("section"));

  function handleSectionChange(section: string) {
    const params = new URLSearchParams(searchParams);

    if (section === "profile") {
      params.delete("section");
    } else {
      params.set("section", section);
    }

    const query = params.toString();
    router.replace(
      query ? `/dashboard/settings?${query}` : "/dashboard/settings",
      {
        scroll: false,
      },
    );
  }

  return (
    <Tabs
      value={activeSection}
      onValueChange={handleSectionChange}
      className="w-full"
    >
      <TabsList className="mb-8 grid h-auto w-full grid-cols-2 sm:grid-cols-4">
        <TabsTrigger value="profile" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          Profile
        </TabsTrigger>
        <TabsTrigger value="account" className="flex items-center gap-2">
          <Fingerprint className="h-4 w-4" />
          Account
        </TabsTrigger>
        <TabsTrigger value="security" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Security
        </TabsTrigger>
        <TabsTrigger value="appearance" className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Appearance
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="space-y-6">
        <ProfileDetails user={user} />
        <AccountInfo user={user} />
      </TabsContent>

      <TabsContent value="account" className="space-y-6">
        <ConnectedAccounts />
      </TabsContent>

      <TabsContent value="security" className="space-y-6">
        <SecuritySettings />
        <ActiveSessions />
      </TabsContent>

      <TabsContent value="appearance">
        <Card>
          <CardHeader>
            <CardTitle>Appearance Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Appearance preferences will be implemented here.
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
