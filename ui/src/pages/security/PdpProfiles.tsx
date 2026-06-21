import { Link } from "@tanstack/react-router";
import {
  EmptyState,
  PageHeader,
  Panel,
  StatusBanner,
  YamlBlock,
} from "../../components/Primitives";
import { useGatewayConfig } from "../../hooks";

export function PdpProfilesPage() {
  const config = useGatewayConfig();
  const pdp = config.data
    ? (config.data as Record<string, unknown>).pdp
    : undefined;

  return (
    <div className="page-stack">
      <PageHeader
        title="PDP Profiles"
        description="Review reusable policy decision provider profiles for exchange-aware MCP authorization."
      />

      {config.isError ? (
        <StatusBanner state="bad" title="Configuration API unavailable">
          {config.error.message}
        </StatusBanner>
      ) : null}

      <StatusBanner state="info" title="Read-only planning page">
        This page is the future home for local and external PDP profile wiring.
        Runtime authorization still uses existing MCP authorization until the
        normalized decision contract is implemented.
      </StatusBanner>

      <Panel>
        {config.isLoading ? (
          <StatusBanner state="loading" title="Loading PDP profiles" />
        ) : pdp ? (
          <YamlBlock value={pdp} />
        ) : (
          <EmptyState
            title="No PDP profiles configured"
            description="This page will own pdp.profiles and expose fail-closed readiness for local and external policy providers."
            action={<Link to="/raw-config">Open Raw Configuration</Link>}
          />
        )}
      </Panel>
    </div>
  );
}
