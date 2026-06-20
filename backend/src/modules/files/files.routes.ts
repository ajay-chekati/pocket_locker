import { Router } from "express";
import {
  createUploadSchema,
  listFilesQuerySchema,
} from "@pocket-locker/shared";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import {
  confirmUpload,
  createUpload,
  deleteFile,
  getUsage,
  getViewUrl,
  listFiles,
} from "./files.service.js";

// Mounted under "/files" (see app.ts). All routes require auth.
export const filesRouter = Router();

filesRouter.use(requireAuth);

filesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = listFilesQuerySchema.parse(req.query);
    res.json(await listFiles(req.user!.id, query));
  }),
);

filesRouter.post(
  "/upload-url",
  asyncHandler(async (req, res) => {
    const input = createUploadSchema.parse(req.body);
    res.status(201).json(await createUpload(req.user!.id, input));
  }),
);

filesRouter.get(
  "/usage",
  asyncHandler(async (req, res) => {
    res.json(await getUsage(req.user!.id));
  }),
);

filesRouter.get(
  "/:id/view-url",
  asyncHandler(async (req, res) => {
    res.json(await getViewUrl(req.user!.id, req.params.id));
  }),
);

filesRouter.post(
  "/:id/confirm",
  asyncHandler(async (req, res) => {
    res.json(await confirmUpload(req.user!.id, req.params.id));
  }),
);

filesRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await deleteFile(req.user!.id, req.params.id);
    res.status(204).send();
  }),
);
