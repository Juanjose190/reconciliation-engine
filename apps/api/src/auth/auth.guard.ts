import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JWTPayload, createRemoteJWKSet, jwtVerify } from "jose";

type ReconciliationClaims = JWTPayload & {
  tenant_id?: string;
  scope?: "read_only" | "read_write" | "admin";
};

@Injectable()
export class AuthGuard implements CanActivate {
  private jwks?: ReturnType<typeof createRemoteJWKSet>;

  constructor(private readonly config: ConfigService) {}

  async canActivate(context: ExecutionContext) {
    if (this.config.get("AUTH_REQUIRED") !== "true") {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      method: string;
      headers: Record<string, string | undefined>;
      user?: ReconciliationClaims;
    }>();
    const authorization = request.headers.authorization;
    const token = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : null;
    if (!token) {
      throw new UnauthorizedException("Missing bearer token");
    }

    const issuer = this.config.getOrThrow<string>("KEYCLOAK_ISSUER");
    const audience = this.config.get<string>("KEYCLOAK_AUDIENCE");
    this.jwks ??= createRemoteJWKSet(new URL(`${issuer}/protocol/openid-connect/certs`));

    const { payload } = await jwtVerify(token, this.jwks, {
      issuer,
      audience
    });
    const claims = payload as ReconciliationClaims;
    this.assertTenantAccess(request.headers["x-tenant-id"], claims);
    this.assertScope(request.method, claims);
    request.user = claims;
    return true;
  }

  private assertTenantAccess(tenantId: string | undefined, claims: ReconciliationClaims) {
    if (!tenantId || claims.scope === "admin") {
      return;
    }
    if (claims.tenant_id !== tenantId) {
      throw new ForbiddenException("Token tenant_id does not match requested tenant");
    }
  }

  private assertScope(method: string, claims: ReconciliationClaims) {
    if (claims.scope === "admin") {
      return;
    }
    if (method === "GET" && ["read_only", "read_write"].includes(claims.scope ?? "")) {
      return;
    }
    if (["POST", "PUT", "PATCH", "DELETE"].includes(method) && claims.scope === "read_write") {
      return;
    }
    throw new ForbiddenException("Token scope does not allow this operation");
  }
}
