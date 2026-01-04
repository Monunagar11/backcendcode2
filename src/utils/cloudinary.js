import { v2 as cloudinary} from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name : "dnm5siaq8",
    api_key : '278543464267282',
    api_secret :'lhRBKyQSQXNwa_6Isrw1P1SNb0I'
})

const uploadOnClodinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null;
        // upload on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type : "auto"
        })
        // file upload successfully
        console.log("file uploaded successfully")
        fs.unlinkSync(localFilePath);
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath); //remove the locally saved temparary file as the upload operation failed
        return null;
    }
}

export { uploadOnClodinary }