const mongoose=require('mongoose');
require('dotenv').config();

const url=process.env.mongourl;

mongoose.connect(url,{
     useNewUrlParser: true,
    useUnifiedTopology: true
})
const db=mongoose.connection;
db.on('connected',()=>{
    console.log("Mongodb connected");
});
db.on('disconnected',()=>{
    console.log("Mongodb disconnected");
});
db.on('error',(err)=>{
    console.log(err);
});

module.exports=db;