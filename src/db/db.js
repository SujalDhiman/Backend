import mongoose from "mongoose"
import { DB_NAME } from "../constants.js"

const connectToDB=async ()=>{
    try {
        const connectionInstance=await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        console.log("MongoDB successfully connected")
    } catch (error) {
        console.log(`MongoDB connection error message ${error.message}`)
        process.exit(1)
    }
}

export default connectToDB