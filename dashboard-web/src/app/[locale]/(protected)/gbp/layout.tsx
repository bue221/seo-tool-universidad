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
      <nav className="flex gap-4 text-sm">
        {tabs.map((tab) => (
          <Link key={tab.href} href={tab.href} className="underline">
            {tab.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
