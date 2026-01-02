import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// can pass object of origin and credentials
app.use(cors())
app.use(express.json({limit:"16kb"}));
app.use(express.urlencoded({extended:true,limit:"16kb"}));
app.use(express.static("public"));
app.use(cookieParser());

//Router part
import userRouter from "./routers/user.router.js";

app.use("/api/v1/user", userRouter);

export { app }