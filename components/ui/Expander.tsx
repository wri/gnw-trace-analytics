"use client";

import { ReactNode, useState } from "react";
import { Box, Button } from "@chakra-ui/react";
import { CaretDownIcon, CaretRightIcon } from "@phosphor-icons/react";

interface ExpanderProps {
  readonly title: string;
  readonly defaultOpen?: boolean;
  readonly children: ReactNode;
}

/** Collapsible section (Streamlit st.expander equivalent). */
export function Expander({ title, defaultOpen = false, children }: ExpanderProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Box borderWidth="1px" borderColor="border" borderRadius="md" bg="bg.panel">
      <Button
        variant="ghost"
        size="sm"
        width="100%"
        justifyContent="flex-start"
        fontWeight="medium"
        onClick={() => setOpen((prev) => !prev)}
      >
        {open ? <CaretDownIcon /> : <CaretRightIcon />}
        {title}
      </Button>
      {open ? (
        <Box px={4} pb={4} pt={1}>
          {children}
        </Box>
      ) : null}
    </Box>
  );
}
