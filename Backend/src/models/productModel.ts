import mongoose,{Schema,Document} from "mongoose";

export interface IProduct extends Document{
    _id:mongoose.Types.ObjectId;
    name:string;
    description?:string;
    price:number;
    countInStock?:number;
    ImageUrl:string;
    Category:[string];
    isFeatured:boolean;
}

const ProductSchema = new Schema({
    name:{
        type:String,
        required:true
    },
    description:{
        type:String,
        default:"No Description Available"
    },
    price:{
        type:Number,
        min:0,
        required:true
    },
    countInStock:{
        type:Number,
        default:1
    },
    ImageUrl:{
        type:String,
        required:true
    },
    Category:[{
        type:String,
        required:true
    }],
    isFeatured:{
        type:Boolean,
        required:true
    }
});

const Product = mongoose.model<IProduct>("Product",ProductSchema);
export default Product;