import { Play } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader, StatusBanner } from "../../components/Primitives";
import { useGatewayConfig } from "../../hooks";
import { SecurityCommandRecipes } from "./SecurityCommandRecipes";
import { ScenarioDiagram, SecurityPreviewPanels } from "./SecurityPreviewPanels";
import { SecurityScenarioPanel } from "./SecurityScenarioPanel";
import {
  commandRecipes,
  defaultIdentity,
  effectivePlanPreview,
  exchangeFormPreview,
  grantProviderOptions,
  identityFromConfig,
  mcpServers,
  routePreview,
} from "./securityPlaygroundModel";

export function SecurityPlaygroundPage() {
  const config = useGatewayConfig();
  const [mcpServerId, setMcpServerId] = useState<string>(mcpServers[0].id);
  const [exchangeFlow, setExchangeFlow] = useState("delegation");
  const [decision, setDecision] = useState("allow");
  const [grantProvider, setGrantProvider] = useState<string>(
    grantProviderOptions[0].value,
  );
  const [userSub, setUserSub] = useState("user@example.com");
  const [clientId, setClientId] = useState("claude-desktop");
  const [gatewayBaseUrl, setGatewayBaseUrl] = useState("http://localhost:3000");
  const [stsEndpoint, setStsEndpoint] = useState(
    "https://mint-sts.internal/token",
  );
  const [issuer, setIssuer] = useState(defaultIdentity.issuer);
  const [audience, setAudience] = useState(defaultIdentity.audience);
  const [jwksUrl, setJwksUrl] = useState(defaultIdentity.jwksUrl);
  const [oktaClientId, setOktaClientId] = useState(
    defaultIdentity.oktaClientId,
  );
  const [redirectUri, setRedirectUri] = useState(defaultIdentity.redirectUri);
  const [gatewayClientId, setGatewayClientId] = useState("mintai");
  const [gatewayActor, setGatewayActor] = useState("mintai");
  const [recipeId, setRecipeId] = useState("01-okta-discovery");

  const selectedServer =
    mcpServers.find((server) => server.id === mcpServerId) ?? mcpServers[0];
  const terminalDecision = decision !== "allow";
  const configuredIdentity = useMemo(
    () => identityFromConfig(config.data),
    [config.data],
  );
  const identity = {
    issuer: configuredIdentity.issuer || issuer,
    audience: configuredIdentity.audience || audience,
    jwksUrl: configuredIdentity.jwksUrl || jwksUrl,
    clientId: configuredIdentity.clientId || oktaClientId,
    redirectUri: configuredIdentity.redirectUri || redirectUri,
    scopes: configuredIdentity.scopes || selectedServer.scopes,
  };

  const route = useMemo(
    () =>
      routePreview({
        selectedServer,
        issuer: identity.issuer,
        audience: identity.audience,
        jwksUrl: identity.jwksUrl,
        scopes: identity.scopes,
      }),
    [identity.audience, identity.issuer, identity.jwksUrl, identity.scopes, selectedServer],
  );
  const exchangeForm = useMemo(
    () =>
      exchangeFormPreview({
        exchangeFlow,
        gatewayClientId,
        selectedServer,
        scopes: identity.scopes,
      }),
    [exchangeFlow, gatewayClientId, identity.scopes, selectedServer],
  );
  const effectivePlan = useMemo(
    () =>
      effectivePlanPreview({
        decision,
        terminalDecision,
        issuer: identity.issuer,
        audience: identity.audience,
        userSub,
        clientId,
        exchangeFlow,
        gatewayActor,
        grantProvider,
        selectedServer,
        scopes: identity.scopes,
      }),
    [
      clientId,
      decision,
      exchangeFlow,
      gatewayActor,
      grantProvider,
      identity.audience,
      identity.issuer,
      identity.scopes,
      selectedServer,
      terminalDecision,
      userSub,
    ],
  );
  const recipes = useMemo(
    () =>
      commandRecipes({
        gatewayBaseUrl,
        stsEndpoint,
        issuer: identity.issuer,
        oktaClientId: identity.clientId,
        redirectUri: identity.redirectUri,
        route: selectedServer.route,
        resource: selectedServer.resource,
        scopes: identity.scopes,
        gatewayClientId,
        exchangeFlow,
      }),
    [
      exchangeFlow,
      gatewayBaseUrl,
      gatewayClientId,
      identity.clientId,
      identity.issuer,
      identity.redirectUri,
      identity.scopes,
      selectedServer.resource,
      selectedServer.route,
      stsEndpoint,
    ],
  );

  return (
    <div className="page-stack">
      <PageHeader
        title="Security Playground"
        description="Generate MCP authorization and token-exchange debugging artifacts from one scenario."
        actions={
          <button className="button primary" type="button" disabled>
            <Play size={16} />
            Preview
          </button>
        }
      />

      <StatusBanner state="info" title="Security command workbench">
        Build copyable commands and previews for MCP metadata, gateway calls,
        RFC 8693 token exchange, and backend validation.
      </StatusBanner>

      <ScenarioDiagram
        decision={decision}
        exchangeFlow={exchangeFlow}
        selectedServer={selectedServer}
        issuer={identity.issuer}
        stsEndpoint={stsEndpoint}
        gatewayActor={gatewayActor}
        grantProvider={grantProvider}
        userSub={userSub}
      />

      <SecurityScenarioPanel
        mcpServerId={mcpServerId}
        setMcpServerId={setMcpServerId}
        exchangeFlow={exchangeFlow}
        setExchangeFlow={setExchangeFlow}
        decision={decision}
        setDecision={setDecision}
        grantProvider={grantProvider}
        setGrantProvider={setGrantProvider}
        gatewayBaseUrl={gatewayBaseUrl}
        setGatewayBaseUrl={setGatewayBaseUrl}
        stsEndpoint={stsEndpoint}
        setStsEndpoint={setStsEndpoint}
        userSub={userSub}
        setUserSub={setUserSub}
        clientId={clientId}
        setClientId={setClientId}
        gatewayClientId={gatewayClientId}
        setGatewayClientId={setGatewayClientId}
        gatewayActor={gatewayActor}
        setGatewayActor={setGatewayActor}
        identity={identity}
        configuredIdentity={configuredIdentity}
        setIssuer={setIssuer}
        setAudience={setAudience}
        setJwksUrl={setJwksUrl}
        setOktaClientId={setOktaClientId}
        setRedirectUri={setRedirectUri}
      />

      <div className="security-preview-stack">
        <SecurityPreviewPanels
          decision={decision}
          exchangeFlow={exchangeFlow}
          selectedServer={selectedServer}
          routePreview={route}
          effectivePlanPreview={effectivePlan}
          exchangeFormPreview={exchangeForm}
          commandSlot={
            <SecurityCommandRecipes
              recipes={recipes}
              recipeId={recipeId}
              setRecipeId={setRecipeId}
            />
          }
        />
      </div>
    </div>
  );
}
