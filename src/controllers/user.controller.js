import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnClodinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userid) =>{
    try{
    const user = await User.findById(userid);

    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
    
    user.refreshToken = refreshToken;
    await user.save({validateBeforeSave: false});

    return { accessToken, refreshToken }
    }
    catch(error){
        throw new ApiError("500", "Something went wrong while generating tokens");
    }
}

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, username, email, password } = req.body;
  console.log("1")

  if (
    [fullName, username, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All Fields are required");
  }
  console.log("2")

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User already exists");
  }
  console.log("3")

  const avatarLocalPath = req.files?.avatar[0].path;
  const coverImageLocalPath = req.files?.coverImage[0].path;
  console.log("4")

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar Image is required");
  }

  const avatar = await uploadOnClodinary(avatarLocalPath);
  const coverImage = await uploadOnClodinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar Image is required");
  }

  const user = await User.create({
    username: username.toLowerCase(),
    fullName,
    email,
    password,
    avatar: avatar?.url,
    coverImage: coverImage?.url || "",
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User created successfully"));
});

const loginUser = asyncHandler( async(req, res)=> {
    const {username, email, password } = req.body;
    console.log(username)

    if(!username && !email ){
        throw new ApiError("400", "Username or email required");
    };

    const user = await User.findOne(
        {
            $or : [{ username }, { email }]
        }
    );

    if( !user ){
        throw new ApiError("404", "User not found!");
    }

    if( !password ){
        throw new ApiError(409, "Password is required!");
    };

    const isPasswordValidate = await user.isPasswordCorrect(password);

    if(!isPasswordValidate){
        throw new ApiError("401", "Incorrect user credentials");
    };

    const {accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);
    console.log(accessToken);
    const loggeInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly : true,
        secure : true
    }

    return res.status(200)
    .cookie("accessToken", accessToken, options )
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse("200",
            {
                data : loggeInUser, refreshToken, accessToken
            },
            "User loggein successfully"
        )
    )
})

const logOut = asyncHandler( async ( req, res ) =>{
    await User.findOneAndUpdate(
        req.user._id,
        {
            $set : {
                refreshToken : undefined
            }
        },
        {
            new : true
        }
    );

    const options = {
        httpOnly : true,
        secure : true
    }

    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, {}, "User logged out Successfully")
    )
})

const refreshToken = asyncHandler( async(req, res) =>{
    const incommingRefreshToken = req.cookie.refreshToken || req.body.refreshToken;

    if(!incommingRefreshToken){
        throw new ApiError(401, "Unauthorized access");    
    }

    try {
        const decodedToken = await jwt.verify(incommingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    
        const user = await User.findById(decodedToken?._id);

        if(!user){
            throw new ApiError(401, "Invalid user");
        }
    
        if(incommingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh token is expired or used");
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id);
    
        const options = {
            httpOnly : true,
            secure : true
        }
    
        return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken:newRefreshToken},
                "Access Token Refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(500, error?.message || "Error while generating access token");
        
    }
})

const changeCurrentPassowrd = asyncHandler( async(req, res) =>{
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user?._id);

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    
    if(!isPasswordCorrect) {
        throw new ApiError(400, "Invalid Password");
    }

    user.password = newPassword;
    await user.save({validateBeforeSave : false});

    return res.status(200)
            .json(
                new ApiResponse(200, {}, "Password updaded successfully")
            )
})

const getCurrentUser = asyncHandler( async(req, res) => {
    return res
            .status(200)
            .json(
                new ApiResponse
                (200, req.user),
                 "Current User Details fetched successfully"
                )
})

const updateAccountDetails = asyncHandler (async (req, res) =>{
    const { fullName, email } = req.body;

    if( !fullName || !email ){
        throw new ApiError(400, "Fullname & email required");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                fullName,
                email
            }
        },{
            new : true
        }
    ).select("-password");

    return res.status(200)
            .json(
                new ApiResponse(200, user, "Information updated successfully")
            )
});

const updateAvatarImage = asyncHandler( async( req, res ) => {
    const avatarImageLocalPath = req.file?.path;

    if(!avatarImageLocalPath){
        throw new ApiError(400, "Avatar Image is missing");
    }

    const avatar = await uploadOnClodinary(avatarImageLocalPath);

    if(!avatarImageUrl){
        throw new ApiError(400, "Error while uploading avatar file");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                avatar : avatar.url
            }
        },{
            new : true
        }
    ).select("-password");

    return res.status(200)
            .json(
                new ApiResponse(200, user, "Avatar Image updated successfully")
            )
});

const updateCoverImage = asyncHandler( async( req, res) =>{
    const coverImageLocalPath = req.file?.path;

    if(!coverImageLocalPath){
        throw new ApiError(400, " Image is missing");
    }

    const coverImage = await uploadOnClodinary(coverImageLocalPath);

    if(!coverImage){
        throw new ApiError(400, "Error while uploading cover Image file");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                coverImage : coverImage.url
            }
        },{
            new : true
        }
    ).select("-password");

    return res.status(200)
            .json(
                new ApiResponse(200, user, "Cover Image updated successfully")
            )
})

export { 
        registerUser,
        loginUser, 
        logOut, 
        refreshToken,
        changeCurrentPassowrd,
        getCurrentUser,
        updateAccountDetails,
        updateAvatarImage, 
        updateCoverImage
     };
