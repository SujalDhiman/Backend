import express from "express"
import { registerUser , loginUser , logoutUser} from "../controllers/user.controller.js"
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import cookieParser from "cookie-parser"
const router=express.Router()


router.use(cookieParser())

router.route("/register").post(upload.fields([
    {
        name:"coverImage",
        maxCount:1
    },
    {
        name:"avatar",
        maxCount:1
    }
]),registerUser)

router.route("/login").post(loginUser)

router.route("/logout").get(verifyJWT,logoutUser)

export default router