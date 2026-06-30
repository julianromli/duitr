import { isNeonProvider } from '@/lib/database-provider';

function requireNeonEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. Set it in .env when VITE_DATABASE_PROVIDER=neon.`,
    );
  }
  return value;
}

type NeonModule = typeof import('@neondatabase/neon-js');
type NeonClient = ReturnType<NeonModule['createClient']>;

let neonClient: NeonClient | null = null;
let neonModulePromise: Promise<NeonModule> | null = null;

function loadNeonModule(): Promise<NeonModule> {
  if (!neonModulePromise) {
    neonModulePromise = import('@neondatabase/neon-js');
  }
  return neonModulePromise;
}

export async function createNeonClient(): Promise<NeonClient> {
  const { createClient, SupabaseAuthAdapter } = await loadNeonModule();
  return createClient({
    auth: {
      url: requireNeonEnv('VITE_NEON_AUTH_URL', import.meta.env.VITE_NEON_AUTH_URL),
      adapter: SupabaseAuthAdapter(),
    },
    dataApi: {
      url: requireNeonEnv('VITE_NEON_DATA_API_URL', import.meta.env.VITE_NEON_DATA_API_URL),
    },
  });
}

let neonClientPromise: Promise<NeonClient> | null = null;

export function ensureNeonClient(): Promise<NeonClient> {
  if (neonClient) {
    return Promise.resolve(neonClient);
  }
  if (!neonClientPromise) {
    neonClientPromise = createNeonClient().then((client) => {
      neonClient = client;
      return client;
    });
  }
  return neonClientPromise;
}

/** Browser-only sync accessor — throws during SSR or before init. */
export function getNeonClient(): NeonClient {
  if (import.meta.env.SSR) {
    throw new Error('Neon client is not available during SSR');
  }
  if (!neonClient) {
    throw new Error('Neon client not initialized. Call ensureNeonClient() first.');
  }
  return neonClient;
}

/** Eagerly init on the client so sync getNeonClient() works for existing call sites. */
export function bootstrapNeonClientOnClient(): void {
  if (import.meta.env.SSR || !isNeonProvider() || neonClient || neonClientPromise) {
    return;
  }
  void ensureNeonClient();
}
