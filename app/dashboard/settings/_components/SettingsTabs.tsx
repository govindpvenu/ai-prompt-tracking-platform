"use client";

import { useSearchParams } from "next/navigation";
import { Fingerprint, Palette, Shield, User } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileDetails from "./ProfileDetails";
import { ConnectedAccounts } from "./ConnectedAccounts";
import SecuritySettings from "./SecuritySettings";
import ActiveSessions from "./ActiveSessions";
import AccountInfo from "./AccountInfo";
import { AppearanceSettings } from "./AppearanceSettings";
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
  const searchParams = useSearchParams();
  const activeSection = getActiveSection(searchParams.get("section"));

  function handleSectionChange(section: string) {
    const nextSection = getActiveSection(section);
    const params = new URLSearchParams(window.location.search);

    if (nextSection === "profile") {
      params.delete("section");
    } else {
      params.set("section", nextSection);
    }

    const query = params.toString();
    window.history.replaceState(
      null,
      "",
      query ? `${window.location.pathname}?${query}` : window.location.pathname,
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
        <AppearanceSettings />
      </TabsContent>
    </Tabs>
  );
}
