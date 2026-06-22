import { Dropdown, Field, FieldGroup, Panel } from "../../components/Primitives";
import {
  decisionOptions,
  exchangeFlowOptions,
  grantProviderOptions,
  mcpServers,
  scenarioTypeOptions,
  type IdentityConfig,
} from "./securityPlaygroundModel";

type Props = {
  scenarioType: string;
  setScenarioType: (value: string) => void;
  mcpServerId: string;
  setMcpServerId: (value: string) => void;
  exchangeFlow: string;
  setExchangeFlow: (value: string) => void;
  decision: string;
  setDecision: (value: string) => void;
  grantProvider: string;
  setGrantProvider: (value: string) => void;
  gatewayBaseUrl: string;
  setGatewayBaseUrl: (value: string) => void;
  stsEndpoint: string;
  setStsEndpoint: (value: string) => void;
  userSub: string;
  setUserSub: (value: string) => void;
  clientId: string;
  setClientId: (value: string) => void;
  actorAgent: string;
  setActorAgent: (value: string) => void;
  gatewayClientId: string;
  setGatewayClientId: (value: string) => void;
  gatewayActor: string;
  setGatewayActor: (value: string) => void;
  identity: IdentityConfig;
  configuredIdentity: IdentityConfig;
  setIssuer: (value: string) => void;
  setAudience: (value: string) => void;
  setJwksUrl: (value: string) => void;
  setOktaClientId: (value: string) => void;
  setRedirectUri: (value: string) => void;
};

export function SecurityScenarioPanel(props: Props) {
  return (
    <Panel className="security-form-panel">
      <div className="section-heading">
        <h3>Scenario</h3>
        <p>These values drive every preview and command.</p>
      </div>
      <div className="form-grid">
        <FieldGroup label="Scenario type">
          <Dropdown
            ariaLabel="Scenario type"
            value={props.scenarioType}
            options={[...scenarioTypeOptions]}
            onChange={props.setScenarioType}
            showSelectedDescription
          />
        </FieldGroup>
        <FieldGroup label="Exchange flow">
          <Dropdown
            ariaLabel="Exchange flow"
            value={props.exchangeFlow}
            options={[...exchangeFlowOptions]}
            onChange={props.setExchangeFlow}
            showSelectedDescription
          />
        </FieldGroup>
        <FieldGroup label="MCP server">
          <Dropdown
            ariaLabel="MCP server"
            value={props.mcpServerId}
            options={mcpServers.map((server) => ({
              value: server.id,
              label: server.label,
              description: `${server.route} -> ${server.tool}`,
            }))}
            onChange={props.setMcpServerId}
            showSelectedDescription
          />
        </FieldGroup>
        <FieldGroup label="Authorization result">
          <Dropdown
            ariaLabel="Authorization result"
            value={props.decision}
            options={[...decisionOptions]}
            onChange={props.setDecision}
            showSelectedDescription
          />
        </FieldGroup>
        <FieldGroup label="Grant source">
          <Dropdown
            ariaLabel="Grant source"
            value={props.grantProvider}
            options={[...grantProviderOptions]}
            onChange={props.setGrantProvider}
            showSelectedDescription
          />
        </FieldGroup>
        <Field label="Gateway base URL">
          <input
            value={props.gatewayBaseUrl}
            onChange={(event) => props.setGatewayBaseUrl(event.target.value)}
          />
        </Field>
        <Field label="STS endpoint">
          <input
            value={props.stsEndpoint}
            onChange={(event) => props.setStsEndpoint(event.target.value)}
          />
        </Field>
        <Field label="User subject">
          <input
            value={props.userSub}
            onChange={(event) => props.setUserSub(event.target.value)}
          />
        </Field>
        <Field label="Client app">
          <input
            value={props.clientId}
            onChange={(event) => props.setClientId(event.target.value)}
          />
        </Field>
        <Field label="Actor / agent">
          <input
            value={props.actorAgent}
            onChange={(event) => props.setActorAgent(event.target.value)}
          />
        </Field>
        <Field label="Gateway client ID">
          <input
            value={props.gatewayClientId}
            onChange={(event) => props.setGatewayClientId(event.target.value)}
          />
        </Field>
        <Field label="Gateway actor">
          <input
            value={props.gatewayActor}
            onChange={(event) => props.setGatewayActor(event.target.value)}
          />
        </Field>
      </div>
      {props.exchangeFlow === "impersonation" ? (
        <div className="status-banner warning compact-banner">
          <strong>Impersonation is an exception path.</strong>
          <span>
            It can hide actor context from the backend token unless policy and
            evidence preserve it separately. Use only when grant and admin
            policy explicitly allow impersonation.
          </span>
        </div>
      ) : null}

      <div className="section-heading compact">
        <h3>Identity Provider</h3>
        <p>Derived from configured OIDC or MCP authentication when present.</p>
      </div>
      <Field label="Issuer">
        <input
          value={props.identity.issuer}
          disabled={Boolean(props.configuredIdentity.issuer)}
          onChange={(event) => props.setIssuer(event.target.value)}
        />
      </Field>
      <div className="form-grid compact-form-grid">
        <Field label="Audience">
          <input
            value={props.identity.audience}
            disabled={Boolean(props.configuredIdentity.audience)}
            onChange={(event) => props.setAudience(event.target.value)}
          />
        </Field>
        <Field label="JWKS URL">
          <input
            value={props.identity.jwksUrl}
            disabled={Boolean(props.configuredIdentity.jwksUrl)}
            onChange={(event) => props.setJwksUrl(event.target.value)}
          />
        </Field>
        <Field label="Okta client ID">
          <input
            value={props.identity.clientId}
            disabled={Boolean(props.configuredIdentity.clientId)}
            onChange={(event) => props.setOktaClientId(event.target.value)}
          />
        </Field>
        <Field label="Redirect URI">
          <input
            value={props.identity.redirectUri}
            disabled={Boolean(props.configuredIdentity.redirectUri)}
            onChange={(event) => props.setRedirectUri(event.target.value)}
          />
        </Field>
      </div>
    </Panel>
  );
}
