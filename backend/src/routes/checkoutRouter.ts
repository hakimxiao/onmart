import { Router } from "express";
import { createCheckoutController } from "../controllers/checkoutController";

const router = Router();

router.post("/", createCheckoutController);

export default router;
