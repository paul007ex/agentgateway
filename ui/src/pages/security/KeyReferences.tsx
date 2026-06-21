import { Link } from "@tanstack/react-router";
import {
  EmptyState,
  PageHeader,
  Panel,
  StatusBanner,
  YamlBlock,
} from "../../components/Primitives";
import { useGatewayConfig } from "../../hooks";

export function KeyReferencesPage() {
  const config = useGatewayConfig();
  const keyRefs = config.data
    ? (config.data as Record<string, unknown>).keyRefs
    : undefined;

  return (
    <div className="page-stack">
      <PageHeader
        title="Key Management"
        description="Review reusable signing keys, trust roots, and secret handles for STS client authentication and actor assertions."
      />

      {config.isError ? (
        <StatusBanner state="bad" title="Configuration API unavailable">
          {config.error.message}
        </StatusBanner>
      ) : null}

      <StatusBanner state="info" title="Read-only planning page">
        Typed key reference editing is not wired yet. Use Raw Configuration for
        early schema validation once the config contract lands.
      </StatusBanner>

      <Panel>
        {config.isLoading ? (
          <StatusBanner state="loading" title="Loading key material" />
        ) : keyRefs ? (
          <YamlBlock value={keyRefs} />
        ) : (
          <EmptyState
            title="No key material configured"
            description="This page will own reusable references for signing keys, trust roots, and future secret handles."
            action={<Link to="/raw-config">Open Raw Configuration</Link>}
          />
        )}
      </Panel>
    </div>
  );
}
