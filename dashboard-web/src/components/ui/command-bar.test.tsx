import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { CommandBar } from './command-bar';

describe('CommandBar', () => {
  it('renders the combobox trigger with the required ARIA attributes', () => {
    const html = renderToStaticMarkup(
      <CommandBar placeholder="Analizar URL" controlsId="palette-id" />,
    );

    expect(html).toContain('role="combobox"');
    expect(html).toContain('aria-controls="palette-id"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toContain('Analizar URL');
  });
});
