'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface Session {
    id: string;
    userAgent: string | null;
    ipAddress: string | null;
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
    if (!userAgent) return { name: 'Unknown Device', type: 'unknown' };

    const ua = userAgent.toLowerCase();

    if (ua.includes('macintosh') || ua.includes('mac os')) {
        if (ua.includes('iphone')) return { name: 'iPhone', type: 'mobile' };
        return { name: 'MacBook Pro', type: 'desktop' };
    }

    if (ua.includes('windows')) {
        return { name: 'Windows PC', type: 'desktop' };
    }

    if (ua.includes('android')) {
        if (ua.includes('mobile'))
            return { name: 'Android Phone', type: 'mobile' };
        return { name: 'Android Tablet', type: 'tablet' };
    }

    if (ua.includes('iphone')) return { name: 'iPhone', type: 'mobile' };
    if (ua.includes('ipad')) return { name: 'iPad', type: 'tablet' };
    if (ua.includes('linux')) return { name: 'Linux PC', type: 'desktop' };

    return { name: 'Unknown Device', type: 'unknown' };
}

// Helper function to get location from IP (placeholder - in real app, you'd use a geolocation service)
function getLocationFromIP(ipAddress: string | null): string {
    if (!ipAddress) return 'Unknown Location';

    // This is a placeholder - in a real application, you would use a geolocation service
    // like ipapi, ipinfo, or MaxMind to get actual location data
    const mockLocations = [
        'San Francisco, CA',
        'New York, NY',
        'Los Angeles, CA',
        'Chicago, IL',
        'Houston, TX',
        'Phoenix, AZ',
        'Philadelphia, PA',
        'San Antonio, TX',
        'San Diego, CA',
        'Dallas, TX',
    ];

    // Simple hash to get consistent location for same IP
    const hash = ipAddress
        .split('.')
        .reduce((acc, octet) => acc + parseInt(octet), 0);
    return mockLocations[hash % mockLocations.length];
}

// Helper function to format last active time
function formatLastActive(createdAt: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - createdAt.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'Active now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
}

export default function ActiveSessions({ className }: ActiveSessionsProps) {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(
        null
    );
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch active sessions from your auth system
        // This is a placeholder - replace with actual API call
        const fetchSessions = async () => {
            try {
                // Simulate API call delay
                await new Promise((resolve) => setTimeout(resolve, 1000));

                // Mock data - replace with actual session fetching logic
                const mockSessions: Session[] = [
                    {
                        id: 'session-1',
                        userAgent:
                            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                        ipAddress: '192.168.1.100',
                        createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
                        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
                        token: 'current-session-token',
                    },
                    {
                        id: 'session-2',
                        userAgent:
                            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
                        ipAddress: '203.0.113.45',
                        createdAt: new Date(
                            Date.now() - 2 * 24 * 60 * 60 * 1000
                        ), // 2 days ago
                        expiresAt: new Date(
                            Date.now() + 22 * 24 * 60 * 60 * 1000
                        ), // 22 days from now
                        token: 'other-session-token',
                    },
                ];

                setSessions(mockSessions);
                setCurrentSessionId('session-1'); // Assume first session is current
                setLoading(false);
            } catch (error) {
                console.error('Failed to fetch sessions:', error);
                setLoading(false);
            }
        };

        fetchSessions();
    }, []);

    const handleRevokeSession = async (sessionId: string) => {
        try {
            // Implement session revocation logic here
            console.log('Revoking session:', sessionId);

            // Remove session from state
            setSessions((prev) =>
                prev.filter((session) => session.id !== sessionId)
            );

            // If this was the current session, redirect to login
            if (sessionId === currentSessionId) {
                // Handle logout/redirect logic
                window.location.href = '/sign-in';
            }
        } catch (error) {
            console.error('Failed to revoke session:', error);
        }
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
                        const deviceInfo = getDeviceInfo(session.userAgent);
                        const location = getLocationFromIP(session.ipAddress);
                        const lastActive = formatLastActive(session.createdAt);
                        const isCurrentSession =
                            session.id === currentSessionId;

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
                                            <Badge
                                                variant="secondary"
                                                className="text-xs"
                                            >
                                                Current
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-muted-foreground text-sm">
                                        {location} • {lastActive}
                                    </p>
                                </div>

                                {!isCurrentSession && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            handleRevokeSession(session.id)
                                        }
                                        className="text-xs"
                                    >
                                        Revoke
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
