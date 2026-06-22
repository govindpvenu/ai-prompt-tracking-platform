import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Bell, Palette, Fingerprint, Shield } from 'lucide-react';
import ProfileDetails from './_components/ProfileDetails';
import { ConnectedAccounts } from './_components/ConnectedAccounts';
import SecuritySettings from './_components/SecuritySettings';
import ActiveSessions from './_components/ActiveSessions';
import ChangeAvatar from './_components/ChangeAvatar';
import AccountInfo from './_components/AccountInfo';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export default async function SettingsPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    console.log('session:', session);

    if (!session) {
        return null;
    }
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

                <Tabs defaultValue="profile" className="w-full">
                    {/* Tabs Navigation */}
                    <TabsList className="mb-8 grid w-full grid-cols-5">
                        <TabsTrigger
                            value="profile"
                            className="flex items-center gap-2"
                        >
                            <User className="h-4 w-4" />
                            Profile
                        </TabsTrigger>
                        <TabsTrigger
                            value="account"
                            className="flex items-center gap-2"
                        >
                            <Fingerprint className="h-4 w-4" />
                            Account
                        </TabsTrigger>
                        <TabsTrigger
                            value="security"
                            className="flex items-center gap-2"
                        >
                            <Shield className="h-4 w-4" />
                            Security
                        </TabsTrigger>
                        <TabsTrigger
                            value="appearance"
                            className="flex items-center gap-2"
                        >
                            <Palette className="h-4 w-4" />
                            Appearance
                        </TabsTrigger>
                        <TabsTrigger
                            value="notifications"
                            className="flex items-center gap-2"
                        >
                            <Bell className="h-4 w-4" />
                            Notifications
                        </TabsTrigger>
                    </TabsList>

                    {/* Profile Tab Content */}
                    <TabsContent value="profile" className="space-y-6">
                        <ProfileDetails user={session?.user} />
                        <AccountInfo user={session?.user} />
                    </TabsContent>

                    {/* Account Tab Content */}
                    <TabsContent value="account" className="space-y-6">
                        <ConnectedAccounts />
                    </TabsContent>

                    {/* Security Tab Content */}
                    <TabsContent value="security" className="space-y-6">
                        <SecuritySettings />
                        <ActiveSessions />
                    </TabsContent>

                    {/* Appearance Tab Content */}
                    <TabsContent value="appearance">
                        <Card>
                            <CardHeader>
                                <CardTitle>Appearance Preferences</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    Appearance preferences will be implemented
                                    here.
                                </p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Notifications Tab Content */}
                    <TabsContent value="notifications">
                        <Card>
                            <CardHeader>
                                <CardTitle>Notification Preferences</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    Notification preferences will be implemented
                                    here.
                                </p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
