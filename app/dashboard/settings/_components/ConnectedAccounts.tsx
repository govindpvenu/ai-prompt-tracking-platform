"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Icons } from "@/constants/icons";
import { authClient } from "@/lib/auth-client";

type LinkedAccount = {
  id: string;
  providerId: string;
  accountId: string;
  scopes?: string[];
};

const settingsAccountUrl = "/dashboard/settings?section=account";

export function ConnectedAccounts() {
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [pendingProvider, setPendingProvider] = useState<string | null>(null);

  const googleAccount = useMemo(
    () => accounts.find((account) => account.providerId === "google"),
    [accounts],
  );
  const isGoogleConnected = Boolean(googleAccount);

  const loadAccounts = useCallback(async () => {
    const { data, error } = await authClient.listAccounts();

    if (error) {
      toast.error(error.message ?? "Unable to load connected accounts.");
      setIsLoadingAccounts(false);
      return;
    }

    setAccounts(data ?? []);
    setIsLoadingAccounts(false);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadAccounts();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadAccounts]);

  const connectedAccounts = [
    {
      id: "google",
      name: "Google",
      icon: Icons.google,
      connected: isGoogleConnected,
      accountId: googleAccount?.accountId,
      action: isGoogleConnected ? "Disconnect" : "Connect",
    },
  ];

  async function handleConnectGoogle() {
    await authClient.linkSocial(
      {
        provider: "google",
        callbackURL: settingsAccountUrl,
        errorCallbackURL: settingsAccountUrl,
      },
      {
        onRequest: () => {
          setPendingProvider("google");
        },
        onError: (ctx) => {
          setPendingProvider(null);
          toast.error(ctx.error.message ?? "Unable to connect Google.");
        },
      },
    );
    setPendingProvider(null);
  }

  async function handleDisconnectGoogle(accountId?: string) {
    await authClient.unlinkAccount(
      {
        providerId: "google",
        accountId,
      },
      {
        onRequest: () => {
          setPendingProvider("google");
        },
        onSuccess: async () => {
          toast.success("Google account disconnected.");
          await loadAccounts();
          setPendingProvider(null);
        },
        onError: (ctx) => {
          setPendingProvider(null);
          toast.error(ctx.error.message ?? "Unable to disconnect Google.");
        },
      },
    );
  }

  const handleAccountAction = async (accountId: string) => {
    if (accountId !== "google") {
      return;
    }

    if (isGoogleConnected) {
      await handleDisconnectGoogle(googleAccount?.accountId);
      return;
    }

    await handleConnectGoogle();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected Accounts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {connectedAccounts.map((account) => (
            <div
              key={account.id}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div className="flex items-center gap-3">
                <account.icon className="h-5 w-5" />
                <div>
                  <p className="font-medium">{account.name}</p>
                  <p className="text-muted-foreground text-sm">
                    {account.connected ? "Connected" : "Not Connected"}
                  </p>
                  {account.connected && account.accountId && (
                    <Badge variant="secondary" className="mt-2">
                      Linked
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant={account.connected ? "outline" : "default"}
                disabled={
                  isLoadingAccounts || pendingProvider === account.id
                }
                onClick={() => handleAccountAction(account.id)}
              >
                {pendingProvider === account.id ? <Spinner /> : account.action}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
