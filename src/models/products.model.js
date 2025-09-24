import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2"

//Schema

const productSchema = new mongoose.Schema({
id: Number,
title: String,
description: String,
category: {
    type: String,
    index: true
},
status: Boolean,
price: {
    type: Number,
    index: true
},
thumbnail: String,
code: Number,
stock: Number
})

productSchema.plugin(mongoosePaginate)

const productModel = mongoose.model("products", productSchema)

export default productModel;