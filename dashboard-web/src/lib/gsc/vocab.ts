/**
 * Vocabulary for synthetic query/page generation.
 * Patterns are composed with the domain or topic at render time.
 */

export const BRAND_PATTERNS = [
  '{brand}',
  '{brand} login',
  '{brand} precios',
  '{brand} pricing',
  '{brand} review',
  '{brand} alternativas',
  'qué es {brand}',
  '{brand} opiniones',
  '{brand} app',
  '{brand} api',
] as const;

export const LONGTAIL_PATTERNS = [
  'mejor {topic} para {audience}',
  'best {topic} for {audience}',
  'cómo usar {topic}',
  'how to use {topic}',
  '{topic} vs alternativas',
  '{topic} gratis',
  '{topic} tutorial',
  '{topic} ejemplos',
  '{topic} para principiantes',
  '{topic} avanzado',
  'curso de {topic}',
  '{topic} 2026',
  '{topic} tips',
  '{topic} guía completa',
  'qué es {topic}',
  '{topic} herramientas',
  '{topic} estrategia',
  'aprender {topic}',
  '{topic} {audience}',
  'comparación {topic}',
] as const;

export const TOPICS = [
  'seo',
  'marketing',
  'analytics',
  'ecommerce',
  'saas',
  'agencia',
  'freelance',
  'wordpress',
  'shopify',
  'leads',
  'contenido',
  'branding',
] as const;

export const AUDIENCES = [
  'pymes',
  'startups',
  'agencias',
  'ecommerce',
  'blogs',
  'freelancers',
  'developers',
] as const;

/**
 * Page path templates. Used directly (`/about`) or with a topic slug
 * interpolated (`/blog/{slug}`, `/services/{slug}`).
 */
export const PAGE_PATTERNS = [
  '/',
  '/about',
  '/contact',
  '/pricing',
  '/blog',
  '/blog/{slug}',
  '/services/{slug}',
  '/products/{slug}',
  '/guides/{slug}',
  '/case-studies/{slug}',
  '/integrations/{slug}',
  '/docs/{slug}',
] as const;

export const SLUGS = [
  'getting-started',
  'best-practices',
  'advanced-guide',
  'comparison',
  'roi-calculator',
  'pricing-explained',
  'integrations',
  'migration',
  'security',
  'roadmap',
  'changelog',
  'faq',
  'enterprise',
  'startup-plan',
  'agencies',
] as const;
