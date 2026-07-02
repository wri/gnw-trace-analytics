"use client";

import { useMemo } from "react";
import { Box, Button, Flex, Heading, Link as ChakraLink, Text } from "@chakra-ui/react";
import { ArrowSquareOutIcon, DownloadSimpleIcon } from "@phosphor-icons/react";
import type { TraceDetail } from "@/lib/types";
import {
  currentUserPrompt,
  extractToolCalls,
  findActiveTurnWindow,
  stripNoise,
} from "@/lib/traces/parsing";
import { downloadText } from "@/lib/csv";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { Expander } from "@/components/ui/Expander";
import { StatCards } from "@/components/ui/StatCards";
import { JsonBlock } from "@/components/traces/JsonBlock";
import { ToolCallsView } from "@/components/traces/ToolCallsView";
import { MessagesView } from "@/components/traces/MessagesView";

interface TraceDetailViewProps {
  readonly detail: TraceDetail;
  readonly baseThreadUrl: string;
  readonly hideEmpty: boolean;
  readonly showRaw: boolean;
}

export function TraceDetailView({
  detail,
  baseThreadUrl,
  hideEmpty,
  showRaw,
}: TraceDetailViewProps) {
  const inputMessages = detail.input?.messages ?? [];
  const outputMessages = detail.output?.messages ?? [];

  const prompt = useMemo(() => currentUserPrompt(inputMessages), [inputMessages]);
  const window = useMemo(() => findActiveTurnWindow(outputMessages), [outputMessages]);

  const historyEnd = window.start ?? 0;
  const hasHistory = (window.start ?? 0) > 0;
  const activeStart = window.start ?? 0;

  const historyToolCalls = useMemo(
    () => extractToolCalls(outputMessages, 0, historyEnd),
    [outputMessages, historyEnd]
  );
  const activeToolCalls = useMemo(
    () => extractToolCalls(outputMessages, activeStart, outputMessages.length),
    [outputMessages, activeStart]
  );
  const cleaned = useMemo(() => stripNoise(detail.raw), [detail.raw]);

  function handleDownload() {
    downloadText(
      JSON.stringify(detail.raw, null, 2),
      `trace_${detail.id || "unknown"}.json`,
      "application/json"
    );
  }

  return (
    <Flex direction="column" gap={4}>
      {!detail.rawAvailable ? (
        <InlineAlert
          status="warning"
          message="Raw trace unavailable from Langfuse (purged or unreachable) — showing derived fields only."
        />
      ) : null}

      {detail.sessionId ? (
        <Box>
          <ChakraLink
            href={`${baseThreadUrl}/${detail.sessionId}`}
            target="_blank"
            rel="noopener noreferrer"
            color="fg.link"
            fontSize="sm"
          >
            Open session in GNW <ArrowSquareOutIcon />
          </ChakraLink>
        </Box>
      ) : null}

      <Box>
        <Heading as="h4" size="sm" mb={2}>
          Summary
        </Heading>
        <StatCards
          items={[
            { label: "Environment", value: detail.environment ?? "" },
            {
              label: "Latency (s)",
              value: detail.latencySeconds != null ? detail.latencySeconds.toFixed(2) : "",
            },
            {
              label: "Total cost",
              value: detail.totalCost != null ? `$${detail.totalCost.toFixed(4)}` : "",
            },
            {
              label: "Output messages",
              value: String(outputMessages.length),
            },
          ]}
          columns={4}
        />
      </Box>

      <Box>
        <Heading as="h4" size="sm" mb={2}>
          Input messages
        </Heading>
        {prompt ? (
          <Box
            as="pre"
            fontFamily="mono"
            fontSize="sm"
            bg="bg.subtle"
            borderRadius="md"
            p={3}
            whiteSpace="pre-wrap"
          >
            {prompt}
          </Box>
        ) : (
          <Text fontSize="sm" color="fg.muted">
            No input.messages
          </Text>
        )}
      </Box>

      <Expander title="🛠 Tool calls">
        <Flex direction="column" gap={3}>
          {hasHistory ? (
            <Expander title={`History (tool calls before the active turn)`}>
              <ToolCallsView
                calls={historyToolCalls}
                emptyMessage="No tool calls found in history"
              />
            </Expander>
          ) : null}
          <ToolCallsView
            calls={activeToolCalls}
            emptyMessage="No tool calls found in output.messages"
          />
        </Flex>
      </Expander>

      <Expander title="💬 Output messages">
        <Flex direction="column" gap={3}>
          {hasHistory ? (
            <Expander title="History (messages before the active turn)">
              <MessagesView
                messages={outputMessages.slice(0, historyEnd)}
                indexOffset={0}
                hideEmpty={hideEmpty}
                emptyMessage="No messages in history"
              />
            </Expander>
          ) : null}
          <Text fontSize="xs" color="fg.muted">
            Active window start 👇
          </Text>
          <MessagesView
            messages={outputMessages.slice(activeStart)}
            indexOffset={activeStart}
            hideEmpty={hideEmpty}
            emptyMessage="No output.messages"
          />
        </Flex>
      </Expander>

      <Expander title="🧹 Cleaned trace JSON (noise removed)">
        <JsonBlock value={cleaned} maxHeight="500px" />
      </Expander>

      {showRaw ? (
        <Expander title="🧾 Raw trace JSON" defaultOpen>
          <JsonBlock value={detail.raw} maxHeight="500px" />
        </Expander>
      ) : null}

      <Box>
        <Button size="sm" variant="outline" onClick={handleDownload}>
          <DownloadSimpleIcon />
          Download trace JSON
        </Button>
      </Box>
    </Flex>
  );
}
