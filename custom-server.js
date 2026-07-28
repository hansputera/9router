const http = require("http");
const https = require("https");

const origCreate = http.createServer.bind(http);
const origCreateSecure = https.createServer ? https.createServer.bind(https) : null;

// Wrap Next standalone HTTP server: derive client IP from the TCP socket
// and auto-open browser when running locally.
function makeWrappedHandler(handler) {
  return (req, res) => {
    const socketIp = req.socket && req.socket.remoteAddress ? req.socket.remoteAddress : "";
    const xff = req.headers["x-forwarded-for"];
    const xRealIp = req.headers["x-real-ip"];
    const viaProxy = !!(xff || xRealIp);
    const isLoopbackProxy = socketIp === "127.0.0.1" || socketIp === "::1" || socketIp === "::ffff:127.0.0.1";
    const proxyIp = xRealIp || (xff ? String(xff).split(",")[0].trim() : "");
    const ip = isLoopbackProxy && proxyIp ? proxyIp : socketIp;
    delete req.headers["x-9r-real-ip"];
    delete req.headers["x-forwarded-for"];
    delete req.headers["x-9r-via-proxy"];
    req.headers["x-9r-real-ip"] = ip;
    if (viaProxy) req.headers["x-9r-via-proxy"] = "1";
    return handler(req, res);
  };
}

// Patch http.createServer
http.createServer = (...args) => {
  const handler = args.find((a) => typeof a === "function");
  const rest = args.filter((a) => typeof a !== "function");
  if (!handler) return origCreate(...args);
  const wrapped = makeWrappedHandler(handler);

  const server = origCreate(...rest, wrapped);
  patchServerListen(server);
  return server;
};

// Patch https.createServer if available
if (origCreateSecure) {
  https.createServer = (...args) => {
    const handler = args.find((a) => typeof a === "function");
    const rest = args.filter((a) => typeof a !== "function");
    if (!handler) return origCreateSecure(...args);
    const wrapped = makeWrappedHandler(handler);

    const server = origCreateSecure(...rest, wrapped);
    patchServerListen(server);
    return server;
  };
}

let autoOpenDone = false;

function patchServerListen(server) {
  const origListen = server.listen.bind(server);
  server.listen = (...args) => {
    const result = origListen(...args);
    maybeOpenBrowser(args);
    return result;
  };
}

function getListenPort(args) {
  for (const a of args) {
    if (typeof a === "number") return a;
    if (typeof a === "object" && a !== null && a.port) return a.port;
  }
  return parseInt(process.env.PORT || "20128", 10);
}

function maybeOpenBrowser(args) {
  if (autoOpenDone) return;
  const port = getListenPort(args);
  const url = `http://localhost:${port}/dashboard`;
  autoOpenDone = true;

  // Wait for server to be ready
  setTimeout(() => {
    console.log(`\n  🌐 Dashboard: ${url}\n`);
    if (process.env.DISABLE_AUTO_OPEN !== "true") {
      try {
        const open = require("open");
        open(url, { wait: false }).catch(() => {});
      } catch {}
    }
  }, 2000);
}

require("./server.js");
