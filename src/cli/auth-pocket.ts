import { serve } from "bun";

const consumerKey = process.env.POCKET_CONSUMER_KEY;
if (!consumerKey) {
  throw new Error("POCKET_CONSUMER_KEY is not set");
}

if (!process.env.PORT) {
  throw new Error("PORT is not set");
}
const PORT = parseInt(process.env.PORT, 10);
const REDIRECT_URI = `http://localhost:${PORT}/callback`;

async function getRequestToken(): Promise<string> {
  const response = await fetch("https://getpocket.com/v3/oauth/request", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "X-Accept": "application/json",
    },
    body: JSON.stringify({
      consumer_key: consumerKey,
      redirect_uri: REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get request token: ${response.statusText}`);
  }

  const data = await response.json();
  return data.code;
}

async function getAccessToken(requestToken: string): Promise<string> {
  const response = await fetch("https://getpocket.com/v3/oauth/authorize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "X-Accept": "application/json",
    },
    body: JSON.stringify({
      consumer_key: consumerKey,
      code: requestToken,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function main() {
  try {
    console.log("Starting Pocket OAuth flow...");

    // Get request token
    const requestToken = await getRequestToken();
    console.log(
      "\nRequest token received. Please visit this URL to authorize:"
    );
    console.log(
      `https://getpocket.com/auth/authorize?request_token=${requestToken}&redirect_uri=${encodeURIComponent(
        REDIRECT_URI
      )}`
    );

    // Start local server to receive callback
    const server = serve({
      port: PORT,
      async fetch(req) {
        const url = new URL(req.url);

        if (url.pathname === "/callback") {
          try {
            // Get access token
            const accessToken = await getAccessToken(requestToken);
            console.log("\nAccess token received successfully!");
            console.log("\nAdd this to your .env file:");
            console.log(`POCKET_ACCESS_TOKEN=${accessToken}`);

            return new Response(
              "Authorization successful! You can close this window.",
              {
                headers: { "Content-Type": "text/html" },
              }
            );
          } catch (error) {
            console.error("Failed to get access token");
            console.error(error);
            return new Response("Authorization failed. Please try again.", {
              status: 500,
              headers: { "Content-Type": "text/html" },
            });
          }
        }

        return new Response("Not found", { status: 404 });
      },
    });

    console.log(
      `\nWaiting for authorization at http://localhost:${PORT}/callback`
    );
    console.log("Press Ctrl+C to exit");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
