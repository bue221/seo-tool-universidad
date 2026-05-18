import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export default async function LocaleNotFound() {
  // Next.js no provee `params` en archivos not-found.
  // Las traducciones usan el locale activo de la request (resuelto por el middleware).
  const t = await getTranslations('NotFound');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-5xl font-bold tracking-tight">404</h1>
      <h2 className="text-xl font-semibold">{t('title')}</h2>
      <p className="max-w-md text-muted-foreground">{t('description')}</p>
      <Link
        href="/"
        className="mt-4 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
      >
        ← {t('backHome')}
      </Link>
    </main>
  );
}
