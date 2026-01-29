import { Router, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import { prisma } from "@puenteflow/db";
import type { RefreshToken } from "@prisma/client";
import { z } from "zod";
import { authRateLimiter } from "../middleware/rateLimit";
import { config } from "../config";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
  workspaceName: z.string().min(2)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const magicSchema = z.object({
  email: z.string().email() });

const generateTokens = (user: { id: string; email: string }) => {
  const accessSecret: Secret = config.jwtSecret;
  const refreshSecret: Secret = config.jwtRefreshSecret;
  const accessOptions: SignOptions = { expiresIn: config.jwtExpiresIn as SignOptions["expiresIn"] };
  const refreshOptions: SignOptions = { expiresIn: config.jwtRefreshExpiresIn as SignOptions["expiresIn"] };
  const accessToken = jwt.sign({ sub: user.id, email: user.email }, accessSecret, accessOptions);
  const refreshToken = jwt.sign({ sub: user.id, email: user.email }, refreshSecret, refreshOptions);
  return { accessToken, refreshToken };
};

router.post("/register", authRateLimiter, async (req: Request, res: Response) => {
  const input = registerSchema.parse(req.body);
  const passwordHash = await bcrypt.hash(input.password, 10);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      passwordHash,
      memberships: {
        create: {
          role: "OWNER",
          workspace: { create: { name: input.workspaceName } }
        }
      }
    }
  });

  const { accessToken, refreshToken } = generateTokens(user);
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: await bcrypt.hash(refreshToken, 10),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  });

  res.json({ accessToken, refreshToken });
});

router.post("/login", authRateLimiter, async (req: Request, res: Response) => {
  const input = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || !user.passwordHash) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const { accessToken, refreshToken } = generateTokens(user);
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: await bcrypt.hash(refreshToken, 10),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  });

  res.json({ accessToken, refreshToken });
});

router.post("/magic-link", authRateLimiter, async (req: Request, res: Response) => {
  const input = magicSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    return res.status(200).json({ message: "If the email exists, a link will be sent." });
  }
  const magicSecret: Secret = config.jwtSecret;
  const magicOptions: SignOptions = { expiresIn: "15m" };
  const token = jwt.sign({ sub: user.id, email: user.email, type: "magic" }, magicSecret, magicOptions);
  await prisma.magicLinkToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000)
    }
  });
  res.json({ message: "Magic link created", token });
});

router.post("/magic-link/verify", async (req: Request, res: Response) => {
  const token = z.string().parse(req.body?.token);
  try {
    const payload = jwt.verify(token, config.jwtSecret) as { sub: string; email: string; type: string };
    if (payload.type !== "magic") {
      return res.status(400).json({ error: "Invalid token" });
    }
    const record = await prisma.magicLinkToken.findUnique({ where: { token } });
    if (!record || record.expiresAt < new Date()) {
      return res.status(400).json({ error: "Token expired" });
    }

    const { accessToken, refreshToken } = generateTokens({ id: payload.sub, email: payload.email });
    await prisma.refreshToken.create({
      data: {
        userId: payload.sub,
        tokenHash: await bcrypt.hash(refreshToken, 10),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    res.json({ accessToken, refreshToken });
  } catch (error) {
    res.status(400).json({ error: "Invalid token" });
  }
});

router.post("/refresh", async (req: Request, res: Response) => {
  const token = z.string().parse(req.body?.refreshToken);
  try {
    const payload = jwt.verify(token, config.jwtRefreshSecret) as { sub: string; email: string };
    const tokens: RefreshToken[] = await prisma.refreshToken.findMany({ where: { userId: payload.sub } });
    const matches = await Promise.all(tokens.map((t) => bcrypt.compare(token, t.tokenHash)));
    if (!matches.some(Boolean)) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const { accessToken, refreshToken } = generateTokens({ id: payload.sub, email: payload.email });
    await prisma.refreshToken.create({
      data: {
        userId: payload.sub,
        tokenHash: await bcrypt.hash(refreshToken, 10),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    res.json({ accessToken, refreshToken });
  } catch (error) {
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

export default router;
