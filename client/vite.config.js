import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const clientDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(clientDir, "..");

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, projectDir, "");
  const geminiKey = (env.GEMINI_API_KEY || "").trim();
  const model = (env.GEMINI_MODEL || "gemini-3.8-flash").trim();

  return {
    root: clientDir,
    envDir: projectDir,
    base: "/welthtrack.v4/",
    plugins: [
      react(),
      {
        name: "wealthbot-gemini-api",
        configureServer(server) {
          server.middlewares.use("/api/wealthbot/health", (_req, res) => {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(JSON.stringify({
              ok: true,
              configured: Boolean(geminiKey),
              provider: "Google Gemini",
              model,
              hint: geminiKey
                ? "Gemini key loaded from project-root .env"
                : "Create project-root .env with GEMINI_API_KEY=..."
            }));
          });

          server.middlewares.use("/api/wealthbot/chat", async (req, res) => {
            if (req.method !== "POST") {
              res.statusCode = 405;
              res.setHeader("Content-Type", "application/json; charset=utf-8");
              res.end(JSON.stringify({ error: "POST required" }));
              return;
            }

            if (!geminiKey) {
              res.statusCode = 503;
              res.setHeader("Content-Type", "application/json; charset=utf-8");
              res.end(JSON.stringify({
                error: "WealthBot Gemini is not configured. Add GEMINI_API_KEY to the .env file beside package.json, then restart Vite."
              }));
              return;
            }

            try {
              const chunks = [];
              for await (const chunk of req) chunks.push(chunk);
              const rawBody = Buffer.concat(chunks).toString("utf8") || "{}";
              const body = JSON.parse(rawBody);

              const systemInstruction = String(
                body.instructions ||
                "You are WealthBot, a helpful personal-finance assistant. Do not invent facts, prices, or sources. Clearly distinguish web facts from user-provided WealthTrack data."
              );

              const userMessage = String(body.message || "");
              if (!userMessage.trim()) {
                res.statusCode = 400;
                res.setHeader("Content-Type", "application/json; charset=utf-8");
                res.end(JSON.stringify({ error: "Message is required" }));
                return;
              }

              const payload = {
                system_instruction: {
                  parts: [{ text: systemInstruction }]
                },
                contents: [
                  {
                    role: "user",
                    parts: [{ text: userMessage }]
                  }
                ]
              };

              if (body.useWeb) {
                payload.tools = [{ google_search: {} }];
              }

              const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
              const response = await fetch(url, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-goog-api-key": geminiKey
                },
                body: JSON.stringify(payload)
              });

              const responseText = await response.text();
              if (!response.ok) {
                let message = responseText;
                try {
                  const parsed = JSON.parse(responseText);
                  message = parsed?.error?.message || parsed?.error || responseText;
                } catch {}
                throw new Error(`Gemini request failed (${response.status}): ${message}`);
              }

              const result = JSON.parse(responseText);
              const outputText = (result.candidates?.[0]?.content?.parts || [])
                .map(part => part.text || "")
                .filter(Boolean)
                .join("\n");

              const grounding = result.candidates?.[0]?.groundingMetadata || null;

              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json; charset=utf-8");
              res.end(JSON.stringify({
                output_text: outputText || "Gemini returned no text.",
                groundingMetadata: grounding
              }));
            } catch (error) {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json; charset=utf-8");
              res.end(JSON.stringify({
                error: error?.message || "WealthBot Gemini API request failed"
              }));
            }
          });
        }
      }
    ],
    server: {
      port: 5173,
      host: true,
      proxy: {
        "/market": {
          target: "https://query1.finance.yahoo.com",
          changeOrigin: true,
          secure: true,
          rewrite: (reqPath) => reqPath.replace(/^\/market/, "")
        }
      }
    }
  };
});
