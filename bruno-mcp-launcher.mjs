import { createBrunoMcpServer } from "@ostico/bruno-mcp";

createBrunoMcpServer()
  .start()
  .catch((error) => {
    console.error("Failed to start Bruno MCP Server:", error);
    process.exit(1);
  });
