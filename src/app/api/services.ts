'use server';

import { cookies } from 'next/headers';

export async function getBacktest(id: string) {
  const cookieStore = cookies();
  const res = await fetch(
    `${process.env.NEXTAUTH_URL}/api/backtest?id=${encodeURIComponent(id)}`,
    {
      headers: {
        Cookie: cookieStore.toString(),
      },
      cache: 'no-store',
      next: { revalidate: 0 },
    }
  );
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.found) return null;
  console.log('data', data);
  return data.pair;
}
