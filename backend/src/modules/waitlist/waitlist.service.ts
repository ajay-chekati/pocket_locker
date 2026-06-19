import { Prisma } from "@prisma/client";
import type { JoinWaitlistResponse } from "@pocket-locker/shared";
import { prisma } from "../../lib/prisma.js";

/** Normalize emails so "A@x.com" and "a@x.com" can't both join. */
const normalizeEmail = (email: string) => email.trim().toLowerCase();

/**
 * Add an email to the Pro waitlist. Idempotent: an email already on the list
 * resolves successfully with `alreadyJoined: true` rather than erroring, so the
 * UI shows the same "you're on the list" confirmation every time.
 */
export async function joinWaitlist(
  email: string,
): Promise<JoinWaitlistResponse> {
  const normalized = normalizeEmail(email);

  const existing = await prisma.waitlistEntry.findUnique({
    where: { email: normalized },
  });
  if (existing) return { joined: true, alreadyJoined: true };

  try {
    await prisma.waitlistEntry.create({ data: { email: normalized } });
    return { joined: true, alreadyJoined: false };
  } catch (err) {
    // A concurrent signup raced us to the unique email — treat as already joined.
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return { joined: true, alreadyJoined: true };
    }
    throw err;
  }
}
