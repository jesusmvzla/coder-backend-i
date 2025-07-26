import fs from "fs/promises";
import path from "path";
import ProductManager from './ProductManager.js';

const manager = new ProductManager();
const CART_FILE = path.resolve('src/data/cart.json');

export default class CartManager {
    constructor() {
        this.cart = [];
    }

    async newCart(products) {
        try {
            const newCart = {
                cartId: Date.now(),
                products: [products],
            }

            await fs.writeFile(CART_FILE, JSON.stringify(newCart, null, 2));
            console.log(`Carrito con ID: ${newCart.cartId} ha sido creado correctamente`)
            return newCart.cartId
        } catch {
            console.log("se perdió la conexión, intente más tarde.");
        }
    }

    async getCartById(id) {
        try {
            const data = JSON.parse(await fs.readFile(CART_FILE, "utf-8"));

            if (data.cartId === id) {
                return data;
            } else {
                return undefined
            }

        } catch (error) {
            console.log("Error de conexión, inténtalo de nuevo.")
        }
    }

    async addProduct(productId) {
        try {
            const checkCart = await fs.readFile(CART_FILE, "utf-8");

            if (!checkCart) {
                console.log(`No hay carrito creado previamente. Creando nuevo carrito.`)
                const product = await manager.getProductsById(productId);
                const newProduct = { productId: product.id, quantity: 1 };
                await this.newCart(newProduct)
                return "Su producto ha sido añadido a un nuevo carrito";

            } else {
                console.log("Ya existe un carrito previo. Añadiendo el producto...")
                const oldCart = JSON.parse(await fs.readFile(CART_FILE, "utf-8"));
                const productExist = oldCart.products.find(product => product.productId === productId)

                if (productExist) {
                    console.log("El producto ya se encuentra en el carrito, añadiendo a cantidad.");
                    productExist.quantity += 1

                    console.log("Este es el nuevo carrito actualizado", oldCart);

                    const updatedCart = JSON.stringify(oldCart, null, 2);
                    await fs.writeFile(CART_FILE, updatedCart);
                    console.log(oldCart);
                    return oldCart;
                }
                console.log("Producto nuevo agregado al carrito")
                oldCart.products.push({ productId: productId, quantity: 1 })
                const updatedCart = JSON.stringify(oldCart, null, 2);
                await fs.writeFile(CART_FILE, updatedCart);
                return oldCart;
            }

        } catch (error) {
            console.log("Error de conexión, inténtalo de nuevo.")

        }
    }
}