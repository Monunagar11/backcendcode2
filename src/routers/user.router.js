import { registerUser } from "../controllers/user.controller.js";
import { Router } from "express";

const router = Router();

router.route("/register").get(registerUser);

export default router