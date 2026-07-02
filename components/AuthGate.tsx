"use client";

/**
 * Superuser gate. Bootstraps the session from the stored Resource Watch token
 * (mirrors GNW's AuthBootstrapper) and only renders children for superusers.
 * The Zeno API enforces the same restriction server-side — this gate is UX.
 */

import { ReactNode, useEffect } from "react";
import { Box, Button, Center, Heading, Spinner, Text, VStack } from "@chakra-ui/react";
import { useAuthStore } from "@/stores/authStore";
import { clearToken, getLoginUrl, getToken, isTokenExpired } from "@/lib/auth/token";
import { fetchCurrentUser } from "@/lib/api/users";
import { ApiError } from "@/lib/api/http";

export function AuthGate({ children }: { readonly children: ReactNode }) {
  const { status, user, error, setLoading, setSignedOut, setUser } = useAuthStore();

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const token = getToken();
      if (!token) {
        setSignedOut();
        return;
      }
      if (isTokenExpired(token)) {
        clearToken();
        setSignedOut("Your session has expired — please sign in again.");
        return;
      }
      setLoading();
      try {
        const currentUser = await fetchCurrentUser();
        if (!cancelled) setUser(currentUser);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          clearToken();
          setSignedOut("Your session is no longer valid — please sign in again.");
        } else {
          setSignedOut(
            err instanceof Error ? err.message : "Could not load your profile."
          );
        }
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [setLoading, setSignedOut, setUser]);

  if (status === "loading") {
    return (
      <Center minH="100vh">
        <VStack gap={3}>
          <Spinner size="lg" color="primary.solid" />
          <Text color="fg.muted">Checking your session…</Text>
        </VStack>
      </Center>
    );
  }

  if (status === "signed-out") {
    return (
      <GateScreen
        title="GNW Trace Analytics"
        body={
          error ??
          "Sign in with your Global Nature Watch account to continue. Access is limited to superusers."
        }
        action={
          <Button
            colorPalette="primary"
            onClick={() => {
              window.location.href = getLoginUrl(window.location.href);
            }}
          >
            Sign in with Resource Watch
          </Button>
        }
      />
    );
  }

  if (status === "unauthorized") {
    return (
      <GateScreen
        title="Superuser access required"
        body={`You are signed in as ${user?.email ?? "an unknown user"}, but this tool is only available to GNW superusers. Ask an administrator to upgrade your account if you believe this is a mistake.`}
        action={
          <Button
            variant="outline"
            onClick={() => {
              clearToken();
              window.location.reload();
            }}
          >
            Sign out
          </Button>
        }
      />
    );
  }

  return <>{children}</>;
}

function GateScreen({
  title,
  body,
  action,
}: {
  readonly title: string;
  readonly body: string;
  readonly action: ReactNode;
}) {
  return (
    <Center minH="100vh" bg="bg.subtle" px={4}>
      <Box
        bg="bg.panel"
        borderWidth="1px"
        borderColor="border"
        borderRadius="xl"
        p={10}
        maxW="md"
        textAlign="center"
      >
        <VStack gap={4}>
          <Heading size="lg" color="primary.fg">
            {title}
          </Heading>
          <Text color="fg.muted">{body}</Text>
          {action}
        </VStack>
      </Box>
    </Center>
  );
}
