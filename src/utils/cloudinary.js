import {v2 as cloudinary}  from "cloudinary"
import fs from "fs"
          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key:process.env.CLOUDINARY_API_KEY, 
  api_secret:process.env.CLOUDINARY_API_SECRET 
});


const uploadOnCloudinary=async (localFilePath)=>{

    try {
        
        if(!localFilePath) return null;
        const response=await cloudinary.uploader.upload(localFilePath,
            {
                folder:"videoTube",
                resource_type:"auto"
            })
        

        fs.unlinkSync(localFilePath)
        return response
        
    } catch (error) {
        fs.unlinkSync(localFilePath)
        return null
    }
}

const deleteFileFromCloudinary=async (fileURL)=>{

    try {

        if(!fileURL)
        return null

        const response=await cloudinary.uploader.destroy(fileURL)

        return response.result

    } catch (error) {
        console.log("something went wrong while deleting file ",error.message)
    }

}

export {uploadOnCloudinary,deleteFileFromCloudinary}