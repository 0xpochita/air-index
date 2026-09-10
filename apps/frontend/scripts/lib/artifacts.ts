import fs from "node:fs";
import path from "node:path";
import type { Abi } from "viem";

const CONTRACTS_OUT = path.resolve(process.cwd(), "../contracts/out");

interface ForgeArtifact {
  abi: Abi;
  bytecode: { object: `0x${string}` };
}

/**
 * Reads a `forge build` artifact. Kept as a plain file read rather than a
 * generated TypeScript module so the compiled bytecode can never drift from
 * what the deploy script actually sends.
 */
export const readArtifact = (
  name: string,
): { abi: Abi; bytecode: `0x${string}` } => {
  const file = path.join(CONTRACTS_OUT, `${name}.sol`, `${name}.json`);

  if (!fs.existsSync(file)) {
    throw new Error(
      `${file} is missing. Run \`forge build\` in apps/contracts first.`,
    );
  }

  const artifact = JSON.parse(fs.readFileSync(file, "utf8")) as ForgeArtifact;

  return { abi: artifact.abi, bytecode: artifact.bytecode.object };
};
