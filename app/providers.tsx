"use client";

import { ReactNode } from "react";
import { ChakraProvider } from "@chakra-ui/react";
import { system } from "@/theme";

export function Providers({ children }: { readonly children: ReactNode }) {
  return <ChakraProvider value={system}>{children}</ChakraProvider>;
}
