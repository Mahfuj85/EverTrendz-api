const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const stripe = require("stripe")(
  "sk_test_51QE63pKF7D2bD7SwIKJlw9O8cl5S5ogUvLyl770uG0gJ730e1lOd1OwMnP9UF4Rj6UfwDilbyDTnZwebQgBz6Aq800wSoFEFVr"
);

const fileUpload = require("express-fileupload");
require("dotenv").config();
const cors = require("cors");

const app = express();
const port = 7000;


//MIDDLEWARE
app.use(cors());
app.use(express.json());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(fileUpload());





const uri =`mongodb+srv://${process.env.DATABASE_USER}:${process.env.DATABASE_PASS}@cluster0.ar1zj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    const database = client.db("EverTrendz");
    const usersCollection = database.collection("Users");
    const productsCollection = database.collection("Products"); 
    const bookingCollection = database.collection("Bookings");
    const paymentCollection = database.collection("Payments");

    
    //FUNCTION TO SAVE USER FROM FRONTEND
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
     // console.log(result);
      res.send(result);
    });

    //FUNCTION TO GET USER FROM DATABASE
    app.get("/users", async (req, res) => {
      const query = {};
      const result = await usersCollection.find(query).toArray();
      //console.log(result);
      res.send(result);
    });

    
    //FUNCTION TO CHECK THE USER IS ADMIN OR NOT
    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      //console.log(user);
      res.send({ isAdmin: user?.role === "Admin" });
    });

    //FUNCTION TO UPDATE USER
    app.put("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const filter = { _id: new ObjectId(id) };
      const option = { upsert: true };
      const updatedDoc = {
        $set: {
          role: "Admin",
        },
      };

      const result = await usersCollection.updateOne(
        filter,
        updatedDoc,
        option
      );
      res.send(result);
    });

    //FUNCTION TO CHECK THE USER IS SELLER OR NOT
    app.get("/users/seller/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      //console.log(user);
      res.send({ isSeller: user?.role === "Seller" });
    });

    // FUNCTION TO DELETE USER FROM FRONTEND
    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await usersCollection.deleteOne(filter);
      res.send(result);
    });

    // FUNCTION TO POST ADD PRODUCT DATA FROM FRONTEND 
    app.post("/add-product", async(req, res) => {
      const name = req.body.name;
      const email = req.body.email;
      const title = req.body.title;
      const price = req.body.price;
      const condition = req.body.condition;
      const number = req.body.number;
      const location = req.body.location;
      const category = req.body.category;
      const description = req.body.description;
      const oldPrice = req.body.oldPrice;
      const year = req.body.year;
      const verification = req.body.verification;
      const date = req.body.postedDate;

      const picture1 = req.files.image1;
      const pictureData1 = picture1.data;
      const encodedPicture1 = pictureData1.toString("base64");
      const imageBuffer1 = Buffer.from(encodedPicture1, "base64");

      const picture2 = req.files.image2;
      const pictureData2 = picture2.data;
      const encodedPicture2 = pictureData2.toString("base64");
      const imageBuffer2 = Buffer.from(encodedPicture2, "base64");

      const picture3 = req.files.image3;
      const pictureData3 = picture3.data;
      const encodedPicture3 = pictureData3.toString("base64");
      const imageBuffer3 = Buffer.from(encodedPicture3, "base64");

      const product = {name, email, title, price, condition, number, location, category, description, oldPrice, year, verification, date, image1: imageBuffer1, image2: imageBuffer2, image3: imageBuffer3};
      //console.log(product);
      const result = await productsCollection.insertOne(product);
      res.send(result)
    });

    //FUNCTION TO GET PRODUCT DATA FROM DATABASE
    app.get("/products", async(req, res) => {
      const query = {};
      const result = await productsCollection.find(query).toArray();
      res.send(result);
    })

    // FUNCTION TO DELETE DOCTOR DATA FROM FRONTEND
    app.delete("/products/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      console.log(filter);
      const result = await productsCollection.deleteOne(filter);
      res.send(result);
    });

    //FUNCTION TO BOOK A PRODUCT 
    app.post("/bookings", async(req, res)=>{
      const booking= req.body;
      console.log("Booked:",booking);
      const result = bookingCollection.insertOne(booking);
      res.send(result);
    })

    //FUNCTION TO GET DATA FROM BOOKINGS COLLECTION
    app.get("/bookings", async (req, res) => {
      const email = req.query.email;
      console.log(email);
      const query = { email: email };
      const bookings = await bookingCollection.find(query).toArray();
      res.send(bookings);
    });



    // FUNCTION TO GET DATA FROM BOOKINGS COLLECTION 
    app.get("/bookings/:id", async(req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id)};
        const booking = await bookingCollection.findOne(query);
        res.send(booking);
    })

    // FUNCTION TO CREATE PAYMENT INTENT FOR STRIPE
    app.post("/create-payment-intent", async (req, res) => {
      const booking = req.body;
      const price = booking.price;
      const amount = price * 100;

      const paymentIntent = await stripe.paymentIntents.create({
        currency: "usd",
        amount: amount,
        payment_method_types: ["card"],
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    // FUNCTION TO CREATE PAYMENT SUCCESS
    app.post("/payments", async (req, res) => {
      const payment = req.body;
      const result = await paymentCollection.insertOne(payment);
      const id = payment.bookingId;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          paid: true,
          transactionId: payment.transactionId,
        },
      };
      const updatedResult = await bookingCollection.updateOne(
        filter,
        updatedDoc
      );
      res.send(result);
    });
  } finally {
    
    //await client.close();
  }
}
run().catch(console.dir);




app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`EverTrendz api is listening on port: ${port}`)
})



