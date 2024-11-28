const express = require('express');
const fs = require('fs');
const products_data = require('../data');

const category = express.Router();
const categories = express.Router();
const products = express.Router();

products.use(express.json());

const categories_data = ["Grains", "Dry Fish", "Powder"];

products.get('/', (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.send(products_data);
});

// Get product by ID
products.get('/:id', (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    const prod = products_data.find(c => c.id === parseInt(req.params.id));
    if (!prod) return res.status(404).send('The product with the given ID was not found.');
    res.send(prod);
});

// Get all categories
categories.get('/', (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.send(categories_data);
});

// Get products by category
category.get('/:type', (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    const category_prod = products_data.filter(c => c.category === req.params.type);
    if (category_prod.length === 0) return res.status(404).send('No products found for the given category.');
    res.send(category_prod);
});

// Add a new product
products.post('/Add', (req, res) => {
    const { id, title, price, description, category, image } = req.body;
    const newProduct = {
        id,
        title,
        price,
        description,
        category,
        image,
        rating: { rate: 0, count: 0 } // Initial rating
    };

    products_data.push(newProduct);

    fs.writeFile('../data.js', `module.exports = ${JSON.stringify(products_data)}`, (err) => {
        if (err) {
            console.error('Error updating data.js:', err);
            res.status(500).json({ message: 'Failed to update product data' });
        } else {
            res.status(201).json({ message: 'Product added successfully', product: newProduct });
        }
    });
});

// Delete a product by ID
products.delete('/:id', (req, res) => {
    const productId = req.params.id;
    const index = products_data.findIndex(product => product.id === productId);
    if (index === -1) {
        return res.status(404).json({ message: 'Product not found' });
    }
    const deletedProduct = products_data.splice(index, 1)[0];
    fs.writeFile('../data.js', `module.exports = ${JSON.stringify(products_data)}`, (err) => {
        if (err) {
            console.error('Error updating data.js:', err);
            res.status(500).json({ message: 'Failed to update product data' });
        } else {
            res.status(200).json({ message: 'Product deleted successfully', product: deletedProduct });
        }
    });
});

module.exports = {
    products,
    category,
    categories,
};