'use client';

import { useRouter } from 'next/navigation';
import { GradientBackground } from '@/components/ui/gradient-background';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <GradientBackground>
      <div className="max-w-md mx-auto text-center p-8">
        <div className="flex justify-center mb-6">
          <AlertTriangle className="h-16 w-16 text-red-500" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>

        <p className="text-slate-300 mb-8">
          You don't have permission to access this page. Please contact your
          administrator if you believe this is an error.
        </p>

        <div className="space-y-4">
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="w-full"
          >
            Go Back
          </Button>

          <Button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    </GradientBackground>
  );
}
