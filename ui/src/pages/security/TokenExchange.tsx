import { Save, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Dropdown,
  Field,
  FieldGroup,
  PageHeader,
  Panel,
  StatusBanner,
  YamlBlock,
} from "../../components/Primitives";

const tokenTypeAccessToken = "urn:ietf:params:oauth:token-type:access_token";
const oktaIssuer =
  "https://trial-5395738.okta.com/oauth2/aus13u46is3QfakEx698";
const oktaAudience = "api://obo";
const oktaJwksUrl = `${oktaIssuer}/v1/keys`;

const idpPresets = [
  {
    id: "okta-standard",
    label: "Okta",
    description: "Okta issuer and JWKS.",
    profileName: "okta-standard",
    subjectIssuer: oktaIssuer,
    subjectAudience: oktaAudience,
    subjectJwksUrl: oktaJwksUrl,
  },
  {
    id: "entra-standard",
    label: "Entra ID",
    description: "Microsoft Entra issuer template.",
    profileName: "entra-standard",
    subjectIssuer: "https://login.microsoftonline.com/{tenant}/v2.0",
    subjectAudience: "api://obo",
    subjectJwksUrl:
      "https://login.microsoftonline.com/{tenant}/discovery/v2.0/keys",
  },
  {
    id: "generic-oidc",
    label: "Generic OIDC",
    description: "Any compliant OIDC issuer with explicit JWKS.",
    profileName: "oidc-standard",
    subjectIssuer: "https://issuer.example.invalid/oauth2/default",
    subjectAudience: "api://obo",
    subjectJwksUrl: "https://issuer.example.invalid/oauth2/default/v1/keys",
  },
] as const;

export function TokenExchangePage() {
  const [identityProvider, setIdentityProvider] = useState<string>(
    idpPresets[0].id,
  );
  const [backendCredentialMode, setBackendCredentialMode] = useState<string>(
    "gatewayExchange",
  );
  const [profileName, setProfileName] = useState<string>(
    idpPresets[0].profileName,
  );
  const [stsEndpoint, setStsEndpoint] = useState<string>(
    "https://mint-sts.internal/token",
  );
  const [subjectIssuer, setSubjectIssuer] = useState<string>(
    idpPresets[0].subjectIssuer,
  );
  const [subjectAudience, setSubjectAudience] = useState<string>(
    idpPresets[0].subjectAudience,
  );
  const [subjectJwksUrl, setSubjectJwksUrl] = useState<string>(
    idpPresets[0].subjectJwksUrl,
  );
  const [clientId, setClientId] = useState<string>("mintgateway");
  const [keyRef, setKeyRef] = useState<string>("gateway-signing-key");
  const [actorIssuer, setActorIssuer] = useState<string>(
    "mintgateway",
  );
  const [actorSubject, setActorSubject] = useState<string>(
    "mintgateway",
  );
  const [actorSource, setActorSource] = useState<string>(
    "selfIssuedActorAssertion",
  );
  const [mtlsEnabled, setMtlsEnabled] = useState<boolean>(true);
  const [clientCertRef, setClientCertRef] = useState<string>(
    "gateway-mtls-cert",
  );
  const [responseIssuer, setResponseIssuer] = useState<string>(
    "https://mint-sts.internal",
  );
  const [backendResource, setBackendResource] = useState(
    "http://localhost:3000/servicenow/mcp",
  );
  const [scopes, setScopes] = useState("openid, profile, email");

  const scopeList = useMemo(
    () =>
      scopes
        .split(/[,\n]/)
        .map((scope) => scope.trim())
        .filter(Boolean),
    [scopes],
  );

  function loadIdentityProvider(profileId: string) {
    const preset =
      idpPresets.find((profile) => profile.id === profileId) ?? idpPresets[0];
    setIdentityProvider(preset.id);
    setProfileName(preset.profileName);
    setSubjectIssuer(preset.subjectIssuer);
    setSubjectAudience(preset.subjectAudience);
    setSubjectJwksUrl(preset.subjectJwksUrl);
  }

  const draftYaml = useMemo(
    () => ({
      tokenExchange: {
        profiles: [
          {
            name: profileName,
            protocol: "oauth2-token-exchange",
            identityProvider,
            backendCredentialMode,
            stsEndpoint,
            subjectToken: {
              acceptedIssuers: [subjectIssuer],
              acceptedAudiences: [subjectAudience],
              acceptedTokenTypes: [tokenTypeAccessToken],
              jwks: {
                url: subjectJwksUrl,
              },
            },
            clientAuth: {
              method: "private_key_jwt",
              clientId,
              keyRef,
            },
            actorToken: {
              source: actorSource,
              issuer: actorIssuer,
              subject: actorSubject,
            },
            transport: {
              tls: "required",
              mtls: {
                enabled: mtlsEnabled,
                clientCertRef: mtlsEnabled ? clientCertRef : undefined,
              },
            },
            responseValidation: {
              issuer: responseIssuer,
              requiredTokenType: tokenTypeAccessToken,
              requireExpiresIn: true,
            },
          },
        ],
      },
    }),
    [
      actorIssuer,
      actorSource,
      actorSubject,
      backendCredentialMode,
      clientCertRef,
      clientId,
      identityProvider,
      keyRef,
      mtlsEnabled,
      profileName,
      responseIssuer,
      stsEndpoint,
      subjectAudience,
      subjectIssuer,
      subjectJwksUrl,
    ],
  );

  const effectivePlan = useMemo(
    () => ({
      effectiveExchangePlan: {
        request: {
          route: "servicenow-mcp",
          mcpTarget: "servicenow",
          tool: "ticket.search",
        },
        subject: {
          issuer: subjectIssuer,
          audience: subjectAudience,
          sub: "user@example.com",
        },
        actor: {
          issuer: actorIssuer,
          sub: actorSubject,
          source: actorSource,
        },
        decision: {
          result: "allow",
          grantRef: "servicenow-ticket-read",
        },
        exchange: {
          profileRef: profileName,
          backendCredentialMode,
          stsEndpoint,
          clientAuth: "private_key_jwt",
          keyRef,
          mtls: mtlsEnabled ? "required" : "disabled",
        },
        backendToken: {
          audience: backendResource,
          scopes: scopeList,
          claims: {
            sub: "original-user",
            act: actorSubject,
          },
        },
      },
    }),
    [
      actorIssuer,
      actorSource,
      actorSubject,
      backendResource,
      backendCredentialMode,
      keyRef,
      mtlsEnabled,
      profileName,
      scopeList,
      stsEndpoint,
      subjectAudience,
      subjectIssuer,
    ],
  );

  return (
    <div className="page-stack">
      <PageHeader
        title="Token Exchange"
        description="Configure reusable STS token exchange profiles for MCP backend credential replacement."
        actions={
          <button className="button primary" type="button" disabled>
            <Save size={16} />
            Preview
          </button>
        }
      />

      <StatusBanner state="info" title="Token exchange profile">
        Define the STS endpoint, subject-token validation, gateway client
        authentication, actor token posture, and transport requirements.
      </StatusBanner>

      <div className="security-workbench">
        <Panel className="security-form-panel">
          <div className="section-heading">
            <h3>Profile</h3>
            <p>
              Reusable STS posture. MCP servers and grants reference this
              profile later.
            </p>
          </div>
          <div className="form-grid">
            <FieldGroup label="Identity provider">
              <Dropdown
                ariaLabel="Identity provider"
                value={identityProvider}
                options={idpPresets.map((preset) => ({
                  value: preset.id,
                  label: preset.label,
                  description: preset.description,
                }))}
                onChange={loadIdentityProvider}
                showSelectedDescription
              />
            </FieldGroup>
            <FieldGroup label="Backend credential mode">
              <Dropdown
                ariaLabel="Backend credential mode"
                value={backendCredentialMode}
                options={[
                  {
                    value: "gatewayExchange",
                    label: "Gateway exchange",
                    description:
                      "MintGateway exchanges the subject token through STS.",
                  },
                  {
                    value: "adapterLowerAssurance",
                    label: "Adapter / lower assurance",
                    description:
                      "For backends that need a broker because they cannot validate exchanged tokens.",
                  },
                ]}
                onChange={setBackendCredentialMode}
                showSelectedDescription
              />
            </FieldGroup>
            <Field label="Profile name">
              <input
                value={profileName}
                onChange={(event) => setProfileName(event.target.value)}
              />
            </Field>
            <Field label="STS token endpoint">
              <input
                value={stsEndpoint}
                onChange={(event) => setStsEndpoint(event.target.value)}
              />
            </Field>
          </div>

          <div className="section-heading compact">
            <h3>Subject Token</h3>
            <p>Inbound IdP token claims MintGateway validates before exchange.</p>
          </div>
          <div className="form-grid">
            <Field label="Accepted subject issuer">
              <input
                value={subjectIssuer}
                onChange={(event) => setSubjectIssuer(event.target.value)}
              />
            </Field>
            <Field label="Accepted subject audience">
              <input
                value={subjectAudience}
                onChange={(event) => setSubjectAudience(event.target.value)}
              />
            </Field>
            <Field label="Subject JWKS URL">
              <input
                value={subjectJwksUrl}
                onChange={(event) => setSubjectJwksUrl(event.target.value)}
              />
            </Field>
            <Field label="Response issuer">
              <input
                value={responseIssuer}
                onChange={(event) => setResponseIssuer(event.target.value)}
              />
            </Field>
          </div>

          <div className="section-heading compact">
            <h3>Client Authentication</h3>
            <p>MintGateway authenticates to the STS with private_key_jwt.</p>
          </div>
          <div className="form-grid">
            <Field label="Client ID">
              <input
                value={clientId}
                onChange={(event) => setClientId(event.target.value)}
              />
            </Field>
            <Field label="Signing keyRef">
              <input
                value={keyRef}
                onChange={(event) => setKeyRef(event.target.value)}
              />
            </Field>
          </div>

          <div className="section-heading compact">
            <h3>Actor Token</h3>
            <p>V1 keeps sub as the user and act as the MintGateway actor.</p>
          </div>
          <div className="form-grid">
            <FieldGroup label="Actor source">
              <Dropdown
                ariaLabel="Actor token source"
                value={actorSource}
                options={[
                  {
                    value: "selfIssuedActorAssertion",
                    label: "Self-issued actor assertion",
                    description: "MintGateway signs the actor assertion.",
                  },
                  {
                    value: "trustedGatewayActorAssertion",
                    label: "Trusted gateway actor assertion",
                    description: "Uses a trusted assertion path from STS.",
                  },
                ]}
                onChange={setActorSource}
                showSelectedDescription
              />
            </FieldGroup>
            <Field label="Actor issuer">
              <input
                value={actorIssuer}
                onChange={(event) => setActorIssuer(event.target.value)}
              />
            </Field>
            <Field label="Actor subject">
              <input
                value={actorSubject}
                onChange={(event) => setActorSubject(event.target.value)}
              />
            </Field>
          </div>

          <div className="section-heading compact">
            <h3>Transport</h3>
            <p>
              mTLS hardens MintGateway to STS transport. It does not replace
              private_key_jwt.
            </p>
          </div>
          <label className="toggle-row security-toggle-row">
            <input
              type="checkbox"
              checked={mtlsEnabled}
              onChange={(event) => setMtlsEnabled(event.target.checked)}
            />
            <span>
              <strong>Require mTLS to STS</strong>
              <small>Keep enabled for enterprise posture.</small>
            </span>
          </label>
          <Field label="mTLS client certRef">
            <input
              value={clientCertRef}
              disabled={!mtlsEnabled}
              onChange={(event) => setClientCertRef(event.target.value)}
            />
          </Field>
        </Panel>

        <div className="security-preview-stack">
          <Panel className="security-yaml-panel">
            <div className="section-heading-row">
              <div>
                <h3>Generated YAML</h3>
                <p>Proposed MintGateway extension shape for tokenExchange.profiles.</p>
              </div>
              <span className="badge warn">draft</span>
            </div>
            <YamlBlock value={draftYaml} />
          </Panel>

          <Panel className="security-yaml-panel security-plan-panel">
            <div className="section-heading-row">
              <div>
                <h3>Effective Plan Preview</h3>
                <p>
                  Preview-only example using the selected profile with MCP
                  server and grant data from other pages.
                </p>
              </div>
              <span className="badge ok">
                <ShieldCheck size={14} />
                allow
              </span>
            </div>
            <div className="form-grid compact-form-grid">
              <Field label="Backend resource">
                <input
                  value={backendResource}
                  onChange={(event) => setBackendResource(event.target.value)}
                />
              </Field>
              <Field label="Requested scopes">
                <input
                  value={scopes}
                  onChange={(event) => setScopes(event.target.value)}
                />
              </Field>
            </div>
            <YamlBlock value={effectivePlan} />
          </Panel>

        </div>
      </div>
    </div>
  );
}
