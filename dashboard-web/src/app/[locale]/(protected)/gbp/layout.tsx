import { Link } from '@/i18n/navigation';

export default function GbpLayout({ children }: { children: React.ReactNode }) {
  const tabs = [
    { href: '/gbp/profile', label: 'Profile' },
    { href: '/gbp/posts', label: 'Posts' },
    { href: '/gbp/reviews', label: 'Reviews' },
    { href: '/gbp/insights', label: 'Insights' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">GBP Simulator</h1>
        <p className="text-sm text-muted-foreground">Manage your business profile, posts, reviews and insights.</p>
      </div>
      <nav className="flex flex-wrap gap-2 text-sm">
        {tabs.map((tab) => (
          <Link key={tab.href} href={tab.href} className="rounded-md border px-3 py-1.5 hover:bg-muted">
            {tab.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
