import type { GatewayConfig } from "../../types";

export const tokenTypeAccessToken =
  "urn:ietf:params:oauth:token-type:access_token";
export const tokenExchangeGrant =
  "urn:ietf:params:oauth:grant-type:token-exchange";
export const jwtTokenType = "urn:ietf:params:oauth:token-type:jwt";
export const clientAssertionJwtBearer =
  "urn:ietf:params:oauth:client-assertion-type:jwt-bearer";

const oktaIssuer =
  "https://trial-5395738.okta.com/oauth2/aus13u46is3QfakEx698";

export const defaultIdentity = {
  issuer: oktaIssuer,
  audience: "api://obo",
  jwksUrl: `${oktaIssuer}/v1/keys`,
  oktaClientId: "0oa...",
  redirectUri: "http://localhost:8080/callback",
};

export const mcpServers = [
  {
    id: "servicenow",
    label: "ServiceNow",
    route: "/servicenow/mcp",
    resource: "http://localhost:3000/servicenow/mcp",
    tool: "ticket.search",
    grantRef: "servicenow-ticket-read",
    scopes: "openid profile email",
  },
  {
    id: "databricks",
    label: "Databricks",
    route: "/databricks/mcp",
    resource: "http://localhost:3000/databricks/mcp",
    tool: "query.run",
    grantRef: "databricks-query-read",
    scopes: "openid profile email",
  },
  {
    id: "chat",
    label: "Chat",
    route: "/chat/mcp",
    resource: "http://localhost:3000/chat/mcp",
    tool: "chat.send",
    grantRef: "chat-basic",
    scopes: "openid profile email",
  },
] as const;

export const decisionOptions = [
  {
    value: "allow",
    label: "Allow",
    description: "Build an exchange plan and call STS.",
  },
  {
    value: "challenge",
    label: "Challenge",
    description: "Return WWW-Authenticate.",
  },
  {
    value: "deny",
    label: "Deny",
    description: "Stop before STS and backend.",
  },
] as const;

export const exchangeFlowOptions = [
  {
    value: "delegation",
    label: "Delegation",
    description: "Preserve sub as the user and emit act for MintGateway.",
  },
  {
    value: "impersonation",
    label: "Impersonation",
    description: "Mint a backend token for the user without an act claim.",
  },
] as const;

export type McpServer = (typeof mcpServers)[number];

export type CommandRecipe = {
  id: string;
  title: string;
  description: string;
  code: string;
};

export type IdentityConfig = {
  issuer: string;
  audience: string;
  jwksUrl: string;
  clientId: string;
  redirectUri: string;
  scopes: string;
};

export function identityFromConfig(
  config: GatewayConfig | null | undefined,
): IdentityConfig {
  const mcpPolicies = (config?.mcp?.policies ?? {}) as Record<string, unknown>;
  const llmPolicies = (config?.llm?.policies ?? {}) as Record<string, unknown>;
  const oidc = firstObject(mcpPolicies.oidc, llmPolicies.oidc);
  const mcpAuth = firstObject(mcpPolicies.mcpAuthentication);
  const jwks = firstObject(mcpAuth?.jwks, oidc?.jwks);
  const audiences = Array.isArray(mcpAuth?.audiences)
    ? mcpAuth.audiences.filter(
        (value): value is string => typeof value === "string",
      )
    : [];
  const scopes = Array.isArray(oidc?.scopes)
    ? oidc.scopes.filter(
        (value): value is string => typeof value === "string",
      )
    : [];
  return {
    issuer: stringValue(oidc?.issuer) || stringValue(mcpAuth?.issuer),
    audience: audiences[0] ?? "",
    jwksUrl: stringValue(jwks?.url),
    clientId: stringValue(oidc?.clientId),
    redirectUri: stringValue(oidc?.redirectURI),
    scopes: scopes.join(" "),
  };
}

export function routePreview(args: {
  selectedServer: McpServer;
  issuer: string;
  audience: string;
  jwksUrl: string;
  scopes: string;
}) {
  return {
    route: args.selectedServer.route,
    mcpTarget: args.selectedServer.id,
    tool: args.selectedServer.tool,
    mcpAuthentication: {
      mode: "strict",
      issuer: args.issuer,
      audiences: [args.audience],
      jwks: { url: args.jwksUrl },
      resourceMetadata: {
        resource: args.selectedServer.resource,
        scopesSupported: args.scopes.split(/\s+/),
        bearerMethodsSupported: ["header"],
      },
    },
    exchangeBinding: {
      profileRef: "okta-standard",
      grantRef: args.selectedServer.grantRef,
    },
  };
}

export function exchangeFormPreview(args: {
  exchangeFlow: string;
  gatewayClientId: string;
  selectedServer: McpServer;
  scopes: string;
}) {
  const actorFields =
    args.exchangeFlow === "delegation"
      ? {
          actor_token: "$MINTGATEWAY_ACTOR_ASSERTION",
          actor_token_type: jwtTokenType,
        }
      : {};
  return {
    grant_type: tokenExchangeGrant,
    client_id: args.gatewayClientId,
    client_assertion_type: clientAssertionJwtBearer,
    client_assertion: "$MINTGATEWAY_CLIENT_ASSERTION",
    subject_token: "$OKTA_ACCESS_TOKEN",
    subject_token_type: tokenTypeAccessToken,
    ...actorFields,
    requested_token_type: tokenTypeAccessToken,
    audience: args.selectedServer.resource,
    scope: args.scopes,
  };
}

export function effectivePlanPreview(args: {
  decision: string;
  terminalDecision: boolean;
  issuer: string;
  audience: string;
  userSub: string;
  clientId: string;
  exchangeFlow: string;
  gatewayActor: string;
  selectedServer: McpServer;
  scopes: string;
}) {
  return {
    decision: args.decision,
    terminal: args.terminalDecision,
    subject: {
      iss: args.issuer,
      aud: args.audience,
      sub: args.userSub,
      client_id: args.clientId,
    },
    actor: args.terminalDecision
      ? undefined
      : args.exchangeFlow === "delegation"
        ? {
            iss: args.gatewayActor,
            sub: args.gatewayActor,
          }
        : undefined,
    exchange: args.terminalDecision
      ? undefined
      : {
          flow: args.exchangeFlow,
          profileRef: "okta-standard",
          grantRef: args.selectedServer.grantRef,
          resource: args.selectedServer.resource,
          scope: args.scopes,
        },
  };
}

export function commandRecipes(args: {
  gatewayBaseUrl: string;
  stsEndpoint: string;
  issuer: string;
  oktaClientId: string;
  redirectUri: string;
  route: string;
  resource: string;
  scopes: string;
  gatewayClientId: string;
  exchangeFlow: string;
}): CommandRecipe[] {
  const gateway = args.gatewayBaseUrl.replace(/\/$/, "");
  const issuer = args.issuer.replace(/\/$/, "");
  const metadataPath = `/.well-known/oauth-protected-resource${args.route}`;
  const authServerPath = `/.well-known/oauth-authorization-server${args.route}`;
  const encodedRedirectUri = encodeURIComponent(args.redirectUri);
  const encodedScopes = encodeURIComponent(args.scopes);
  const actorParams =
    args.exchangeFlow === "delegation"
      ? ` \\
  --data-urlencode "actor_token=$MINTGATEWAY_ACTOR_ASSERTION" \\
  --data-urlencode "actor_token_type=${jwtTokenType}"`
      : "";
  return [
    {
      id: "01-okta-discovery",
      title: "01 Okta discovery",
      description: "Fetch OpenID Provider metadata for the selected issuer.",
      code: `export OKTA_ISSUER=${JSON.stringify(issuer)}
export OKTA_CLIENT_ID=${JSON.stringify(args.oktaClientId)}
export OKTA_REDIRECT_URI=${JSON.stringify(args.redirectUri)}

curl -sS "$OKTA_ISSUER/.well-known/openid-configuration"`,
    },
    {
      id: "02-pkce-values",
      title: "02 Generate PKCE values",
      description: "Create a verifier and S256 challenge for authorization code flow.",
      code: `export OKTA_CODE_VERIFIER="$(openssl rand -hex 48)"
export OKTA_CODE_CHALLENGE="$(
  printf '%s' "$OKTA_CODE_VERIFIER" \\
    | openssl dgst -sha256 -binary \\
    | openssl base64 -A \\
    | tr '+/' '-_' \\
    | tr -d '='
)"
export OKTA_STATE="$(openssl rand -hex 16)"
export OKTA_NONCE="$(openssl rand -hex 16)"

printf 'verifier=%s\\nchallenge=%s\\nstate=%s\\nnonce=%s\\n' \\
  "$OKTA_CODE_VERIFIER" "$OKTA_CODE_CHALLENGE" "$OKTA_STATE" "$OKTA_NONCE"`,
    },
    {
      id: "03-okta-authorize",
      title: "03 Start Okta sign-in",
      description: "Open the PKCE authorization request and copy the returned code.",
      code: `open "$OKTA_ISSUER/v1/authorize?client_id=$OKTA_CLIENT_ID&response_type=code&scope=${encodedScopes}&redirect_uri=${encodedRedirectUri}&state=$OKTA_STATE&nonce=$OKTA_NONCE&code_challenge=$OKTA_CODE_CHALLENGE&code_challenge_method=S256"

# After sign-in, copy the code query parameter from the redirect URL:
export OKTA_AUTHORIZATION_CODE="<paste-code-from-redirect>"`,
    },
    {
      id: "04-okta-token",
      title: "04 Exchange code for token",
      description: "Redeem the authorization code for Okta tokens using PKCE.",
      code: `curl -sS -X POST "$OKTA_ISSUER/v1/token" \\
  -H "content-type: application/x-www-form-urlencoded" \\
  --data-urlencode "grant_type=authorization_code" \\
  --data-urlencode "client_id=$OKTA_CLIENT_ID" \\
  --data-urlencode "redirect_uri=$OKTA_REDIRECT_URI" \\
  --data-urlencode "code_verifier=$OKTA_CODE_VERIFIER" \\
  --data-urlencode "code=$OKTA_AUTHORIZATION_CODE"`,
    },
    {
      id: "05-export-okta-token",
      title: "05 Export Okta access token",
      description: "Save the access token from the token response for gateway calls.",
      code: `export OKTA_TOKEN_RESPONSE='<paste-token-response-json>'
export OKTA_ACCESS_TOKEN="$(
  printf '%s' "$OKTA_TOKEN_RESPONSE" \\
    | python3 -c 'import json,sys; print(json.load(sys.stdin)["access_token"])'
)"

python3 - <<'PY'
import json, os
payload = json.loads(os.environ["OKTA_TOKEN_RESPONSE"])
print("token_type=", payload.get("token_type"))
print("expires_in=", payload.get("expires_in"))
print("scope=", payload.get("scope"))
PY`,
    },
    {
      id: "06-protected-resource-metadata",
      title: "06 Protected resource metadata",
      description: "Fetch MCP protected-resource metadata for the selected route.",
      code: `curl -sS ${JSON.stringify(`${gateway}${metadataPath}`)}`,
    },
    {
      id: "07-authorization-server-metadata",
      title: "07 Authorization server metadata",
      description: "Fetch authorization-server metadata for the selected route.",
      code: `curl -sS ${JSON.stringify(`${gateway}${authServerPath}`)}`,
    },
    {
      id: "08-mcp-initialize",
      title: "08 MCP initialize",
      description: "Initialize an MCP session through the gateway with an inbound user token.",
      code: `curl -sS -D /tmp/mintgateway-mcp.headers \\
  -o /tmp/mintgateway-mcp-initialize.json \\
  -X POST ${JSON.stringify(`${gateway}${args.route}`)} \\
  -H "content-type: application/json" \\
  -H "authorization: Bearer $OKTA_ACCESS_TOKEN" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"curl","version":"1.0.0"}}}'

cat /tmp/mintgateway-mcp-initialize.json
export MCP_SESSION_ID="$(
  awk 'tolower($1)=="mcp-session-id:" { gsub("\\r", "", $2); print $2 }' \\
    /tmp/mintgateway-mcp.headers
)"
printf 'MCP_SESSION_ID=%s\\n' "$MCP_SESSION_ID"`,
    },
    {
      id: "09-mcp-tools-list",
      title: "09 MCP tools/list",
      description: "List MCP tools through the gateway with an inbound user token.",
      code: `curl -sS -X POST ${JSON.stringify(`${gateway}${args.route}`)} \\
  -H "content-type: application/json" \\
  -H "authorization: Bearer $OKTA_ACCESS_TOKEN" \\
  -H "mcp-session-id: $MCP_SESSION_ID" \\
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'`,
    },
    {
      id: "10-sts-exchange",
      title: "10 STS token exchange",
      description: "Call the RFC 8693 token endpoint directly with subject and actor tokens.",
      code: `curl -sS -X POST ${JSON.stringify(args.stsEndpoint)} \\
  -H "content-type: application/x-www-form-urlencoded" \\
  --data-urlencode "grant_type=${tokenExchangeGrant}" \\
  --data-urlencode "client_id=${args.gatewayClientId}" \\
  --data-urlencode "client_assertion_type=${clientAssertionJwtBearer}" \\
  --data-urlencode "client_assertion=$MINTGATEWAY_CLIENT_ASSERTION" \\
  --data-urlencode "subject_token=$OKTA_ACCESS_TOKEN" \\
  --data-urlencode "subject_token_type=${tokenTypeAccessToken}"${actorParams} \\
  --data-urlencode "requested_token_type=${tokenTypeAccessToken}" \\
  --data-urlencode "audience=${args.resource}" \\
  --data-urlencode "scope=${args.scopes}"`,
    },
    {
      id: "11-export-exchanged-token",
      title: "11 Export exchanged token",
      description: "Save the STS response access token for direct backend validation.",
      code: `export STS_TOKEN_RESPONSE='<paste-sts-token-response-json>'
export EXCHANGED_ACCESS_TOKEN="$(
  printf '%s' "$STS_TOKEN_RESPONSE" \\
    | python3 -c 'import json,sys; print(json.load(sys.stdin)["access_token"])'
)"`,
    },
    {
      id: "12-backend-mcp",
      title: "12 Backend MCP with exchanged token",
      description: "Call the selected backend MCP endpoint with the exchanged token.",
      code: `curl -sS -X POST "$BACKEND_MCP_URL" \\
  -H "content-type: application/json" \\
  -H "authorization: Bearer $EXCHANGED_ACCESS_TOKEN" \\
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/list","params":{}}'`,
    },
  ];
}

function firstObject(...values: unknown[]): Record<string, unknown> | undefined {
  return values.find(
    (value): value is Record<string, unknown> =>
      Boolean(value) && typeof value === "object" && !Array.isArray(value),
  );
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
