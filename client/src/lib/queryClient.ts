import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  url: string,
  options: RequestInit = {},
): Promise<any> {
  // Security: Validate URL
  if (!url.startsWith('/api/')) {
    throw new Error('Invalid API endpoint');
  }
  
  const defaultOptions: RequestInit = {
    credentials: "include",
    headers: {
      'X-Requested-With': 'XMLHttpRequest', // CSRF protection
      ...options.headers,
    },
  };

  // Only set Content-Type for non-FormData
  if (options.body && !(options.body instanceof FormData)) {
    (defaultOptions.headers as Record<string, string>)['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    ...defaultOptions,
    ...options,
  });

  await throwIfResNotOk(res);
  return await res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
