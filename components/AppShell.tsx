"use client";

/** Two-column shell with GNW-style sidebar navigation. */

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, Button, Flex, Heading, Separator, Text, VStack } from "@chakra-ui/react";
import {
  ChartBarIcon,
  ChatsCircleIcon,
  MagnifyingGlassIcon,
  SignOutIcon,
} from "@phosphor-icons/react";
import { useAuthStore } from "@/stores/authStore";
import { clearToken, getLogoutUrl } from "@/lib/auth/token";

const NAV_ITEMS = [
  { href: "/analytics", label: "Analytics", icon: ChartBarIcon },
  { href: "/traces", label: "Trace Explorer", icon: MagnifyingGlassIcon },
  { href: "/conversations", label: "Conversation Browser", icon: ChatsCircleIcon },
] as const;

export function AppShell({ children }: { readonly children: ReactNode }) {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);

  function handleLogout() {
    const logoutUrl = getLogoutUrl();
    clearToken();
    window.location.href = logoutUrl;
  }

  return (
    <Flex minH="100vh" bg="bg.subtle">
      <Flex
        as="nav"
        direction="column"
        w="240px"
        flexShrink={0}
        bg="bg.panel"
        borderRightWidth="1px"
        borderColor="border"
        p={4}
        position="sticky"
        top={0}
        h="100vh"
      >
        <Box mb={6}>
          <Heading size="md" color="primary.fg" lineHeight="short">
            Global Nature Watch
          </Heading>
          <Text fontSize="sm" color="fg.muted">
            Trace Analytics
          </Text>
        </Box>

        <VStack align="stretch" gap={1}>
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname?.startsWith(href);
            return (
              <Button
                key={href}
                asChild
                variant="ghost"
                justifyContent="flex-start"
                bg={active ? "primary.subtle" : undefined}
                color={active ? "primary.fg" : "fg"}
                fontWeight={active ? "semibold" : "normal"}
              >
                <Link href={href}>
                  <Icon />
                  {label}
                </Link>
              </Button>
            );
          })}
        </VStack>

        <Box flex="1" />

        <Separator mb={3} />
        <Text fontSize="xs" color="fg.muted" mb={2} lineClamp={1} title={user?.email}>
          {user?.email ?? ""}
        </Text>
        <Button size="sm" variant="outline" onClick={handleLogout}>
          <SignOutIcon />
          Log out
        </Button>
      </Flex>

      <Box flex="1" minW={0} p={{ base: 4, lg: 8 }}>
        {children}
      </Box>
    </Flex>
  );
}
