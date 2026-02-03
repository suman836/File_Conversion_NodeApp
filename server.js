import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import multer from "multer";
import { OAuth2Client } from "google-auth-library";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
// ---------- AUDIT LOG STORE ----------
const auditLogs = [];

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ---------- MULTER (memory storage) ----------
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// ---------- JWT MIDDLEWARE ----------
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}
function addAuditLog({
  user,
  action,
  file,
  fromTo,
  status,
  message,
}) {
  auditLogs.unshift({
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    user,
    action,
    file,
    fromTo,
    status,
    message,
  });
}

// ---------- GOOGLE AUTH ----------
app.post("/api/auth/google", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Token missing" });
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const user = {
      name: payload.name,
      email: payload.email,
      picture: payload.picture,
    };

    const jwtToken = jwt.sign(user, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ token: jwtToken, user });
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(401).json({ error: "Invalid Google token" });
  }
});

// ---------- FILE CONVERT (MOCK RENAME) ----------
app.post(
  "/api/convert",
  authenticateToken,
  upload.single("file"),
  (req, res) => {
    try {
      const { targetType } = req.body;
      const file = req.file;

      if (!file || !targetType) {
        addAuditLog({
          user: req.user.email,
          action: "CONVERT",
          file: file?.originalname ?? "unknown",
          status: "FAILED",
          message: "Missing file or target type",
        });

        return res.status(400).json({ success: false });
      }

      const originalName = file.originalname;
      const baseName = originalName.split(".").slice(0, -1).join(".");
      const convertedName = `${baseName}.${targetType}`;

      addAuditLog({
        user: req.user.email,
        action: "CONVERT",
        file: originalName,
        fromTo: `${originalName.split(".").pop()?.toUpperCase()} → ${targetType.toUpperCase()}`,
        status: "SUCCESS",
      });

      res.json({
        success: true,
        convertedName,
      });
    } catch (err) {
      addAuditLog({
        user: req.user.email,
        action: "ERROR",
        file: req.file?.originalname ?? "unknown",
        status: "FAILED",
        message: "Internal error",
      });

      res.status(500).json({ success: false });
    }
  }
);

app.get("/api/audit-logs", authenticateToken, (req, res) => {
  res.json(auditLogs);
});

// ---------- HEALTH ----------
app.get("/health", (req, res) => {
  res.send("Backend running");
});

app.listen(process.env.PORT || 5000, () => {
  console.log("Backend running on port", process.env.PORT || 5000);
});
