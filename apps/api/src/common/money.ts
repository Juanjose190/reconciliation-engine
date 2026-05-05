export function toMinorUnits(amount: string | number): bigint {
  const value = String(amount);
  if (!/^\d+(\.\d{1,2})?$/.test(value)) {
    throw new Error("Amount must be a positive USD amount with up to 2 decimals");
  }

  const [dollars, cents = ""] = value.split(".");
  return BigInt(dollars) * 100n + BigInt(cents.padEnd(2, "0"));
}

export function fromMinorUnits(amount: bigint | number | string): string {
  const value = BigInt(amount);
  const sign = value < 0n ? "-" : "";
  const abs = value < 0n ? -value : value;
  const dollars = abs / 100n;
  const cents = String(abs % 100n).padStart(2, "0");
  return `${sign}${dollars}.${cents}`;
}
