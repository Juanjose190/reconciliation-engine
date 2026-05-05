import { BadRequestException } from "@nestjs/common";

export function requireTenantId(value: string | undefined): string {
  if (!value) {
    throw new BadRequestException("Missing X-Tenant-Id header");
  }
  return value;
}
