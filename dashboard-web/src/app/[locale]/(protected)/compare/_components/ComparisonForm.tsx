'use client';

import { Loader2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { runComparison } from '../_actions/run-comparison';
import type { ComparisonResult } from '../_lib/types';

interface ComparisonFormProps {
  onResult: (result: ComparisonResult) => void;
  labels: {
    yours: string;
    competitor: string;
    submit: string;
    submitting: string;
    errorInvalid: string;
    errorDuplicate: string;
    errorUnauthorized: string;
  };
}

/**
 * Client form for the compare flow. State is local — we don't bother
 * with react-hook-form because there are only 4 inputs and validation
 * is delegated to the server action's zod schema.
 *
 * On submit we surface the result via a callback so the parent page
 * can render the comparison panels without round-tripping through
 * Supabase (this flow is intentionally non-persistent).
 */
export function ComparisonForm({ onResult, labels }: ComparisonFormProps) {
  const [yours, setYours] = useState('');
  const [comp1, setComp1] = useState('');
  const [comp2, setComp2] = useState('');
  const [comp3, setComp3] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const competitors = [comp1, comp2, comp3].map((s) => s.trim()).filter(Boolean);
    if (!yours.trim() || competitors.length === 0) {
      setError(labels.errorInvalid);
      return;
    }
    startTransition(async () => {
      const res = await runComparison({ yours: yours.trim(), competitors });
      if (!res.ok) {
        if (res.code === 'DUPLICATE_URLS') setError(labels.errorDuplicate);
        else if (res.code === 'UNAUTHORIZED') setError(labels.errorUnauthorized);
        else setError(labels.errorInvalid);
        return;
      }
      onResult(res.data);
    });
  };

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={submit} className="space-y-3">
          <Field id="yours" label={labels.yours} value={yours} onChange={setYours} required disabled={pending} />
          <Field id="comp1" label={`${labels.competitor} 1`} value={comp1} onChange={setComp1} required disabled={pending} />
          <Field id="comp2" label={`${labels.competitor} 2`} value={comp2} onChange={setComp2} disabled={pending} />
          <Field id="comp3" label={`${labels.competitor} 3`} value={comp3} onChange={setComp3} disabled={pending} />

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button type="submit" disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {labels.submitting}
              </>
            ) : (
              labels.submit
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  required,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}{required ? ' *' : ''}</Label>
      <Input
        id={id}
        type="url"
        inputMode="url"
        placeholder="https://example.com"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
    </div>
  );
}
