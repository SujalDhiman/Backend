import { User } from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import jwt from "jsonwebtoken"

const generateAccessAndRefreshToken=async function (userId){

try {
    const user=await User.findById(userId)

    const accessToken=user.generateAccessToken()
    const refreshToken=user.generateRefreshToken()

    user.refreshToken=refreshToken

    await user.save({validateBeforeSave:false})

    return {accessToken,refreshToken}
} catch (error) {
    console.log("something went wrong while generating refresh and access token")
}

}

export const registerUser=async function(req,res){
    try {
        //get user details from frontend
        
        const {fullName,email,password,username}=req.body

        //validation
        if([fullName,email,password,username].some((ele)=>ele?.trim === ""))
            res.status(400).json({
            success:false,
            message:"All fields are required"})


        //check if user already exists
        const existedUser=await User.findOne({$or:[{username},{email}]})

        if(existedUser)
        res.status(400).json({
        success:false,
        message:"User already exists"})

        
        //check if image files are there or not
        const avatarLocalPath=req.files?.avatar?.[0]?.path;

        const coverImageLocalPath=req.files?.coverImage?.[0]?.path;

        if(!avatarLocalPath)
        res.status(400).json({
        success:false,
        message:"Cover Image is Required"})

        //upload them to cloudinary
        const avatar=await uploadOnCloudinary(avatarLocalPath)


        const coverImage=await uploadOnCloudinary(coverImageLocalPath)

        if(!avatar)
        res.status(400).json({
        success:false,
        message:"avatar error"})


        //create entry for user
        const user=await User.create({fullName,avatar:avatar.secure_url,username,password,email,coverImage:coverImage?.url || ""})
        
        const createdUser=await User.findById(user._id).select("-password -refreshToken")

        if(!createdUser)
        res.status(500).json({
        success:false,
        message:"error in creating user"})

        res.status(200).json({
            success:true,
            message:"User successfully registered",
            createdUser
        })
            
    } catch (error) {
        console.log(error.message)
        res.status(400).json({
            success:false,
            message:"An error occured",
            error:error.message
        })
    }
}


export const loginUser=async function (req,res){

    try {
        // grab the data
        const {email,username="",password}=req.body
        
        console.log(email,username,password)
        //find the user
        const user=await User.findOne({$or:[{username},{email}]})
    
        if(!user)
        res.status(400).json({
        success:false,
        message:"User does not exist"})
    
        // if found the user then validate the password
        const isValid=user.isPasswordCorrect(user.password)

        if(!isValid)
            res.status(400).json({
            success:false,
            message:"Incorrect Password"})

        const {accessToken,refreshToken}=await generateAccessAndRefreshToken(user._id)
        

        const loggedInUser=await User.findById(user._id).select("-password -refreshToken")

        const options={
            expiresIn:Date.now()+30*60*1000,
            httpOnly:true
        }


        res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options).json({
            success:true,
            message:"Successful Login",
            data:loggedInUser,accessToken,refreshToken
        })
    } catch (error) {
        console.log("error aaya ",error.message)
    }
}

export const logoutUser=async function (req,res){

    // find user
    const user=await User.findByIdAndUpdate(req.user,{
        $set:{
            refreshToken:undefined
        }},
        {
            new:true
        })
    let options={
        expiresIn:Date.now(),
        httpOnly:true
    }
    res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options).json({
        success:true,
        message:"Successfully Logged Out",
        data:user
    })
}

export const refreshAccessToken=async function (req,res){
    try {
        //grabbing refreshToken

        const incomingRefreshToken=req.cookies.refreshToken


        if(!incomingRefreshToken)
            res.status(400).json({
            success:false,
            message:"Unauthorized request"})

        const decodedToken=await jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)

        // finding the user
        const user=await User.findById(decodedToken.id)

        if(!user)
            res.status(400).json({
            success:false,
            message:"Invalid Refresh Token"})
        
        if(incomingRefreshToken !== user.refreshToken)
                res.status(400).json({
                success:false,
                message:"Refresh Token Expired"})

        const {accessToken,refreshToken}=await generateAccessAndRefreshToken(user._id)

        const options={
            expiresIn:Date.now()+30*60*1000,
            httpOnly:true
        }

        res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options).json({
                success:true,
                message:"Access token generated",
                refreshToken,
                accessToken
        })
        

    } catch (error) {
        console.log("error in refresh access token ",error.message)
    }
}