import { isIP } from "node:net";
import { networkInterfaces } from "node:os";
import concurrently from "concurrently";

const args = process.argv.slice(2);
const npmHost = process.env.npm_config_host;
const exposeNetwork =
  Boolean(npmHost) ||
  args.some(
    (argument) => argument === "--host" || argument.startsWith("--host="),
  );
const dryRun =
  args.includes("--dry-run") || process.env.npm_config_dry_run === "true";

const printHelp = () => {
  console.log(`FocusFlow development

Usage:
  npm run dev              Start on this computer only
  npm run dev -- --host    Also expose the app to this computer's local network

Optional:
  npm run dev -- --host=192.168.1.20
                           Use a specific local IPv4 address`);
};

if (args.includes("--help")) {
  printHelp();
  process.exit(0);
}

const explicitHost = (() => {
  const inline = args.find((argument) => argument.startsWith("--host="));
  if (inline) return inline.slice("--host=".length);

  const index = args.indexOf("--host");
  const candidate = index >= 0 ? args[index + 1] : undefined;
  if (candidate && !candidate.startsWith("--")) return candidate;

  return npmHost && npmHost !== "true" ? npmHost : undefined;
})();

const isPrivateIpv4 = (address) => {
  if (address.startsWith("10.") || address.startsWith("192.168.")) return true;
  const match = /^172\.(\d+)\./.exec(address);
  return match ? Number(match[1]) >= 16 && Number(match[1]) <= 31 : false;
};

const findLanAddress = () => {
  const virtualAdapter =
    /bluetooth|docker|hyper-v|loopback|tailscale|virtual|vbox|vethernet|vmware|wsl|zerotier/i;
  const candidates = Object.entries(networkInterfaces()).flatMap(
    ([adapter, addresses]) =>
      (addresses ?? [])
        .filter(
          (address) =>
            address.family === "IPv4" &&
            !address.internal &&
            isPrivateIpv4(address.address),
        )
        .map((address) => ({
          adapter,
          address: address.address,
          score:
            (/wi-?fi|wlan/i.test(adapter) ? 100 : 0) +
            (/ethernet/i.test(adapter) ? 70 : 0) +
            (virtualAdapter.test(adapter) ? -200 : 0) +
            (address.address.startsWith("192.168.") ? 30 : 0) +
            (address.address.startsWith("10.") ? 20 : 0),
        })),
  );

  return candidates.sort((left, right) => right.score - left.score)[0]?.address;
};

if (explicitHost && isIP(explicitHost) !== 4) {
  console.error(`Invalid IPv4 address: ${explicitHost}`);
  process.exit(1);
}

const lanAddress = exposeNetwork
  ? (explicitHost ?? findLanAddress())
  : undefined;

if (exposeNetwork && !lanAddress) {
  console.error(
    "FocusFlow could not detect a private LAN address. Use --host=<your-ip>.",
  );
  process.exit(1);
}

const apiEnvironment = { ...process.env };
const webEnvironment = { ...process.env };
let webCommand = "npm run dev:web";

if (lanAddress) {
  const localWebUrl = "http://localhost:5173";
  const phoneWebUrl = `http://${lanAddress}:5173`;

  apiEnvironment.DEV_SERVER_HOST = "0.0.0.0";
  apiEnvironment.WEB_ORIGIN = [process.env.WEB_ORIGIN, localWebUrl, phoneWebUrl]
    .filter(Boolean)
    .filter((origin, index, origins) => origins.indexOf(origin) === index)
    .join(",");
  webEnvironment.VITE_API_URL = `http://${lanAddress}:4000/api`;
  webCommand = "npm run dev -w @focusflow/web -- --host 0.0.0.0";

  console.log("\nFocusFlow network development enabled");
  console.log(`Phone:     ${phoneWebUrl}`);
  console.log(`Computer:  ${localWebUrl}`);
  console.log("Keep the phone and computer on the same private network.");
  console.log("Allow Node.js through Windows Firewall if prompted.\n");
} else {
  console.log("\nFocusFlow development: http://localhost:5173\n");
}

if (dryRun) process.exit(0);

const { result } = concurrently(
  [
    {
      command: "npm run dev:api:local",
      name: "API",
      prefixColor: "blue",
      env: apiEnvironment,
    },
    {
      command: "npm run dev:scheduler",
      name: "SCHEDULER",
      prefixColor: "yellow",
      env: process.env,
    },
    {
      command: webCommand,
      name: "WEB",
      prefixColor: "green",
      env: webEnvironment,
    },
  ],
  {
    handleInput: true,
    killOthersOn: ["failure"],
    prefix: "name",
  },
);

try {
  await result;
} catch (events) {
  const failure = events.find(
    (event) => !event.killed && event.exitCode !== 0 && event.exitCode !== null,
  );
  if (failure) process.exitCode = failure.exitCode ?? 1;
}
