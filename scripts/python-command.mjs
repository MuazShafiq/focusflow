import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

const candidates =
  process.platform === "win32"
    ? [
        resolve(".venv", "Scripts", "python.exe"),
        resolve("services", "scheduler", ".venv", "Scripts", "python.exe"),
      ]
    : [
        resolve(".venv", "bin", "python"),
        resolve("services", "scheduler", ".venv", "bin", "python"),
      ];

const python =
  candidates.find((candidate) => existsSync(candidate)) ??
  (process.platform === "win32" ? "py" : "python3");
const child = spawn(python, process.argv.slice(2), { stdio: "inherit" });

child.on("error", (error) => {
  console.error(
    "Unable to run Python. Create .venv and install services/scheduler/requirements-dev.txt.",
    error,
  );
  process.exit(1);
});

child.on("exit", (code) => process.exit(code ?? 0));

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}
