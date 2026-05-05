import { BadRequestException, Injectable } from "@nestjs/common";

const ACCOUNT_PATTERN = /^(asset|liability|revenue|expense|equity):[a-zA-Z0-9:_-]+$/;

@Injectable()
export class AccountBuilder {
  assetBlockchain(chain: string, token = "USD") {
    return this.validate(`asset:blockchain:${this.segment(chain)}:${this.currency(token)}`);
  }

  userLiability(userId: string, currency = "USD") {
    return this.validate(`liability:user:${this.segment(userId)}:${this.currency(currency)}`);
  }

  revenueFees(feeType: string, currency = "USD") {
    return this.validate(`revenue:fees:${this.segment(feeType)}:${this.currency(currency)}`);
  }

  expenseFees(feeType: string, currency = "USD") {
    return this.validate(`expense:fees:${this.segment(feeType)}:${this.currency(currency)}`);
  }

  equityCorrections(currency = "USD") {
    return this.validate(`equity:corrections:${this.currency(currency)}`);
  }

  validate(account: string) {
    if (!ACCOUNT_PATTERN.test(account)) {
      throw new BadRequestException(`Invalid generated account path: ${account}`);
    }
    return account;
  }

  private segment(value: string) {
    const normalized = value.trim();
    if (!/^[a-zA-Z0-9_-]+$/.test(normalized)) {
      throw new BadRequestException(`Invalid account path segment: ${value}`);
    }
    return normalized;
  }

  private currency(value: string) {
    if (value !== "USD") {
      throw new BadRequestException("Only USD is supported in this assessment");
    }
    return value;
  }
}
