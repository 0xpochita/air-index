import fs from "node:fs";

const ENV_PATH = ".env";

/**
 * Scripts run outside Next, which loads .env itself, so every entry point has
 * to do it explicitly. Safe to call more than once.
 */
export const loadEnv = () => {
  try {
    process.loadEnvFile(ENV_PATH);
  } catch {
    return;
  }
};

/** Replaces the key in place if present, appends it otherwise. Keeps file mode 600. */
export const writeEnv = (key: string, value: string) => {
  const current = fs.readFileSync(ENV_PATH, "utf8");
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, "m");

  const next = pattern.test(current)
    ? current.replace(pattern, line)
    : `${current.trimEnd()}\n${line}\n`;

  fs.writeFileSync(ENV_PATH, next, { mode: 0o600 });
  console.log(`  .env ${key}=${value}`);
};
