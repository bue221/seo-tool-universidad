'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { Monitor, Moon, Sun } from 'lucide-react';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

/**
 * Toggle de tema con 3 estados explícitos: light / dark / system.
 *
 * Por qué `mounted`:
 *   next-themes resuelve la preferencia en cliente (localStorage + media query).
 *   En SSR `theme` viene undefined → renderizar el estado activo causa
 *   hydration mismatch. Mostramos el grupo "sin valor" hasta que monte.
 *
 * Por qué `ToggleGroup`:
 *   Radix maneja roving tabindex, navegación con flechas y `data-state="on"`
 *   automáticamente. Cero código a11y manual.
 */
export function ThemeToggle() {
  const t = useTranslations('Theme');
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <ToggleGroup
      type="single"
      size="sm"
      value={mounted ? theme : ''}
      onValueChange={(v) => v && setTheme(v)}
      aria-label={t('label')}
    >
      <ToggleGroupItem value="light" aria-label={t('light')} title={t('light')}>
        <Sun />
      </ToggleGroupItem>
      <ToggleGroupItem value="dark" aria-label={t('dark')} title={t('dark')}>
        <Moon />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="system"
        aria-label={t('system')}
        title={t('system')}
      >
        <Monitor />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
