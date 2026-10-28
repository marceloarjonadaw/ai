import { env } from "cloudflare:workers";
import OAuthProvider from "@cloudflare/workers-oauth-provider";
import { McpServer } from "@modelcontextprotocol/server";
import {
  createMcpHandler,
  getMcpAuthContext,
} from "agents/mcp/server";
import { z } from "zod";
import { GoogleHandler } from "./google-handler";

export type Props = {
  name: string;
  email: string;
  accessToken: string;
};

function createServer() {
  const server = new McpServer({
    name: "News Telegram MCP",
    version: "1.0.0",
  });

  server.registerTool(
    "add",
    {
      description: "Adds two numbers.",
      inputSchema: z.object({
        a: z.number(),
        b: z.number(),
      }),
    },
    async ({ a, b }) => ({
      content: [{ type: "text", text: String(a + b) }],
    }),
  );

  server.registerTool(
    "send_telegram_message",
    {
      description:
        "Send a message to the owner's private Telegram chat.",
      inputSchema: z.object({
        message: z.string().min(1).max(4096),
      }),
    },
    async ({ message }) => {
      const auth = getMcpAuthContext();
      const email = String(
        auth?.props?.email ?? ""
      ).trim().toLowerCase();

      const authorizedEmail = String(
        env.AUTHORIZED_GOOGLE_EMAIL ?? ""
      ).trim().toLowerCase();

      if (
        !email ||
        !authorizedEmail ||
        email !== authorizedEmail
      ) {
        return {
          isError: true,
          content: [
            { type: "text", text: "Not authorized." },
          ],
        };
      }

      // Telegram sending remains disabled until
      // authentication has been verified.
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: "Telegram sending is not enabled yet.",
          },
        ],
      };
    },
  );

  return server;
}

const mcpHandler = createMcpHandler(createServer);

export default new OAuthProvider<Env>({
  apiHandler: {
    fetch(request: Request, env: Env, ctx: ExecutionContext) {
      return mcpHandler(request, env, ctx);
    },
  },
  apiRoute: "/mcp",
  authorizeEndpoint: "/authorize",
  clientRegistrationEndpoint: "/register",
  defaultHandler: GoogleHandler as any,
  tokenEndpoint: "/token",
  resourceMetadata: { resource: env.MCP_RESOURCE },
});
