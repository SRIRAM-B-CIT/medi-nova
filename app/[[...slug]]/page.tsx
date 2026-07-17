'use client';

import dynamic from 'next/dynamic';

const MediNovaApp = dynamic(() => import('@/NextApp'), {
  ssr: false,
  loading: () => (
    <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
      Loading MediNova…
    </main>
  ),
});

export default function Page() {
  return <MediNovaApp />;
}
