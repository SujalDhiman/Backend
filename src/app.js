import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"


const app=express()


app.use(cors({
    origin:"*",
    credentials:true
}))

app.use(cookieParser())

app.use(express.json({
    limit:"16kb"
}))
app.use(express.urlencoded({
    extended:true
}))
app.use(express.static("public"));

//routes import
import userRouter from "./routes/user.routes.js"

app.use("/api/v1/users",userRouter)
app.get("/check",(req,res)=>{
    console.log(req.cookies)
    res.send("badia sab")
})

export {app}