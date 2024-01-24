import dotenv from "dotenv"
import connectToDB from "./db/db.js"
import { app } from "./app.js"

dotenv.config({
    path:"./.env"
})


connectToDB().then(()=>{
    app.listen(process.env.PORT,()=>{
        console.log(`Server is running at port ${process.env.PORT}`)
    })
}).catch((error)=>{
    console.log("MongoDB connection error")
})