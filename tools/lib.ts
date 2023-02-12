export function setupEnv() {
  const env = process.env;
  env["TWEEGO_PATH"] = "./assets";
  if (env["WSLENV"] != null) {
    env["WSLENV"] = `${env["WSLENV"]}:TWEEGO_PATH/l`;
  }
}
