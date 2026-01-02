// require('dotenv').config({path:"/.env"})
import dotenv from "dotenv";
import connect from "./db/index.js";
import { app } from "./app.js";


dotenv.config({
    path: '.env'
})


const port = process.env.PORT || 5000;

connect()
    .then(()=>{
        app.listen(port,()=>{
    console.log(`server running on port :${port}`);
})
    })
    .catch((error)=>{
        console.log("Error while connecting the DB");
    })




/*
import express from "express";

const app = express();

(async ()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        app.on("error",(error)=>{
            console.error("error in connecting db :"+error);
            throw error;
        })
        
        app.listen(process.env.PORT,()=>{
            console.log(`application runnnig on port 3000 & db conneted succesfully`);
        })
    } catch (error) {
        console.error("Error while try to connect db: "+error);
        throw error;
    }
})();
*/