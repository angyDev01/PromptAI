import express from "express";
import session from "express-session";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("database.sqlite");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT,
    role TEXT DEFAULT 'user',
    name TEXT,
    company TEXT,
    job_title TEXT,
    github_id TEXT UNIQUE,
    twitter_id TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "default_secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      },
    })
  );

  // Auth API
  app.post("/api/auth/register", (req, res) => {
    const { email, password, name, company, job_title } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    try {
      // Check if first user - make them admin
      const userCount = db.prepare("SELECT count(*) as count FROM users").get() as { count: number };
      const role = userCount.count === 0 ? "admin" : "user";

      const stmt = db.prepare(
        "INSERT INTO users (email, password, role, name, company, job_title) VALUES (?, ?, ?, ?, ?, ?)"
      );
      const result = stmt.run(email, password, role, name || null, company || null, job_title || null);
      
      const user = db.prepare("SELECT id, email, role, name FROM users WHERE id = ?").get(result.lastInsertRowid) as any;
      (req.session as any).userId = user.id;
      (req.session as any).userRole = user.role;
      
      res.json({ user });
    } catch (err: any) {
      if (err.message.includes("UNIQUE constraint failed")) {
        return res.status(400).json({ error: "Email already exists" });
      }
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;

    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    (req.session as any).userId = user.id;
    (req.session as any).userRole = user.role;
    
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  });

  app.get("/api/auth/me", (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = db.prepare("SELECT id, email, role, name, company, job_title FROM users WHERE id = ?").get(userId) as any;
    res.json({ user });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  // GitHub OAuth
  app.get("/api/auth/github/url", (req, res) => {
    const params = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID || "",
      redirect_uri: `${process.env.APP_URL || "http://localhost:3000"}/api/auth/github/callback`,
      scope: "user:email",
    });
    res.json({ url: `https://github.com/login/oauth/authorize?${params}` });
  });

  app.get("/api/auth/github/callback", async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send("No code provided");

    try {
      // Exchange code for token
      const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
        }),
      });
      const tokenData = await tokenRes.json() as any;
      const accessToken = tokenData.access_token;

      // Get user info
      const userRes = await fetch("https://api.github.com/user", {
        headers: { Authorization: `token ${accessToken}` },
      });
      const githubUser = await userRes.json() as any;

      // Get email
      const emailsRes = await fetch("https://api.github.com/user/emails", {
        headers: { Authorization: `token ${accessToken}` },
      });
      const emails = await emailsRes.json() as any[];
      const primaryEmail = emails.find((e: any) => e.primary)?.email || githubUser.email;

      // Find or create user
      let user = db.prepare("SELECT * FROM users WHERE github_id = ? OR email = ?").get(githubUser.id.toString(), primaryEmail) as any;

      if (!user) {
        const stmt = db.prepare(
          "INSERT INTO users (email, name, github_id) VALUES (?, ?, ?)"
        );
        const result = stmt.run(primaryEmail, githubUser.name || githubUser.login, githubUser.id.toString());
        user = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid);
      } else if (!user.github_id) {
        db.prepare("UPDATE users SET github_id = ? WHERE id = ?").run(githubUser.id.toString(), user.id);
        user.github_id = githubUser.id.toString();
      }

      (req.session as any).userId = user.id;
      (req.session as any).userRole = user.role;

      res.send(`
        <html>
          <body>
            <script>
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
              window.close();
            </script>
            <p>Authentification réussie. Cette fenêtre va se fermer.</p>
          </body>
        </html>
      `);
    } catch (err) {
      console.error(err);
      res.status(500).send("Authentication failed");
    }
  });

  // Twitter OAuth (OAuth 2.0)
  app.get("/api/auth/twitter/url", (req, res) => {
    const params = new URLSearchParams({
      response_type: "code",
      client_id: process.env.TWITTER_CLIENT_ID || "",
      redirect_uri: `${process.env.APP_URL || "http://localhost:3000"}/api/auth/twitter/callback`,
      scope: "tweet.read users.read email",
      state: "state",
      code_challenge: "challenge", // Simplified for demo
      code_challenge_method: "plain",
    });
    res.json({ url: `https://twitter.com/i/oauth2/authorize?${params}` });
  });

  app.get("/api/auth/twitter/callback", async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send("No code provided");

    try {
      const basicAuth = Buffer.from(`${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`).toString("base64");
      const tokenRes = await fetch("https://api.twitter.com/2/oauth2/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${basicAuth}`,
        },
        body: new URLSearchParams({
          code: code as string,
          grant_type: "authorization_code",
          client_id: process.env.TWITTER_CLIENT_ID || "",
          redirect_uri: `${process.env.APP_URL || "http://localhost:3000"}/api/auth/twitter/callback`,
          code_verifier: "challenge",
        }),
      });
      const tokenData = await tokenRes.json() as any;
      const accessToken = tokenData.access_token;

      const userRes = await fetch("https://api.twitter.com/2/users/me?user.fields=id,name,username", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const twitterData = await userRes.json() as any;
      const twitterUser = twitterData.data;

      // Note: Twitter email requires special permissions, using ID for now
      let user = db.prepare("SELECT * FROM users WHERE twitter_id = ?").get(twitterUser.id) as any;

      if (!user) {
        // Create a placeholder email if not found
        const email = `${twitterUser.username}@twitter.com`;
        const stmt = db.prepare(
          "INSERT INTO users (email, name, twitter_id) VALUES (?, ?, ?)"
        );
        const result = stmt.run(email, twitterUser.name, twitterUser.id);
        user = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid);
      }

      (req.session as any).userId = user.id;
      (req.session as any).userRole = user.role;

      res.send(`
        <html>
          <body>
            <script>
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
              window.close();
            </script>
            <p>Authentification réussie. Cette fenêtre va se fermer.</p>
          </body>
        </html>
      `);
    } catch (err) {
      console.error(err);
      res.status(500).send("Authentication failed");
    }
  });

  // Admin API example
  app.get("/api/admin/users", (req, res) => {
    if ((req.session as any).userRole !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    const users = db.prepare("SELECT id, email, role, name, company, job_title, created_at FROM users").all();
    res.json({ users });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
