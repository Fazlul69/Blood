import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { signSession, signRegistrationToken, verifyRegistrationToken } from "../lib/jwt";

export const authRouter = Router();

const PHONE_REGEX = /^\+\d{8,15}$/;
const OTP_TTL_MS = 5 * 60 * 1000;

const sendOtpSchema = z.object({ phone: z.string().regex(PHONE_REGEX, "Use a phone number with country code, e.g. +14155551234") });

/**
 * MOCK OTP — there is no real SMS provider wired up yet. The code is generated
 * here and handed straight back in the response so the frontend can display it
 * to the user directly. Swap this for a real SMS provider (Twilio Verify, MSG91,
 * etc.) once user volume justifies the cost, and stop returning `otp` in the response.
 */
authRouter.post("/send-otp", async (req, res) => {
  const parsed = sendOtpSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const code = String(Math.floor(100000 + Math.random() * 900000));
  await prisma.otpCode.upsert({
    where: { phone: parsed.data.phone },
    create: { phone: parsed.data.phone, code, expiresAt: new Date(Date.now() + OTP_TTL_MS) },
    update: { code, expiresAt: new Date(Date.now() + OTP_TTL_MS) },
  });
  res.json({ phone: parsed.data.phone, otp: code, demoMode: true });
});

const verifyOtpSchema = z.object({ phone: z.string().regex(PHONE_REGEX), code: z.string().length(6) });

authRouter.post("/verify-otp", async (req, res) => {
  const parsed = verifyOtpSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { phone, code } = parsed.data;

  const otp = await prisma.otpCode.findUnique({ where: { phone } });
  if (!otp || otp.code !== code || otp.expiresAt.getTime() < Date.now()) {
    res.status(400).json({ error: "Invalid or expired code" });
    return;
  }
  await prisma.otpCode.delete({ where: { phone } });

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    res.json({ isNewUser: true, phone, registrationToken: signRegistrationToken(phone) });
    return;
  }
  if (user.status === "banned") {
    res.status(403).json({ error: "This account has been banned" });
    return;
  }

  const token = signSession({ userId: user.id, role: user.role });
  res.json({ isNewUser: false, token, user });
});

const registerSchema = z.object({
  registrationToken: z.string().min(1),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  name: z.string().min(1).max(100),
  bloodGroup: z.enum(["A_POS", "A_NEG", "B_POS", "B_NEG", "AB_POS", "AB_NEG", "O_POS", "O_NEG"]),
  gender: z.string().max(20).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  addressText: z.string().max(255).optional(),
});

authRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  let phone: string;
  try {
    phone = verifyRegistrationToken(parsed.data.registrationToken);
  } catch {
    res.status(401).json({ error: "Registration session expired — please verify your phone number again" });
    return;
  }

  const existingByPhone = await prisma.user.findUnique({ where: { phone } });
  if (existingByPhone) {
    res.status(409).json({ error: "This phone number is already registered" });
    return;
  }

  const existingUsername = await prisma.user.findUnique({ where: { username: parsed.data.username } });
  if (existingUsername) {
    res.status(409).json({ error: "Username is already taken" });
    return;
  }

  const user = await prisma.user.create({
    data: {
      phone,
      username: parsed.data.username,
      name: parsed.data.name,
      bloodGroup: parsed.data.bloodGroup,
      gender: parsed.data.gender,
      lat: parsed.data.lat,
      lng: parsed.data.lng,
      addressText: parsed.data.addressText,
    },
  });

  const token = signSession({ userId: user.id, role: user.role });
  res.status(201).json({ token, user });
});
