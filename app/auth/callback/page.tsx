"use client";

/**
 * Resource Watch login callback — mirrors GNW: reads ?token=… from the URL,
 * stores it, and returns to where the user came from.
 */

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Center, Spinner, Text, VStack } from "@chakra-ui/react";
import { setToken } from "@/lib/auth/token";
import { InlineAlert } from "@/components/ui/InlineAlert";

function sameOriginPath(redirect: string | null): string {
  if (!redirect) return "/";
  try {
    const url = new URL(redirect, window.location.origin);
    // Only allow same-origin redirects to avoid open-redirect abuse.
    if (url.origin !== window.location.origin) return "/";
    return `${url.pathname}${url.search}${url.hash}` || "/";
  } catch {
    return "/";
  }
}

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setError("No token was returned by the login flow. Please try signing in again.");
      return;
    }
    setToken(token);
    router.replace(sameOriginPath(searchParams.get("redirect")));
  }, [router, searchParams]);

  if (error) {
    return (
      <Center minH="100vh" px={4}>
        <InlineAlert status="error" title="Sign-in failed" message={error} />
      </Center>
    );
  }

  return (
    <Center minH="100vh">
      <VStack gap={3}>
        <Spinner size="lg" color="primary.solid" />
        <Text color="fg.muted">Completing sign-in…</Text>
      </VStack>
    </Center>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackHandler />
    </Suspense>
  );
}
