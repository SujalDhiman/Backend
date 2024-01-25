import { User } from "../models/user.model.js"
import {uploadOnCloudinary , deleteFileFromCloudinary} from "../utils/cloudinary.js"
import jwt from "jsonwebtoken"
import fs from "fs"

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
        return res.status(400).json({
        success:false,
        message:"User already exists"})

        
        //check if image files are there or not
        const avatarLocalPath=req.files?.avatar?.[0]?.path;

        const coverImageLocalPath=req.files?.coverImage?.[0]?.path;

        if(!avatarLocalPath)
        return res.status(400).json({
        success:false,
        message:"Cover Image is Required"})

        //upload them to cloudinary
        const avatar=await uploadOnCloudinary(avatarLocalPath)

        console.log("response from cloudinary ",avatar)
        const coverImage=await uploadOnCloudinary(coverImageLocalPath)

        if(!avatar)
        return res.status(400).json({
        success:false,
        message:"avatar error"})


        //create entry for user
        const user=await User.create({fullName,avatar:{public_id:avatar.public_id,
        url:avatar.secure_url},username,password,email,coverImage:{public_id:coverImage?.public_id || "" , url : coverImage?.secure_url || ""}})
        
        const createdUser=await User.findById(user._id).select("-password -refreshToken")

        if(!createdUser)
        return res.status(500).json({
        success:false,
        message:"error in creating user"})

        return res.status(200).json({
            success:true,
            message:"User successfully registered",
            createdUser
        })
            
    } catch (error) {
        console.log("error in register user ",error.message)
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
        return res.status(400).json({
        success:false,
        message:"User does not exist"})
    
        // if found the user then validate the password
        const isValid=await user.isPasswordCorrect(password)

        if(!isValid)
            return res.status(400).json({
            success:false,
            message:"Incorrect Password"})

        const {accessToken,refreshToken}=await generateAccessAndRefreshToken(user._id)
        

        const loggedInUser=await User.findById(user._id).select("-password -refreshToken")

        const options={
            expiresIn:Date.now()+30*60*1000,
            httpOnly:true
        }


        return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options).json({
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
            return res.status(400).json({
            success:false,
            message:"Invalid Refresh Token"})
        
        if(incomingRefreshToken !== user.refreshToken)
                return res.status(400).json({
                success:false,
                message:"Refresh Token Expired"})

        const {accessToken,refreshToken}=await generateAccessAndRefreshToken(user._id)

        const options={
            expiresIn:Date.now()+30*60*1000,
            httpOnly:true
        }

        return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options).json({
                success:true,
                message:"Access token generated",
                refreshToken,
                accessToken
        })
        

    } catch (error) {
        console.log("error in refresh access token ",error.message)
    }
}

export const changeCurrentPassword=async function (req,res){

   try {

        const {oldPassword,newPassword}=req.body
 
        //find user
        const loggedInUser=await User.findById(req.user)

        const isValidOldPassword=await loggedInUser.isPasswordCorrect(oldPassword)

        if(!isValidOldPassword)
            return res.status(400).json({
            success:false,
            message:"Incorrect old password "})
        
        loggedInUser.password=newPassword

        const response=await loggedInUser.save({validateBeforeSave:false})
        
        response.password=undefined
        response.refreshToken=undefined

        console.log("response after changing password ",response)

        res.status(200).json({
            success:true,
            message:"password changed successfully",
            data:response
        })
    
   } catch (error) {
        console.log("something went wrong in change current password ",error.message)
   }
}

export const getCurrentUser=async function(req,res){


    const user=await User.findById(req.user).select("-password -refreshToken")

    res.status(200).json({
        success:true,
        message:"get details successful",
        data:user
    })

}

export const updateUserAvatar=async function(req,res){

    try {
        const avatarFile=req.file
        
        if(avatarFile === undefined)
        return res.status(400).json({
            success:true,
            message:"avatar image is required"})
    
        const user=await User.findById(req.user)
        
    
        const responseAfterDeleting=deleteFileFromCloudinary(user.avatar.public_id)
    
        const newFileDetails=await uploadOnCloudinary(avatarFile.path)
    
        user.avatar.public_id=newFileDetails.public_id
        user.avatar.url=newFileDetails.secure_url
    
        await user.save({validateBeforeSave:false})
        

        return res.status(200).json({
            success:true,
            message:"Avatar updated successfully"
        })
    } catch (error) {
        console.log("error in updating user avatar ",error.message)
    }

}