// Twitter Card "summary_large_image" usa el mismo aspect ratio que OG (1200x630).
// Reutilizamos la misma generación — si en el futuro queremos copy distinto
// (handle, hashtag, etc.) acá se diverge.
export { default, alt, size, contentType } from './opengraph-image';
