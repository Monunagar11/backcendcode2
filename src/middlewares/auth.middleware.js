import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";

 export const verifyJWT = asyncHandler( async(req, res, next) => { //if res us not used we can us _ in production if somthing is not used
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","");
    console.log(req.cookies)
        if(!token){
            throw new ApiError(401, "Unauthorized access")
        }
    
        const decodeToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
        const user = await User.findById(decodeToken?._id).select("-password -refreshToken");
        if(!user){
            throw new ApiError(401, "Invalid token")
        };
    
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid token");
        
    }
})