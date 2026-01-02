import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnClodinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler( async (req, res) =>{
    const { fullName, username, email, password } = req.body;

    if(
        [ fullName, username, email, password ].some((field) => 
        field?.trim() === "" )
    ){
        throw new ApiError(400, "All Fields are required")
    }

    const existedUser = User.findOne(
        {
            $or : [{ username }, { email }]
        }
    )
    if(existedUser){
        throw new ApiError(409, "User already exists");
    }

    const avatarLocalPath = req.files?.avatar[0].path;
    const coverImageLocalPath = req.files?.coverImage[0].path;

    if(avatarLocalPath){
        throw new ApiError(400, "Avatar Image is required");
    }

    const avatar = uploadOnClodinary(avatarLocalPath);
    const coverImage = uploadOnClodinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400, "Avatar Image is required");
    }

    const user = User.create(
        {
            username : username.toLowerCase(),
            fullname,
            email,
            password,
            avatar : avatar.url,
            coverImage : coverImage?.url || ""
        }
    )

    const createdUser = User.findById(user._id).select(
        "-password -refreshToken"
    );

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User created successfully")
    )

})

export {
    registerUser
}