const mongoose=require('mongoose');
const schema=new mongoose.Schema({
    name:{
        type:String,
        require:true
    },
    email:{
        type:String,
        require:true
    },
    password:{
        type:String,
        require:true
    },
    quizes:{
        type:[String],
        default:[]
    },
     googleId: {
        type: String,
        required: false // store Google user ID
    },
    profilePhoto: {
        type: String,
        required: false
    }
})
module.exports=mongoose.model('Admin', schema);