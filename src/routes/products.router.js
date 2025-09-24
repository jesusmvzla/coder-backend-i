import { Router } from "express";
import productModel from "../models/products.model.js";

const router = Router ();


router.get("/", async(req, res) => {
try {
    const products = await productModel.find().explain("executionStats")
    res.send (products)
} catch(error) {
    res.status(500).send("Error al obtener los datos")
}
})

export default router;