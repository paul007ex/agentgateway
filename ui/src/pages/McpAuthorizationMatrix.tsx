import { Link } from "@tanstack/react-router";
import {
  EmptyState,
  PageHeader,
  Panel,
  StatusBanner,
  YamlBlock,
} from "../components/Primitives";
import { useGatewayConfig } from "../hooks";

export function McpAuthorizationMatrixPage() {
  const config = useGatewayConfig();
  const rootAuthorization = config.data
    ? (config.data as Record<string, unknown>).mcpAuthorization
    : undefined;
  const existingMcpPolicy = config.data?.mcp?.policies?.mcpAuthorization;
  const matrixSource = rootAuthorization ?? existingMcpPolicy;

  return (
    <div className="page-stack">
      <PageHeader
        title="MCP Authorization Matrix"
        description="Review the planned agent, server, tool, and exchange grant posture for MCP traffic."
      />

      {config.isError ? (
        <StatusBanner state="bad" title="Configuration API unavailable">
          {config.error.message}
        </StatusBanner>
      ) : null}

      <StatusBanner state="info" title="Read-only planning page">
        Existing MCP authorization rules remain under MCP Policies. This page
        will own mcpAuthorization.inputMapping and mcpAuthorization.grants once
        the typed schema exists.
      </StatusBanner>

      <Panel>
        {config.isLoading ? (
          <StatusBanner state="loading" title="Loading MCP authorization" />
        ) : matrixSource ? (
          <YamlBlock value={matrixSource} />
        ) : (
          <EmptyState
            title="No authorization matrix configured"
            description="This page will show grantRef, PDP profile, client app, MCP server, tool, scopes, exchange profile, and readiness."
            action={<Link to="/mcp/policies">Open MCP Policies</Link>}
          />
        )}
      </Panel>
    </div>
  );
}
