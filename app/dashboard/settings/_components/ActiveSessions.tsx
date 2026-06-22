"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";

interface Session {
  id: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  createdAt: Date;
  expiresAt: Date;
  token: string;
}

interface ActiveSessionsProps {
  className?: string;
}

// Helper function to detect device type from user agent
function getDeviceInfo(userAgent: string | null): {
  name: string;
  type: string;
} {
  if (!userAgent) return { name: "Unknown Device", type: "unknown" };

  const ua = userAgent.toLowerCase();

  if (ua.includes("macintosh") || ua.includes("mac os")) {
    if (ua.includes("iphone")) return { name: "iPhone", type: "mobile" };
    return { name: "Mac", type: "desktop" };
  }

  if (ua.includes("windows")) {
    return { name: "Windows PC", type: "desktop" };
  }

  if (ua.includes("android")) {
    if (ua.includes("mobile"))
      return { name: "Android Phone", type: "mobile" };
    return { name: "Android Tablet", type: "tablet" };
  }

  if (ua.includes("iphone")) return { name: "iPhone", type: "mobile" };
  if (ua.includes("ipad")) return { name: "iPad", type: "tablet" };
  if (ua.includes("linux")) return { name: "Linux PC", type: "desktop" };

  return { name: "Unknown Device", type: "unknown" };
}

// Helper function to format last active time
function formatLastActive(createdAt: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - new Date(createdAt).getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return "Active now";
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  if (diffInDays === 1) return "1 day ago";
  return `${diffInDays} days ago`;
}

export default function ActiveSessions({ className }: ActiveSessionsProps) {
  const currentSession = authClient.useSession();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingToken, setRevokingToken] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    const { data, error } = await authClient.listSessions();

    if (error) {
      toast.error(error.message ?? "Unable to load active sessions.");
      setLoading(false);
      return;
    }

    setSessions(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadSessions();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadSessions]);

  const handleRevokeSession = async (session: Session) => {
    setRevokingToken(session.token);

    const { error } = await authClient.revokeSession({
      token: session.token,
    });

    if (error) {
      toast.error(error.message ?? "Unable to revoke session.");
      setRevokingToken(null);
      return;
    }

    setSessions((prev) =>
      prev.filter((activeSession) => activeSession.token !== session.token),
    );
    setRevokingToken(null);
    toast.success("Session revoked.");
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-muted mb-2 h-4 w-1/3 rounded"></div>
                <div className="bg-muted h-3 w-1/2 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Active Sessions</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {sessions.map((session) => {
            const deviceInfo = getDeviceInfo(session.userAgent ?? null);
            const ipAddress = session.ipAddress ?? "IP unavailable";
            const lastActive = formatLastActive(session.createdAt);
            const isCurrentSession =
              session.token === currentSession.data?.session.token;

            return (
              <div
                key={session.id}
                className="flex items-start justify-between py-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-foreground font-medium">
                      {deviceInfo.name}
                    </span>
                    {isCurrentSession && (
                      <Badge variant="secondary" className="text-xs">
                        Current
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {ipAddress} • {lastActive}
                  </p>
                </div>

                {!isCurrentSession && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={revokingToken === session.token}
                    onClick={() => handleRevokeSession(session)}
                    className="text-xs"
                  >
                    {revokingToken === session.token ? <Spinner /> : "Revoke"}
                  </Button>
                )}
              </div>
            );
          })}

          {sessions.length === 0 && (
            <p className="text-muted-foreground text-sm">
              No active sessions found.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
