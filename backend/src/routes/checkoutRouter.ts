import { Router } from "express";

const router = Router();

router.post("/", createCheckoutController);

export default router;
