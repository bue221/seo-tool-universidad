import { env } from '@/lib/env';

/**
 * Server component que inyecta un `<script type="application/ld+json">`.
 * Acepta cualquier shape de schema.org y lo serializa.
 *
 * Por qué dangerouslySetInnerHTML:
 *   - JSON-LD se inyecta como texto puro dentro de un <script>; React no
 *     debe escapar el JSON o se rompe.
 *   - El contenido viene de objetos TS controlados (no input de usuario),
 *     por lo que el riesgo de XSS es nulo.
 */
type JsonLdProps = {
  schema: Record<string, unknown> | Record<string, unknown>[];
};

export function JsonLd({ schema }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Factory de schemas base reutilizables. Vivir cerca del componente facilita
 * mantener consistencia (mismo url, mismo name) entre Organization y WebSite.
 */
export function buildSiteSchemas(opts: { name?: string } = {}) {
  const name = opts.name ?? 'SEO Custom Tool';
  const url = env.NEXT_PUBLIC_SITE_URL;

  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
    logo: `${url}/icon`,
  };

  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url,
    inLanguage: ['es', 'en'],
  };

  return [organization, website];
}

/**
 * Helper para schemas BreadcrumbList. Útil en páginas con jerarquía visible.
 *
 *   buildBreadcrumb([
 *     { name: 'Home', url: 'https://...' },
 *     { name: 'Auditoría', url: 'https://.../audit' },
 *   ])
 */
export function buildBreadcrumb(
  items: { name: string; url: string }[],
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
