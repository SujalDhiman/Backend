import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app=express()


app.use(cors({
    origin:"*"
}))
app.use(express.json({
    limit:"16kb"
}))
app.use(express.urlencoded({
    extended:true
}))
app.use(cookieParser())

export {app}