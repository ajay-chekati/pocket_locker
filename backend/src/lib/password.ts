import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export const hashPassword = (plain: string): Promise<string> =>
  bcrypt.hash(plain, SALT_ROUNDS);

export const verifyPassword = (
  plain: string,
  hash: string,
): Promise<boolean> => bcrypt.compare(plain, hash);

/**
 * A valid bcrypt hash of a throwaway value. Used to equalize login timing for
 * unknown emails so response time doesn't reveal which emails are registered.
 */
export const DUMMY_PASSWORD_HASH = bcrypt.hashSync("unused-dummy-password", SALT_ROUNDS);
