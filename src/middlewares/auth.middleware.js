import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"


export const verifyJWT=async  (req,res,next)=>{

    // get data from cookies
    try {

        const token=req.cookies.accessToken 
        if(!token)
        res.status(400).json({
        success:false,
        message:"Unauthorized request"})

        const decodedToken=await jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)

        const user=await User.findOne(decodedToken._id).select("-password -refreshToken")

        if(!user)
            res.status(400).json({
            success:false,
            message:"Invalid token"})

        req.user=user._id
        next()
    } catch (error) {
        console.log("error in verify jwt ",error.message)
    }
}