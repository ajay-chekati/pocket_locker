import { z } from "zod";

/** Body for `POST /waitlist` — joining the Pro "coming soon" waitlist. */
export const joinWaitlistSchema = z.object({
  email: z.string().email().max(254),
});

export type JoinWaitlistRequest = z.infer<typeof joinWaitlistSchema>;

/**
 * Result of joining the waitlist. `joined` is always true on success;
 * `alreadyJoined` is true when the email was already on the list, so the
 * endpoint is idempotent and the UI can show the same confirmation either way.
 */
export interface JoinWaitlistResponse {
  joined: true;
  alreadyJoined: boolean;
}
