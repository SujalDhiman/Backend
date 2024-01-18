import dotenv from "dotenv"
import connectToDB from "./db/db.js"


dotenv.config({
    path:"../env"
})


connectToDB()