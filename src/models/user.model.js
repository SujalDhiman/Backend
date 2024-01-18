import mongoose from "mongoose"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const userSchema=new mongoose.Schema(
    {
        username:{
            type:String,
            lowercase:true,
            required:[true,"field is required"],
            unique:[true,"name already taken"],
            index:true
        },
        email:{
            type:String,
            lowercase:true,
            required:[true,"field is required"],
            unique:[true,"name already taken"]
        },
        fullName:{
            type:String,
            lowercase:true,
            required:[true,"field is required"],
            index:true
        },
        avatar:{
            type:String,
            required:true
        },
        coverImage:{
            type:String
        },
        watchHistory:[
            {
                type:mongoose.Schema.Types.ObjectId,
                ref:"Video"
            }
        ],
        password:{
            type:String,
            required:[true,"password is required"],
        },
        refreshToken:{
            type:String
        }
    },
    {
        timestamps:true
    }
)

userSchema.pre("save",async function (next){
    if(this.isModified("password"))
    this.password=bcrypt.hash(this.password,10);
    return next()
})

userSchema.methods.isPasswordCorrect=async function(gotPassword){
    return await bcrypt.compare(gotPassword,this.password)
}

userSchema.methods.generateAccessToken=function (){
    const payload={
        id:this._id,
        email:this.email,
        username:this.username,
        fullName:this.fullName
    };

    const token=jwt.sign(payload,process.env.ACCESS_TOKEN_SECRET,{
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    })

    return token
}

userSchema.methods.generateRefreshToken=function(){
    const payload={
        id:this._id,
    };

    const token=jwt.sign(payload,process.env.REFRESH_TOKEN_SECRET,{
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    })

    return token
}

export const User=mongoose.model("User",userSchema)