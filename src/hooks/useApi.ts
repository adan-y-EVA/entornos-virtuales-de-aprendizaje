'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; meta?: Record<string, unknown> };

interface CallOptions {
  method?: string;
  body?: unknown;
  headers?: HeadersInit;
  silent?: boolean;
}

export function useApi() {
  const [loading, setLoading] = useState(false);

  const call = useCallback(async <T,>(
    url: string,
    options: CallOptions = {},
  ): Promise<ApiResult<T> | null> => {
    const { method = 'GET', body, headers, silent = false } = options;
    setLoading(true);
    try {
      const esFormData = typeof FormData !== 'undefined' && body instanceof FormData;
      const init: RequestInit = {
        method,
        headers:
          body === undefined || esFormData
            ? headers
            : { 'Content-Type': 'application/json', ...headers },
        body:
          body === undefined ? undefined : esFormData ? (body as FormData) : JSON.stringify(body),
      };

      const res = await fetch(url, init);
      const json = (await res.json().catch(() => null)) as ApiResult<T> | null;

      if (!json) {
        if (!silent) toast.error('Respuesta inválida del servidor.');
        return null;
      }
      if (!json.ok && !silent) toast.error(json.error);
      return json;
    } catch {
      if (!silent) toast.error('No se pudo conectar con el servidor.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { call, loading };
}
