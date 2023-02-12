import cp from "child_process";

/** Alias for JSON.stringify */
export const json = (o: unknown) => JSON.stringify(o);

/** Sets env vars for running tweego */
export function setupEnv(): void {
  const env = process.env;
  env["TWEEGO_PATH"] = "./assets";
  if (env["WSLENV"] != null) {
    env["WSLENV"] = `${env["WSLENV"]}:TWEEGO_PATH/l`;
  }
}

/**
 * Executes a shell command.
 * Writes stdout/stderr to parent stdout/stderr.
 * Rejects on error or non-empty stderr.
 * Resolves to output that was written to stdout.
 */
export function runP(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      let stdout = "";
      let gotStderr = false;
      const child = cp.spawn(command, { shell: true });
      child.stderr.on("data", (data: Buffer) => {
        gotStderr = true;
        process.stderr.write(data);
      });
      child.stdout.on("data", (data: Buffer) => {
        stdout += data.toString("utf-8");
        process.stdout.write(data);
      });
      child.on("error", (e) => {
        reject(e);
      });
      child.on("exit", (code, sig) => {
        if (code !== 0) {
          reject(new Error(`${json(command)} exited with ${code} ${sig}`));
        }
        if (gotStderr) {
          reject(new Error(`${json(command)} wrote to stderr`));
        }
        resolve(stdout);
      });
    } catch (e) {
      reject(e);
    }
  });
}

/** Returns a friendly-ish timestamp string. */
export function timestamp(): string {
  const now = new Date().toISOString();
  return now.replace("T", " ");
}
