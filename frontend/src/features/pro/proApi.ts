import type {
  JoinWaitlistRequest,
  JoinWaitlistResponse,
} from "@pocket-locker/shared";
import { api } from "../../lib/apiClient.js";

export const proApi = {
  joinWaitlist: (body: JoinWaitlistRequest) =>
    api<JoinWaitlistResponse>("/waitlist", { method: "POST", body }),
};
