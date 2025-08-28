import express from "express";
import ProductManager from './managers/ProductManager.js';
import CartManager from './managers/CartManager.js';
import expressHandlebars from 'express-handlebars';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const PORT = 3030;
const manager = new ProductManager();
const cartManager = new CartManager();

//Handlebars const
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//Websocket const
const httpServer = createServer(app);
const io = new Server(httpServer);

let products = [];
try {
   const Data = await fs.readFile(path.join(__dirname, 'data', 'products.json'), 'utf-8');
   products = JSON.parse(Data);

} catch (error) {
   console.error('Error leyendo el archivo products.json:', error);
}

// WebSockets
io.on("connection", (socket) => {
   console.log("Nuevo cliente conectado", socket.id);

   socket.emit("updateProducts", products);

   socket.on("createProduct", async (productData) => {

      console.log('Recibiendo datos del formulario:', productData)
      const { title, description, category, status, price, thumbnail, code, stock } = productData;


      if (!title || !description || !category || !status || !price || !thumbnail || !code || !stock) {
         socket.emit('productError', { message: 'Valores incompletos' });
         return;
      }

      const oldProducts = await manager.getProducts();
      const codeExists = await oldProducts.some(product => product.code === code);

      if (codeExists) {
         socket.emit('productError', { message: `El código ${code} ya existe` });
         console.log(`Id ${code} ya se encuentra en uso. No se puede crear el producto.`)
         return;
      }

      manager.addProduct(title, description, category, status, price, thumbnail, code, stock);

      const updatedProducts = await manager.getProducts();
      io.emit('updateProducts', updatedProducts);


      socket.emit('productCreated', { message: `Producto "${title}" creado exitosamente` });
   });

   socket.on("deleteProduct", async (productId) => {

      const deleteProduct = await manager.deleteProduct(productId);
      console.log(`Producto ${productId} eliminado exitosamente`);
      console.log("esto me devuelve delete: ", deleteProduct)
      if (deleteProduct) {
         socket.emit('productDeleted', { message: `Producto con ID: ${productId} ha sido eliminado exitosamente.` })
         console.log(`Producto con ID: "${productId}" ha sido eliminado exitosamente`);
         const updatedProducts = await manager.getProducts();
         io.emit('updateProducts', updatedProducts);
      }
   })
});

//Middleware
app.use(express.json());
app.use(express.urlencoded({ encoded: true }));

// Handlebars
app.engine("handlebars", expressHandlebars.engine());
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// ENDPOINTS PRODUCTS
app.get("/", (req, res) => {
   res.render("home", { products });
})
app.get("/realtimeproducts", (req, res) => {
   res.render("realTimeProducts", { products });
})
app.get("/products", async (req, res) => {
   const products = await manager.getProducts();
   res.send(products);
})
app.get("/products/:id", async (req, res) => {
   const product = await manager.getProductsById(Number(req.params.id));

   if (product) {
      res.send(product);
   } else {
      res.status(404).send(`El producto con id ${req.params.id} no existe o no está disponible. Pruebe con otro producto.`)
   }
})
app.post("/new-product/", async (req, res) => {
   const { title, description, category, status, price, thumbnail, code, stock } = req.body;
   if (!title || !description || !category || !status || !price || !thumbnail || !code || !stock) {
      console.error("valores incompletos")
      return res.status(404).send("Error al crear producto, valores incompletos.")
   }
   const oldProducts = await manager.getProducts();
   const codeExiste = oldProducts.some(product => product.code === code)

   if (codeExiste) {
      console.error(`El código de producto: ${code} ya existe, inténtelo de nuevo con un nuevo código.`)
      return res.status(404).send(`Error al crear producto, el código ${code} ya existe.`);
   } else {
      await manager.addProduct(title, description, category, status, price, thumbnail, code, stock)
      console.log("Esta es la nueva lista de productos:", await manager.getProducts())
      return res.status(202).send(`Producto creado con el nombre "${title}" y el código ${code}.`);
   }
})
app.put("/update-product/:id", async (req, res) => {
   const newFields = req.body;
   const productId = Number(req.params.id)
   const products = await manager.getProducts();
   console.log(products);
   const productIndex = products.findIndex(products => products.id === productId);

   if ("id" in newFields) {
      res.status(404).send("No tiene autorización para actualizar el campo ID, inténtelo de nuevo sin ese campo.");
      console.log("No se pudo actualizar, el usuario intentó actualizar el ID");
   } else if (productIndex === -1) {
      res.status(404).send(`No existe un producto con el id: ${productId}. Intente de nuevo.`);
   } else {
      manager.updateProduct(productId, newFields)
      const productUpdated = await manager.getProductsById(productId)
      res.send(`Producto ${productUpdated.title} actualizado exitosamente.`);
      console.log("Productos actualizados, esta es la nueva lista", await manager.getProducts())
   }
})
app.delete("/delete-product/:id", async (req, res) => {
   // const products = await manager.getProducts();
   const productId = Number(req.params.id);
   const productToDelete = await manager.getProductsById(productId);

   if (!productToDelete) {
      res.status(404).send(`El producto con el ID ${productId} no es correcto o no existe.`)

   } else {
      manager.deleteProduct(productId)
      res.status(201).send(`Producto ${productToDelete.title} eliminado exitosamente.`);
      console.log("Producto eliminado, esta es la nueva lista", await manager.getProducts())
   }
})

// ENDPOINTS CART
app.get("/cart/:id", async (req, res) => {
   console.log("Buscando carrito con ID: ", Number(req.params.id))
   const cart = await cartManager.getCartById(Number(req.params.id));
   if (cart) {
      console.log("Carrito encontrado: ", cart);
      res.send(cart);
   } else {
      console.error("Carrito no encontrado.");
      res.status(404).send(`El carrito con id ${req.params.id} no existe o no está disponible. Pruebe con otro carrito.`)
   }
})
app.post("/new-cart/:productId", async (req, res) => {
   const product = await manager.getProductsById(Number(req.params.productId));

   if (!product) {
      console.error("Debe introducir el ID del producto que desea añadir a su nuevo carrito")
      return res.status(404).send("Error al crear carrito, no se definió ID de producto a agregar.")
   }
   console.log(`El producto a añadir al nuevo carrito es "${product.title}". `);
   const newProduct = { productId: product.id, quantity: 1 };
   const newCart = await cartManager.newCart(newProduct);
   return res.send(`Hemos creado un nuevo carrito con ID ${newCart} con tu producto.`)
})
app.post("/add-product-cart/:productId", async (req, res) => {
   const newCart = await cartManager.addProduct(Number(req.params.productId));
   return res.send({ message: `Su producto ha sido añadido`, cart: newCart });

})

//LISTEN PORT
httpServer.listen(PORT, () => {
   console.log(`escuchando el puerto ${PORT}`);
})