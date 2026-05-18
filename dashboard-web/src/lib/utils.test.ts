import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('combina clases simples', () => {
    expect(cn('p-2', 'text-sm')).toBe('p-2 text-sm');
  });

  it('resuelve conflictos de Tailwind (twMerge)', () => {
    // Sin twMerge: 'p-2 p-4' (broken). Con twMerge: 'p-4'.
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('filtra falsy (clsx)', () => {
    expect(cn('a', false, undefined, null, 'b')).toBe('a b');
  });

  it('soporta objetos condicionales', () => {
    expect(cn('base', { 'text-red-500': true, hidden: false })).toBe(
      'base text-red-500',
    );
  });

  it('soporta arrays anidados', () => {
    expect(cn(['p-2', ['text-sm', 'font-bold']])).toBe('p-2 text-sm font-bold');
  });

  it('última clase de tipo "background" gana', () => {
    expect(cn('bg-white', 'bg-red-500')).toBe('bg-red-500');
  });
});
