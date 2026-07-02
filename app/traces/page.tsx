"use client";

/**
 * Trace Explorer — list/filter traces from the Zeno API and inspect a single
 * trace in detail (full conversation comes live from Langfuse). Supports
 * deep links: /traces?session=<id> and /traces?trace=<id> auto-fetch.
 */

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Box,
  Button,
  Checkbox,
  Flex,
  Heading,
  Input,
  NativeSelect,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { RocketLaunchIcon } from "@phosphor-icons/react";
import { AuthGate } from "@/components/AuthGate";
import { AppShell } from "@/components/AppShell";
import { FiltersBar } from "@/components/FiltersBar";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { TraceDetailView } from "@/components/traces/TraceDetailView";
import { useFiltersStore } from "@/stores/filtersStore";
import { useExplorerStore } from "@/stores/dataStores";
import { fetchTraceDetail, fetchTraceList } from "@/lib/api/zeno";
import { baseThreadUrl, EXPLORER_MAX_TRACES } from "@/lib/config";
import { formatCount, formatReportDate, snippet } from "@/lib/format";
import type { TraceListEntry } from "@/lib/types";

function entryLabel(entry: TraceListEntry): string {
  const prompt = snippet(entry.prompt, 80) || "(empty prompt)";
  const ts = (entry.traceTimestamp ?? "").slice(0, 19);
  return ts ? `${ts} · ${prompt}` : prompt;
}

function ExplorerView() {
  const searchParams = useSearchParams();
  const { startDate, endDate, environment } = useFiltersStore();
  const store = useExplorerStore();

  const [sessionIdFilter, setSessionIdFilter] = useState(
    () => searchParams.get("session") ?? ""
  );
  const [traceIdFilter, setTraceIdFilter] = useState(
    () => searchParams.get("trace") ?? ""
  );
  const [promptFilter, setPromptFilter] = useState("");
  const [hideEmpty, setHideEmpty] = useState(true);
  const [showRaw, setShowRaw] = useState(false);
  const autoFetchedRef = useRef(false);

  async function handleFetch(overrides?: { sessionId?: string; traceId?: string }) {
    store.start();
    try {
      const traceId = (overrides?.traceId ?? traceIdFilter).trim();
      const sessionId = (overrides?.sessionId ?? sessionIdFilter).trim();
      if (traceId) {
        // Exact trace id → fetch the single detail directly.
        const detail = await fetchTraceDetail(traceId);
        store.succeed([
          {
            id: detail.id,
            prompt: detail.prompt,
            traceTimestamp: detail.traceTimestamp,
            sessionId: detail.sessionId,
          },
        ]);
        store.cacheDetail(detail);
      } else {
        const entries = await fetchTraceList(
          {
            startDate,
            endDate,
            environment: environment === "all" ? undefined : environment,
            sessionId: sessionId || undefined,
            promptContains: promptFilter.trim() || undefined,
          },
          {
            maxItems: EXPLORER_MAX_TRACES,
            onProgress: (fetched) => store.setProgress(fetched),
          }
        );
        store.succeed(entries);
      }
    } catch (error) {
      store.fail(error instanceof Error ? error.message : String(error));
    }
  }

  // Deep links (?session= / ?trace=) fetch immediately on arrival.
  useEffect(() => {
    if (autoFetchedRef.current) return;
    const session = searchParams.get("session");
    const trace = searchParams.get("trace");
    if (!session && !trace) return;
    autoFetchedRef.current = true;
    void handleFetch({ sessionId: session ?? "", traceId: trace ?? "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const selectedId = store.selectedId;
  const detail = selectedId ? store.detailCache[selectedId] : undefined;

  useEffect(() => {
    if (!selectedId || store.detailCache[selectedId]) return;
    let cancelled = false;

    async function loadDetail() {
      store.startDetail();
      try {
        const fetched = await fetchTraceDetail(selectedId as string);
        if (!cancelled) store.cacheDetail(fetched);
      } catch (error) {
        if (!cancelled) {
          store.failDetail(error instanceof Error ? error.message : String(error));
        }
      }
    }

    void loadDetail();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  return (
    <Flex direction="column" gap={5}>
      <Box>
        <Heading size="lg">🔎 Trace Explorer</Heading>
        <Text color="fg.muted" fontSize="sm" mt={1}>
          Inspect individual traces: the current user turn, assistant output, tool
          calls, metadata and raw JSON. Traces are listed on demand from the Zeno API
          (full conversation comes live from Langfuse) ·{" "}
          {formatReportDate(startDate)} → {formatReportDate(endDate)}
        </Text>
      </Box>

      <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="lg" p={4}>
        <FiltersBar showExcludeInternal={false} />
        <Flex gap={4} mt={4} wrap="wrap" align="flex-end">
          <Box>
            <Text fontSize="xs" color="fg.muted" mb={1}>
              Session id
            </Text>
            <Input
              size="sm"
              width="220px"
              placeholder="exact session id"
              value={sessionIdFilter}
              onChange={(e) => setSessionIdFilter(e.currentTarget.value)}
            />
          </Box>
          <Box>
            <Text fontSize="xs" color="fg.muted" mb={1}>
              Trace id
            </Text>
            <Input
              size="sm"
              width="220px"
              placeholder="exact trace id (fetches directly)"
              value={traceIdFilter}
              onChange={(e) => setTraceIdFilter(e.currentTarget.value)}
            />
          </Box>
          <Box>
            <Text fontSize="xs" color="fg.muted" mb={1}>
              Prompt contains
            </Text>
            <Input
              size="sm"
              width="220px"
              placeholder="substring…"
              value={promptFilter}
              onChange={(e) => setPromptFilter(e.currentTarget.value)}
            />
          </Box>
          <Button
            size="sm"
            colorPalette="primary"
            onClick={() => handleFetch()}
            loading={store.status === "loading"}
            loadingText={`Fetching… ${formatCount(store.progress)}`}
          >
            <RocketLaunchIcon />
            Fetch matching traces
          </Button>
        </Flex>
      </Box>

      {store.status === "error" && store.error ? (
        <InlineAlert status="error" title="Trace fetch failed" message={store.error} />
      ) : null}

      {store.status !== "loaded" ? (
        <InlineAlert
          status="info"
          message="Set the date range / filters above, then click “Fetch matching traces”. Provide an exact Trace id to open a single trace directly."
        />
      ) : !store.entries.length ? (
        <InlineAlert status="warning" message="No traces matched the selected window/filters." />
      ) : (
        <>
          <Flex gap={4} wrap="wrap" align="flex-end">
            <Box flex="1" minW="320px">
              <Text fontSize="xs" color="fg.muted" mb={1}>
                Select trace ({formatCount(store.entries.length)} matching)
              </Text>
              <NativeSelect.Root size="sm">
                <NativeSelect.Field
                  value={selectedId ?? ""}
                  onChange={(e) => store.select(e.currentTarget.value || null)}
                >
                  {store.entries.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entryLabel(entry)}
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Box>
            <Checkbox.Root
              size="sm"
              checked={hideEmpty}
              onCheckedChange={(e) => setHideEmpty(!!e.checked)}
              pb={1}
            >
              <Checkbox.HiddenInput />
              <Checkbox.Control />
              <Checkbox.Label>Hide empty messages</Checkbox.Label>
            </Checkbox.Root>
            <Checkbox.Root
              size="sm"
              checked={showRaw}
              onCheckedChange={(e) => setShowRaw(!!e.checked)}
              pb={1}
            >
              <Checkbox.HiddenInput />
              <Checkbox.Control />
              <Checkbox.Label>Show raw JSON</Checkbox.Label>
            </Checkbox.Root>
          </Flex>

          {store.detailStatus === "loading" ? (
            <Flex align="center" gap={2} py={8} justify="center">
              <Spinner size="sm" color="primary.solid" />
              <Text color="fg.muted">Fetching trace detail…</Text>
            </Flex>
          ) : store.detailStatus === "error" && store.detailError ? (
            <InlineAlert
              status="error"
              title="Failed to fetch trace detail"
              message={store.detailError}
            />
          ) : detail ? (
            <TraceDetailView
              detail={detail}
              baseThreadUrl={baseThreadUrl(environment)}
              hideEmpty={hideEmpty}
              showRaw={showRaw}
            />
          ) : null}
        </>
      )}
    </Flex>
  );
}

export default function TracesPage() {
  return (
    <AuthGate>
      <AppShell>
        <Suspense fallback={null}>
          <ExplorerView />
        </Suspense>
      </AppShell>
    </AuthGate>
  );
}
