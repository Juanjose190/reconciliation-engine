import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createRemoteJWKSet, jwtVerify } from "jose";

@Injectable()
export class AuthGuard implements CanActivate {
  private jwks?: ReturnType<typeof createRemoteJWKSet>;

  constructor(private readonly config: ConfigService) {}

  async canActivate(context: ExecutionContext) {
    if (this.config.get("AUTH_REQUIRED") !== "true") {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined>; user?: unknown }>();
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
    request.user = payload;
    return true;
  }
}
