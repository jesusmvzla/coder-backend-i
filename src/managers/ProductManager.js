import fs from "fs/promises";
import path from "path";

const PRODUCTS_FILE = path.resolve('src/data/products.json');

export default class ProductManager {
    constructor() {
        this.products = [];
    }

    async addProduct(title, description, category, status, price, thumbnail, code, stock) {
        try {
            const oldProducts = await this.getProducts();

            const newProduct = {
                id: oldProducts.length > 0 ? oldProducts[oldProducts.length - 1].id + 1 : 1,
                title,
                description,
                category,
                status,
                price,
                thumbnail,
                code,
                stock
            }

            oldProducts.push(newProduct);
            await fs.writeFile(PRODUCTS_FILE, JSON.stringify(oldProducts, null, 2));
            console.log(`producto "${title}" ingresado correctamente`)
            return newProduct;

        } catch {
            console.log("se perdió la conexión, intente más tarde.");
        }
    }

    async getProducts() {
        try {
            const data = await fs.readFile(PRODUCTS_FILE, "utf-8");
            return JSON.parse(data);
        } catch (error) {
            console.log("No hay productos en la base de datos")
            return [];
        }
    }

    async getProductsById(id) {
        try {
            const data = JSON.parse(await fs.readFile(PRODUCTS_FILE, "utf-8"));
            const product = (data.find(product => product.id === id));
            return product

        } catch (error) {
            console.log("Error de conexión, inténtalo de nuevo.")
        }
    }

    async updateProduct(id, newFields) {
        try {
            const data = await this.getProducts();
            const dataIndex = data.findIndex(product => product.id === id);

            data[dataIndex] = {
                ...data[dataIndex],
                ...newFields
            }

            await fs.writeFile(PRODUCTS_FILE, JSON.stringify(data, null, 2));
            console.log(`Producto con id ${id} actualizado correctamente.`);
            return data[dataIndex];

        } catch {
            console.log("Error de conexión, inténtalo de nuevo.")
        }
    }

    async deleteProduct(id) {
        try { 
            let products = await this.getProducts();
            const productDeleted = products.filter(p => p.id !== id);
            await fs.writeFile(PRODUCTS_FILE, JSON.stringify(productDeleted, null, 2));

        } catch {
            console.log("Error de conexión, inténtalo de nuevo.")
        }
    }
}