import type { ReactNode } from "react";
import { Panel, YamlBlock } from "../../components/Primitives";
import type { McpServer } from "./securityPlaygroundModel";

type Props = {
  decision: string;
  exchangeFlow: string;
  selectedServer: McpServer;
  routePreview: unknown;
  effectivePlanPreview: unknown;
  exchangeFormPreview: unknown;
  commandSlot: ReactNode;
};

export function SecurityPreviewPanels(props: Props) {
  return (
    <>
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
  decision: string;
  exchangeFlow: string;
  selectedServer: McpServer;
  issuer: string;
  stsEndpoint: string;
  gatewayActor: string;
  grantProvider: string;
  userSub: string;
}) {
  const terminalDecision = props.decision !== "allow";
  const pdpState = props.decision === "allow" ? "ok" : props.decision;
  const downstreamState = terminalDecision ? "skipped" : "ok";
  const delegation = props.exchangeFlow === "delegation";
  const actorState = terminalDecision
    ? "skipped"
    : delegation
      ? "ok"
      : "skipped";
  const stsDetail = terminalDecision
    ? "skipped"
    : delegation
      ? "subject + actor"
      : "subject only";
  const outputDetail = terminalDecision
    ? "no backend token"
    : delegation
      ? "sub=user, act=gateway"
      : "sub=user, no act";
  const stsEndpointDetail = terminalDecision
    ? "skipped"
    : shortValue(props.stsEndpoint);
  const consentState = terminalDecision
    ? props.decision === "challenge"
      ? "challenge"
      : "skipped"
    : "ok";
  const consentDetail = terminalDecision
    ? props.decision === "challenge"
      ? "grant required"
      : "not evaluated"
    : props.grantProvider === "external"
      ? "external + local"
      : "local grant valid";
  const showExternalConsent = props.grantProvider === "external";
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
            title="Consent / grant"
            detail={consentDetail}
            state={consentState}
          />
          <ScenarioArrow />
          <ScenarioNode title="PDP" detail={props.decision} state={pdpState} />
        </div>

        {showExternalConsent ? (
          <div className="scenario-row scenario-row-consent">
            <ScenarioNode
              title="Metadata"
              detail="RFC 9728"
              state={terminalDecision ? "challenge" : "ok"}
            />
            <ScenarioArrow />
            <ScenarioNode
              title="quconsent"
              detail="auth-code + PKCE"
              state={terminalDecision ? "challenge" : "ok"}
            />
            <ScenarioArrow />
            <ScenarioNode
              title="Enterprise IdP"
              detail="login / MFA"
              state={terminalDecision ? "challenge" : "ok"}
            />
            <ScenarioArrow />
            <ScenarioNode
              title="Grant decision"
              detail={terminalDecision ? "not satisfied" : "opaque grant"}
              state={terminalDecision ? "challenge" : "ok"}
            />
          </div>
        ) : null}

        <div className="scenario-row scenario-row-exchange">
          <ScenarioNode
            title="Subject token"
            detail={`iss=${shortValue(props.issuer)}`}
            state={terminalDecision ? "skipped" : "ok"}
          />
          <ScenarioArrow />
          <ScenarioNode
            title="Actor assertion"
            detail={delegation ? props.gatewayActor : "omitted"}
            state={actorState}
          />
          <ScenarioArrow />
          <ScenarioNode
            title="Mint STS"
            detail={`${stsDetail} · ${stsEndpointDetail}`}
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
