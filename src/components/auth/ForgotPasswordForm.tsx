'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordFormProps {
  onBack?: () => void;
  onSuccess?: (email: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

export function ForgotPasswordForm({
  onBack,
  onSuccess,
  onError,
  className,
}: ForgotPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      });

      if (!response.ok) {
        const error = await response.text();
        onError?.(error || 'Failed to send reset email');
        return;
      }

      setSubmittedEmail(data.email);
      setIsSubmitted(true);
      onSuccess?.(data.email);
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!submittedEmail) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: submittedEmail }),
      });

      if (!response.ok) {
        const error = await response.text();
        onError?.(error || 'Failed to resend email');
      }
    } catch (error) {
      onError?.(
        error instanceof Error ? error.message : 'Failed to resend email'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className={className}>
        <CardHeader className="text-center space-y-2 p-0 pb-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20">
            <CheckCircle className="h-6 w-6 text-green-400" />
          </div>
          <CardTitle className="text-2xl text-white">
            Check your email
          </CardTitle>
          <CardDescription className="text-slate-400">
            We've sent a new temporary password to{' '}
            <span className="font-medium text-white">{submittedEmail}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-0">
          <Alert className="border-blue-500/20 bg-blue-500/10">
            <AlertDescription className="text-blue-400">
              Please check your email for the new temporary password. Sign in
              with it immediately and change your password in account settings
              for security.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full bg-slate-800/50 border-slate-600 text-white hover:bg-slate-700/50"
              onClick={handleResend}
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send new password'}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full text-slate-400 hover:text-white hover:bg-slate-800/50"
              onClick={onBack}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to sign in
            </Button>
          </div>

          <div className="text-center text-sm text-slate-400">
            <p>
              If you continue to have problems, please{' '}
              <a
                href="/contact"
                className="text-blue-400 hover:text-blue-300 hover:underline"
              >
                contact support
              </a>
              .
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="space-y-1 p-0 pb-6">
        <CardTitle className="text-2xl text-center text-white">
          Forgot password?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-200">
                    Email address
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Enter your email address"
                        className="pl-10 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
                        type="email"
                        autoComplete="email"
                        {...field}
                        disabled={isLoading}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-2.5 transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? 'Sending new password...' : 'Send new password'}
            </Button>
          </form>
        </Form>

        <div className="text-center">
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            disabled={isLoading}
            className="text-slate-400 hover:text-white hover:bg-slate-800/50"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to sign in
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default ForgotPasswordForm;
