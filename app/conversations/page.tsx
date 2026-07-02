"use client";

/** Conversation Browser — one row per thread, from GET /api/traces/sessions. */

import { useMemo } from "react";
import {
  Box,
  Button,
  Flex,
  Heading,
  Link as ChakraLink,
  Table,
  Text,
} from "@chakra-ui/react";
import {
  ArrowSquareOutIcon,
  DownloadSimpleIcon,
  RocketLaunchIcon,
} from "@phosphor-icons/react";
import { AuthGate } from "@/components/AuthGate";
import { AppShell } from "@/components/AppShell";
import { FiltersBar } from "@/components/FiltersBar";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { useFiltersStore } from "@/stores/filtersStore";
import { useSessionsStore } from "@/stores/dataStores";
import { fetchSessions } from "@/lib/api/zeno";
import { keepUserId } from "@/lib/filters";
import { baseThreadUrl } from "@/lib/config";
import { downloadText, toCsv } from "@/lib/csv";
import { formatCount, formatReportDate, snippet } from "@/lib/format";

function formatTimestamp(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 19).replace("T", " ");
}

function ConversationsView() {
  const { startDate, endDate, environment, excludeInternal } = useFiltersStore();
  const store = useSessionsStore();

  async function handleFetch() {
    store.start();
    try {
      const sessions = await fetchSessions(
        {
          startDate,
          endDate,
          environment: environment === "all" ? undefined : environment,
        },
        { onProgress: (fetched) => store.setProgress(fetched) }
      );
      store.succeed(sessions);
    } catch (error) {
      store.fail(error instanceof Error ? error.message : String(error));
    }
  }

  const threadUrl = baseThreadUrl(environment);
  const rows = useMemo(
    () =>
      store.sessions
        .filter(
          (s) =>
            keepUserId(s.userId, { excludeInternal }) &&
            (environment === "all" || s.environment === environment)
        )
        .map((s) => ({
          sessionId: s.sessionId,
          firstTimestamp: s.firstTimestamp,
          lastTimestamp: s.lastTimestamp,
          turnCount: s.turnCount,
          promptSnippet: snippet(s.firstPrompt, 120),
          url: `${threadUrl}/${s.sessionId}`,
        })),
    [store.sessions, excludeInternal, environment, threadUrl]
  );

  function handleDownloadCsv() {
    downloadText(
      toCsv(
        rows.map(({ firstTimestamp, lastTimestamp, turnCount, promptSnippet, url }) => ({
          first_timestamp: firstTimestamp,
          last_timestamp: lastTimestamp,
          turn_count: turnCount,
          prompt_snippet: promptSnippet,
          url,
        }))
      ),
      "gnw_session_urls.csv"
    );
  }

  return (
    <Flex direction="column" gap={5}>
      <Box>
        <Heading size="lg">🔗 Conversation Browser</Heading>
        <Text color="fg.muted" fontSize="sm" mt={1}>
          List conversation threads (one row per session, deduped server-side by the
          Zeno API) with their first prompt and turn count, then export them to CSV ·{" "}
          {formatReportDate(startDate)} → {formatReportDate(endDate)}
        </Text>
      </Box>

      <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="lg" p={4}>
        <FiltersBar />
        <Flex gap={3} mt={4}>
          <Button
            size="sm"
            colorPalette="primary"
            onClick={handleFetch}
            loading={store.status === "loading"}
            loadingText={`Fetching… ${formatCount(store.progress)} sessions`}
          >
            <RocketLaunchIcon />
            Fetch sessions
          </Button>
          {rows.length ? (
            <Button size="sm" variant="outline" onClick={handleDownloadCsv}>
              <DownloadSimpleIcon />
              Download CSV
            </Button>
          ) : null}
        </Flex>
      </Box>

      {store.status === "error" && store.error ? (
        <InlineAlert status="error" title="Session fetch failed" message={store.error} />
      ) : null}

      {store.status !== "loaded" ? (
        <InlineAlert
          status="info"
          message="This page turns Zeno-API sessions into a list of unique conversation links that open the GNW Threads UI. Set the date range / environment above, then click “Fetch sessions”."
        />
      ) : rows.length === 0 ? (
        <InlineAlert status="warning" message="No sessions found for the selected window/filters." />
      ) : (
        <Box>
          <Text fontWeight="semibold" mb={2}>
            {formatCount(rows.length)} unique conversation threads
          </Text>
          <Box
            bg="bg.panel"
            borderWidth="1px"
            borderColor="border"
            borderRadius="lg"
            overflowX="auto"
          >
            <Table.Root size="sm" striped>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>First timestamp</Table.ColumnHeader>
                  <Table.ColumnHeader>Last timestamp</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="right">Turns</Table.ColumnHeader>
                  <Table.ColumnHeader>First prompt</Table.ColumnHeader>
                  <Table.ColumnHeader>Link</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {rows.map((row) => (
                  <Table.Row key={row.sessionId}>
                    <Table.Cell fontFamily="mono" fontSize="xs" whiteSpace="nowrap">
                      {formatTimestamp(row.firstTimestamp)}
                    </Table.Cell>
                    <Table.Cell fontFamily="mono" fontSize="xs" whiteSpace="nowrap">
                      {formatTimestamp(row.lastTimestamp)}
                    </Table.Cell>
                    <Table.Cell textAlign="right">{row.turnCount}</Table.Cell>
                    <Table.Cell>
                      <Text fontSize="sm" lineClamp={2}>
                        {row.promptSnippet}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <ChakraLink
                        href={row.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        color="fg.link"
                        fontSize="sm"
                        whiteSpace="nowrap"
                      >
                        Open <ArrowSquareOutIcon />
                      </ChakraLink>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Box>
        </Box>
      )}
    </Flex>
  );
}

export default function ConversationsPage() {
  return (
    <AuthGate>
      <AppShell>
        <ConversationsView />
      </AppShell>
    </AuthGate>
  );
}
