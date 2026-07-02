"use client";

/**
 * Two-column shell with GNW-style sidebar navigation and the signature
 * 4px lime top border from the GNW app header.
 */

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  Separator,
  Text,
  VStack,
} from "@chakra-ui/react";
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
  { href: "/conversations", label: "Conversations", icon: ChatsCircleIcon },
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
    <Flex minH="100vh" bg="bg.subtle" borderTop="4px solid" borderTopColor="lime.400">
      <Flex
        as="nav"
        direction="column"
        w="248px"
        flexShrink={0}
        bg="bg.panel"
        borderRightWidth="1px"
        borderColor="border"
        px={3}
        py={4}
        position="sticky"
        top={0}
        h="calc(100vh - 4px)"
      >
        <Box px={2} mb={6}>
          <Heading size="sm" color="neutral.900" lineHeight="short">
            Global Nature Watch
          </Heading>
          <Flex align="center" gap={2} mt={1}>
            <Text fontSize="xs" color="fg.muted">
              Trace Analytics
            </Text>
            <Badge
              bg="#E0E2E5"
              color="#3A4048"
              borderRadius="4px"
              fontSize="9px"
              fontWeight="medium"
              letterSpacing="0.04em"
              px={1.5}
            >
              SUPERUSER
            </Badge>
          </Flex>
        </Box>

        <Text
          fontSize="2xs"
          fontFamily="mono"
          textTransform="uppercase"
          letterSpacing="0.08em"
          color="fg.subtle"
          px={2}
          mb={2}
        >
          Explore
        </Text>
        <VStack align="stretch" gap={0.5}>
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname?.startsWith(href);
            return (
              <Box key={href} position="relative">
                {active ? (
                  <Box
                    position="absolute"
                    left="-3px"
                    top="6px"
                    bottom="6px"
                    w="3px"
                    borderRadius="full"
                    bg="primary.solid"
                  />
                ) : null}
                <Button
                  asChild
                  size="sm"
                  variant="ghost"
                  width="100%"
                  justifyContent="flex-start"
                  bg={active ? "bg.info" : undefined}
                  color={active ? "primary.fg" : "fg.muted"}
                  fontWeight={active ? "semibold" : "normal"}
                >
                  <Link href={href}>
                    <Icon size={16} weight={active ? "fill" : "regular"} />
                    {label}
                  </Link>
                </Button>
              </Box>
            );
          })}
        </VStack>

        <Box flex="1" />

        <Separator mb={3} />
        <Text
          fontSize="2xs"
          fontFamily="mono"
          color="fg.subtle"
          px={2}
          mb={2}
          lineClamp={1}
          title={user?.email}
        >
          {user?.email ?? ""}
        </Text>
        <Button size="xs" variant="outline" onClick={handleLogout}>
          <SignOutIcon size={14} />
          Log out
        </Button>
      </Flex>

      <Box flex="1" minW={0} p={{ base: 4, lg: 6 }} maxW="1560px">
        {children}
      </Box>
    </Flex>
  );
}
