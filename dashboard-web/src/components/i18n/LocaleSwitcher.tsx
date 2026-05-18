'use client';

import { useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';

/**
 * Selector de idioma segmentado.
 *
 * Importante:
 *  - `usePathname`/`useRouter` se importan desde `@/i18n/navigation`,
 *    NO desde `next/navigation`. Eso garantiza que las URLs respeten
 *    el `localePrefix: 'as-needed'` del routing.
 *  - `useTransition` evita que el botón se sienta congelado mientras
 *    Next re-renderiza el árbol con el nuevo locale.
 */
export function LocaleSwitcher() {
  const t = useTranslations('Common');
  const active = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function switchTo(next: string) {
    if (!next || next === active) return;
    startTransition(() => {
      router.replace(pathname, { locale: next as Locale });
    });
  }

  const labelFor: Record<Locale, string> = {
    es: t('switchToSpanish'),
    en: t('switchToEnglish'),
  };

  return (
    <ToggleGroup
      type="single"
      size="sm"
      value={active}
      onValueChange={switchTo}
      disabled={isPending}
      aria-label="Locale"
      className={isPending ? 'opacity-60' : undefined}
    >
      {routing.locales.map((locale) => (
        <ToggleGroupItem
          key={locale}
          value={locale}
          aria-label={labelFor[locale]}
          title={labelFor[locale]}
          className="text-xs font-semibold uppercase tracking-wide"
        >
          {locale}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
