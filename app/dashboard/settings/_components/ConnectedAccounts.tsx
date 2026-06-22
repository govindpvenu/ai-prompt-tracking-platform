"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/constants/icons";

export function ConnectedAccounts() {
  const connectedAccounts = [
    {
      id: "google",
      name: "Google",
      icon: Icons.google,
      connected: false,
      action: "Connect",
    },
  ];

  const handleAccountAction = (accountId: string) => {
    console.log(`${accountId} action clicked`);
    // Add your connection/disconnection logic here
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
                </div>
              </div>
              <Button
                variant={account.connected ? "secondary" : "default"}
                onClick={() => handleAccountAction(account.id)}
              >
                {account.action}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
