import mongoose from "mongoose";
import { DB_NAME } from "../contants.js";

const connect = async ()=>{
    try {
        const connectInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        console.log(`DB connected : runnning on port ${connectInstance.connection.host}`)
        
    } catch (error) {
        console.log("Error :"+error);
        process.exit(1);
        
    }
}

export default connect;