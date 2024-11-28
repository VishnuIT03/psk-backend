const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Razorpay = require("razorpay");
const { categories, category, products } = require('./routes/products');
const { type, required } = require('joi/lib/types/object');
const { unique } = require('joi/lib/types/array');
const array = require('joi/lib/types/array');

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

// MongoDB connection for user data
const userDB = mongoose.createConnection('mongodb+srv://Rohit:Rohit1@cluster0.iov7nj6.mongodb.net/user?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
userDB.on('error', console.error.bind(console, 'User MongoDB connection error:'));
userDB.once('open', () => console.log("User MongoDB connected"));

const userAccountSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email:String,
  mobileNumber: String,
  password: String,
  role: {
    type:String,
    default:"user"
  },
});

const UserAccount = userDB.model('UserAccount', userAccountSchema);

const productDB = mongoose.createConnection('mongodb+srv://Rohit:Rohit1@cluster0.iov7nj6.mongodb.net/PSK?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
productDB.on('error', console.error.bind(console, 'Product MongoDB connection error:'));
productDB.once('open', () => console.log("Product MongoDB connected"));

const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  category: String,
});

const Product = productDB.model('Product', productSchema);

app.use('/products/categories', categories);
app.use('/products/category', category);
app.use('/products', products);
app.get('/user', async (req, res) => {
  try {
    const users = await UserAccount.find();
    res.json(users);
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ error: 'An error occurred while fetching user data' });
  }
});
const summarySchema = new mongoose.Schema({
  name:String,
  email: String,
  phone: String,
  address: String,
  date: String,
  cartitems: [{ 
    id: String, 
    title: String, 
    price: Number, 
    weight: Number, 
    quantity: Number 
  }],
  
});
const Summary = productDB.model('Summary', summarySchema);
app.get('/summary', async (req, res) => {
  try {
    const orders = await Summary.find(); // Fetch from 'Summary' collection
    res.json(orders);
  } catch (error) {
    console.error("Error fetching order data:", error);
    res.status(500).json({ error: 'An error occurred while fetching order data' });
  }
});
app.post('/summary', async (req, res) => {
  try {
    const { name, email, phone, address,date,cartitems} = req.body;
    console.log("ddd",date);
    const order = new Summary({ name, email, phone, address, date ,cartitems}); 
    await order.save();
    console.log(order);
    res.status(201).json({ message: 'Order data saved successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while saving order data' });
  }
});

app.post('/user/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await UserAccount.findOne({ email, password}); 
    console.log(user);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
   
    res.status(200).json({ message: 'Login successful', user });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: 'An error occurred during login' });
  }
});

app.post('/user', async (req, res) => {
  try {
    const { firstName, lastName, email, mobileNumber, password } = req.body;
    const existingUser = await UserAccount.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }
    const newUser = new UserAccount({ firstName, lastName, email, mobileNumber, password });
    await newUser.save();
    res.status(201).json({ message: 'User created successfully', user: newUser });
  } catch (error) {
    console.error("Error signing up user:", error);
    res.status(500).json({ error: 'An error occurred while signing up user' });
  }
});

app.post('/product', async (req, res) => {
  try {
    const { name, description, price, category } = req.body;
    const product = new Product({ name, description, price, category });
    await product.save();
    res.status(201).json({ message: 'Product data saved successfully', product });
  } catch (error) {
    console.error("Error saving product data:", error);
    res.status(500).json({ error: 'An error occurred while saving product data' });
  }
});

app.post("/custom_pay", async (req, res) => {
  try {
    const instance = new Razorpay({
      key_id: 'rzp_test_zpcvSUNJXUqrLv',
      key_secret: 'uGZApKWjnDBHcfaMiQQctHxQ',
    });
    const options = {
      amount: Math.round(req.body.amount) * 100,
      currency: "INR",
      receipt: "receipt_order_74394",
    };
    const order = await instance.orders.create(options);
    if (!order) return res.status(500).send("Some error occurred");
    res.json(order);
  } catch (error) {
    console.log(error)
    res.status(500).send(error);
  }
});

app.listen(port, () => console.log(`Listening on port ${port}...`));
