'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { CheckCircle } from 'lucide-react';

import { AuthForm } from '@/components/auth/AuthForm';

export default function SignUpPage() {
  const router = useRouter();
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSuccess = () => {
    setIsSuccess(true);
    // Auto redirect to signin after successful signup
    setTimeout(() => {
      router.push('/auth/signin');
    }, 2000);
  };

  const handleError = (error: string) => {
    setError(error);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex">
        {/* Left side - Illuminated image */}
        <div className="hidden lg:flex lg:w-[55%] relative rounded-tr-3xl rounded-br-3xl overflow-hidden">
          <Image
            src="/illuminated.png"
            alt="Markets illuminated"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Right side - Success message */}
        <div className="w-full lg:w-[45%] bg-black flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-md space-y-8 text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                Account created!
              </h1>
              <p className="mt-2 text-slate-400">
                Welcome to AlgoMarkers. Redirecting to sign in...
              </p>
            </div>
            <div className="flex justify-center">
              <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s] mx-1"></div>
              <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Illuminated image */}
      <div className="hidden lg:flex lg:w-[55%] relative rounded-tr-3xl rounded-br-3xl overflow-hidden">
        <Image
          src="/illuminated.png"
          alt="Markets illuminated"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Right side - Sign up form */}
      <div className="w-full lg:w-[45%] bg-black flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          <AuthForm
            mode="signup"
            onSuccess={handleSuccess}
            onError={handleError}
            className="bg-transparent border-0 shadow-none"
          />
        </div>
      </div>
    </div>
  );
}
