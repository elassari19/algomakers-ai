'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function HeroAuthButtons() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="space-y-4 md:space-y-0 md:space-x-4 flex flex-col md:flex-row items-center justify-center">
        <div className="w-5/6 md:w-1/4 h-12 bg-zinc-700 animate-pulse rounded"></div>
        <div className="w-5/6 md:w-1/4 h-12 bg-zinc-700 animate-pulse rounded"></div>
      </div>
    );
  }

  if (session?.user) {
    return (
      <div className="space-y-4 md:space-y-0 md:space-x-4 flex flex-col md:flex-row items-center justify-center">
        <Button
          asChild
          className="w-5/6 md:w-1/4 font-bold group/arrow bg-gradient-to-r from-pink-600 to-purple-400 hover:from-pink-700 hover:to-purple-500 text-white"
        >
          <Link href="/dashboard">
            Go to Dashboard
            <ArrowRight className="size-5 ml-2 group-hover/arrow:translate-x-1 transition-transform" />
          </Link>
        </Button>

        <Button
          asChild
          variant="outline"
          className="w-5/6 md:w-1/4 font-bold border-zinc-700 text-zinc-300 hover:bg-zinc-800"
        >
          <Link href="/profile">View Profile</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-0 md:space-x-4 flex flex-col md:flex-row items-center justify-center">
      <Button
        asChild
        className="w-5/6 md:w-1/4 font-bold group/arrow bg-gradient-to-r from-pink-600 to-purple-400 hover:from-pink-700 hover:to-purple-500 text-white"
      >
        <Link href="/signup">
          Start Trading
          <ArrowRight className="size-5 ml-2 group-hover/arrow:translate-x-1 transition-transform" />
        </Link>
      </Button>

      <Button
        asChild
        variant="outline"
        className="w-5/6 md:w-1/4 font-bold border-zinc-700 text-zinc-300 hover:bg-zinc-800"
      >
        <Link href="/pricing">View Pricing</Link>
      </Button>
    </div>
  );
}
