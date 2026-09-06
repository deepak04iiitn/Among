import type { Metadata } from 'next';

interface PostPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Experience ${id}`,
    robots: { index: true, follow: true },
  };
}

/**
 * Post detail page — Phase 4.
 * Full post with reaction bar + response thread.
 */
export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params;
  return (
    <div className="content-column py-10">
      <h1 className="sr-only">Experience {id}</h1>
      <p className="font-editorial text-title text-[var(--color-text-muted)]">
        Post detail — coming in Phase 4.
      </p>
    </div>
  );
}
