import { Router } from "express";
import { createUploadSchema } from "@pocket-locker/shared";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import { createUpload, confirmUpload } from "./files.service.js";

// Mounted under "/files" (see app.ts). All routes require auth.
export const filesRouter = Router();

filesRouter.use(requireAuth);

filesRouter.post(
  "/upload-url",
  asyncHandler(async (req, res) => {
    const input = createUploadSchema.parse(req.body);
    res.status(201).json(await createUpload(req.user!.id, input));
  }),
);

filesRouter.post(
  "/:id/confirm",
  asyncHandler(async (req, res) => {
    res.json(await confirmUpload(req.user!.id, req.params.id));
  }),
);
