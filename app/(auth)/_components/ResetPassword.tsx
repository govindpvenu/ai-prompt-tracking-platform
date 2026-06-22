'use client';
import * as z from 'zod';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Controller, useForm } from 'react-hook-form';
import { Password } from '@/components/password';
import { authClient } from '@/lib/auth-client';
import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui/spinner';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';

const formSchema = z
    .object({
        new_password: z
            .string()
            .min(8, { message: 'Password must be at least 8 characters' }),
        confirm_password: z
            .string()
            .min(8, { message: 'Password must be at least 8 characters' }),
    })
    .refine((data) => data.new_password === data.confirm_password, {
        message: 'Passwords do not match',
        path: ['confirm_password'], // 👈 error will show up at confirm_password field
    });

export function ResetPasswordForm({ token }: { token: string }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            new_password: '12345678',
            confirm_password: '12345678',
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        console.log(values);
        console.log('token:', token);

        const { new_password } = values;

        const { data, error } = await authClient.resetPassword(
            {
                newPassword: new_password,
                token,
            },
            {
                onRequest: () => {
                    setIsLoading(true);
                },
                onSuccess: async (ctx) => {
                    console.log('SUCCESSCTX:', ctx);
                    setIsLoading(false);
                    toast.success('Password reset successfully!');
                    router.push('/sign-in');
                },

                onError: async (ctx) => {
                    console.log('ERROR:CTX:', ctx);
                    setIsLoading(false);
                    toast.error(ctx.error.message);
                },
            }
        );

        console.log('data:', data, 'error:', error);
    }

    return (
        <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
        >
            <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Reset your password</h1>
                <p className="text-muted-foreground text-sm text-balance">
                    Enter your new password below.
                </p>
            </div>

            <div className="grid gap-2">
                <div className="grid gap-2">
                    <Controller
                        name="new_password"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor={field.name}>
                                    New Password *
                                </FieldLabel>
                                <Password
                                    {...field}
                                    id={field.name}
                                    aria-invalid={fieldState.invalid}
                                    placeholder="New Password"
                                />
                                {fieldState.invalid && (
                                    <FieldError errors={[fieldState.error]} />
                                )}
                            </Field>
                        )}
                    />
                </div>

                <div className="grid gap-2">
                    <Controller
                        name="confirm_password"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor={field.name}>
                                    Confirm Password *
                                </FieldLabel>
                                <Password
                                    {...field}
                                    id={field.name}
                                    aria-invalid={fieldState.invalid}
                                    placeholder="Confirm Password"
                                />
                                {fieldState.invalid && (
                                    <FieldError errors={[fieldState.error]} />
                                )}
                            </Field>
                        )}
                    />
                </div>

                <Button disabled={isLoading} className="rounded-lg" size="sm">
                    {isLoading ? <Spinner /> : 'Reset Password'}
                </Button>
            </div>
        </form>
    );
}
