import "dotenv/config";
import moduleAlias from "module";

// Intercept resolution of 'server-only' to bypass node context module error
const originalResolveFilename = (moduleAlias as any)._resolveFilename;
(moduleAlias as any)._resolveFilename = function (request: string, parent: any, isMain: boolean) {
  if (request === "server-only") {
    // Return a dummy resolved path
    return "server-only";
  }
  return originalResolveFilename.apply(this, arguments);
};

// Populate standard require cache entry for server-only
require.cache["server-only"] = {
  id: "server-only",
  filename: "server-only",
  loaded: true,
  exports: {}
} as any;

// Dynamically import the real implementation to ensure hooks are active
async function run() {
  console.log("→ Launching user creation script...");
  await import("./create-fuyad-user");
}

run().catch((err) => {
  console.error("✗ User creation failed:", err);
  process.exit(1);
});
