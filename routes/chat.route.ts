import express from "express";
import { sendMessage } from "../controller/chat.controller";

const router = express.Router();

router.post("/send", sendMessage);

export default router;