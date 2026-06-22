import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Password } from '@/components/password';
import { Shield, Key } from 'lucide-react';

export default function SecuritySettings() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Security Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Two-Factor Authentication Section */}
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h3 className="text-lg font-semibold">
                            Two-Factor Authentication
                        </h3>
                        <p className="text-muted-foreground text-sm">
                            Add an extra layer of security to your account
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        className="flex items-center gap-2"
                    >
                        <Shield className="h-4 w-4" />
                        Enable
                    </Button>
                </div>

                {/* Password Section */}
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h3 className="text-lg font-semibold">Password</h3>
                        <p className="text-muted-foreground text-sm">
                            Last changed 3 months ago
                        </p>
                    </div>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="outline"
                                className="flex items-center gap-2"
                            >
                                <Key className="h-4 w-4" />
                                Change
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    Change Password
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    Change your password
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <form className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="current-password">
                                        Current Password
                                    </Label>
                                    <Password
                                        id="current-password"
                                        placeholder="Password"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="new-password">
                                        New Password
                                    </Label>
                                    <Password
                                        id="new-password"
                                        placeholder="New Password"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirm-password">
                                        Confirm Password
                                    </Label>
                                    <Password
                                        id="confirm-password"
                                        placeholder="Confirm Password"
                                    />
                                </div>
                                <div className="flex items-center gap-3 pt-1">
                                    <Checkbox id="logout-others" />
                                    <Label
                                        htmlFor="logout-others"
                                        className="font-normal"
                                    >
                                        Sign out from other devices
                                    </Label>
                                </div>
                            </form>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction>
                                    Change Password
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </CardContent>
        </Card>
    );
}
