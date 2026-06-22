import type { ReactNode } from "react";
import { Panel, YamlBlock } from "../../components/Primitives";
import type { McpServer } from "./securityPlaygroundModel";

type Props = {
  scenarioType: string;
  decision: string;
  exchangeFlow: string;
  grantProvider: string;
  issuer: string;
  scopes: string;
  selectedServer: McpServer;
  userSub: string;
  clientId: string;
  actorAgent: string;
  routePreview: unknown;
  effectivePlanPreview: unknown;
  exchangeFormPreview: unknown;
  commandSlot: ReactNode;
};

export function SecurityPreviewPanels(props: Props) {
  const terminalDecision = props.decision !== "allow";
  const consentScenario = props.scenarioType === "consentAndExchange";
  const consentPreview = {
    playflow: consentScenario ? "userConsent" : "authorizationGate",
    scenarioType: props.scenarioType,
    source: grantSourceLabel(props.grantProvider),
    clientApp: props.clientId,
    actorAgent: props.actorAgent,
    user: props.userSub,
    mcpServer: props.selectedServer.label,
    routeUri: props.selectedServer.resource,
    protectedResourceUri: props.selectedServer.resource,
    tool: props.selectedServer.tool,
    requestedScopes: props.scopes.split(/\s+/),
    authorizationServer:
      props.grantProvider === "local"
        ? props.issuer
        : "https://quconsent.internal",
    enterpriseIdp: props.issuer,
    localPolicy: "MintAI authorization matrix",
    externalPdp:
      props.grantProvider === "quconsentPdp"
        ? "configured PDP adapter"
        : undefined,
    grantRef: props.selectedServer.grantRef,
    requirements:
      props.grantProvider !== "local"
        ? [
            "WWW-Authenticate challenge",
            "RFC 9728 protected resource metadata",
            "PKCE S256",
            "no token passthrough",
            "opaque server-side grant",
          ]
        : ["local authorization matrix", "no token passthrough"],
    result: terminalDecision
      ? props.decision === "challenge"
        ? "grant_required"
        : "not_evaluated"
      : "grant_satisfied",
  };
  const stsPlayflow = {
    playflow: "secureTokenExchange",
    startsAfter: "grant satisfied + authorization allow",
    skipped: terminalDecision,
    exchangeFlow: props.exchangeFlow,
    subjectToken: "$OKTA_ACCESS_TOKEN",
    subjectPreview: { sub: props.userSub, iss: props.issuer },
    actorToken:
      props.exchangeFlow === "delegation" ? "$MINTAI_ACTOR_ASSERTION" : "omitted",
    actorPreview:
      props.exchangeFlow === "delegation"
        ? { iss: "mintgateway", sub: props.actorAgent }
        : undefined,
    requestedTokenType: "access_token",
    audience: props.selectedServer.resource,
    scope: props.scopes,
    backendReceives: terminalDecision
      ? "nothing"
      : props.exchangeFlow === "delegation"
        ? { sub: props.userSub, act: { sub: props.actorAgent } }
        : { sub: props.userSub, act: "omitted" },
  };
  return (
    <>
      <div className="security-playflow-grid">
        <PreviewPanel
          title="Consent / Grant Playflow"
          badge={grantSourceLabel(props.grantProvider)}
          value={consentPreview}
        />
        <PreviewPanel
          title="STS Token Exchange Playflow"
          badge={props.exchangeFlow}
          value={stsPlayflow}
        />
      </div>

      {props.commandSlot}

      <div className="security-preview-grid">
        <PreviewPanel
          title="Route Binding"
          badge="config"
          value={props.routePreview}
        />
        <PreviewPanel
          title="Effective Plan"
          badge={props.decision}
          value={props.effectivePlanPreview}
        />
        <PreviewPanel
          title="RFC 8693 Form"
          badge="request"
          value={props.exchangeFormPreview}
        />
      </div>
    </>
  );
}

export function ScenarioDiagram(props: {
  scenarioType: string;
  decision: string;
  exchangeFlow: string;
  selectedServer: McpServer;
  issuer: string;
  stsEndpoint: string;
  gatewayActor: string;
  actorAgent: string;
  grantProvider: string;
  userSub: string;
}) {
  const terminalDecision = props.decision !== "allow";
  const pdpState = props.decision === "allow" ? "ok" : props.decision;
  const downstreamState = terminalDecision ? "skipped" : "ok";
  const delegation = props.exchangeFlow === "delegation";
  const stsDetail = terminalDecision
    ? "skipped"
    : delegation
      ? "subject + actor"
      : "subject only";
  const outputDetail = terminalDecision
    ? "no backend token"
    : delegation
      ? `sub=user, act=${props.actorAgent}`
      : "sub=user, no act";
  const consentState = terminalDecision
    ? props.decision === "challenge"
      ? "challenge"
      : "skipped"
    : "ok";
  const consentDetail = terminalDecision
    ? props.decision === "challenge"
      ? "grant required"
      : "not evaluated"
    : props.grantProvider === "local"
      ? "local policy valid"
      : grantSourceLabel(props.grantProvider);
  const showExternalConsent = props.grantProvider !== "local";
  return (
    <Panel className="scenario-diagram-card">
      <div className="section-heading-row">
        <div>
          <h3>Scenario Flow</h3>
        </div>
        <span className="badge">rendered</span>
      </div>
      <div className="scenario-exchange-diagram" aria-label="Rendered scenario flow">
        <div className="scenario-row scenario-row-main">
          <ScenarioNode title="User" detail={props.userSub} state="ok" />
          <ScenarioArrow />
          <ScenarioNode title="Okta" detail="PKCE sign-in" state="ok" />
          <ScenarioArrow />
          <ScenarioNode title="MCP Client" detail="Okta token" state="ok" />
          <ScenarioArrow />
          <ScenarioNode
            title="MintAI"
            detail={props.selectedServer.route}
            state="ok"
          />
          <ScenarioArrow />
          <ScenarioNode
            title={showExternalConsent ? "quconsent grant" : "Grant check"}
            detail={consentDetail}
            state={consentState}
          />
          <ScenarioArrow />
          <ScenarioNode
            title="Authorization"
            detail={props.decision}
            state={pdpState}
          />
          <ScenarioArrow />
          <ScenarioNode
            title="Mint STS"
            detail={`${stsDetail} · ${shortValue(props.stsEndpoint)}`}
            state={downstreamState}
          />
          <ScenarioArrow />
          <ScenarioNode
            title={props.selectedServer.label}
            detail={`${props.selectedServer.tool} · ${outputDetail}`}
            state={downstreamState}
          />
        </div>
      </div>
      <div className="scenario-diagram-legend">
        <span><i className="ok" /> active</span>
        <span><i className="challenge" /> challenge</span>
        <span><i className="skipped" /> skipped</span>
        <span><i className="deny" /> denied</span>
      </div>
    </Panel>
  );
}

function grantSourceLabel(value: string) {
  if (value === "quconsentLocal") return "quconsent + local policy";
  if (value === "quconsentPdp") return "quconsent + external PDP";
  return "Local Authorization Matrix";
}

function ScenarioNode(props: {
  title: string;
  detail: string;
  state: string;
}) {
  return (
    <div className={`scenario-node ${props.state}`}>
      <strong>{props.title}</strong>
      <small>{props.detail}</small>
    </div>
  );
}

function ScenarioArrow() {
  return <span className="scenario-arrow">→</span>;
}

function shortValue(value: string) {
  if (value.length <= 34) return value;
  return `${value.slice(0, 31)}...`;
}

function PreviewPanel(props: {
  title: string;
  badge: string;
  value: unknown;
}) {
  return (
    <Panel className="security-yaml-panel security-preview-card">
      <div className="section-heading-row">
        <div>
          <h3>{props.title}</h3>
        </div>
        <span className="badge">{props.badge}</span>
      </div>
      <YamlBlock value={props.value} />
    </Panel>
  );
}
