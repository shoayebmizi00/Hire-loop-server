import express from "express";
import cors from "cors";
import "dotenv/config";
import { MongoClient, ObjectId } from "mongodb";

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // allow the Next.js client (different port) to call us
app.use(express.json()); // read JSON from request bodies

// MongoDB connection
const client = new MongoClient(process.env.MONGODB_URI);

async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("Successfully connected to MongoDB!");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    throw error;
  }
}

// tiny helper: is this string a valid Mongo id? (stops crashes on bad ids)
function isValidId(id) {
  return ObjectId.isValid(id);
}

// Connect first, THEN set up the collections and routes
await connectToMongoDB();

const db = client.db("Hire-Loop");
const users = db.collection("user");
const jobs = db.collection("jobs");

// ---------- Users ----------
app.get("/users", async (req, res) => {
  try {
    const result = await users.find({}).toArray();
    res.send(result);
  } catch (error) {
    console.error("GET /users failed:", error);
    res.status(500).send({ message: "Could not load users" });
  }
});

// ---------- Jobs ----------
// 1. Read all jobs (newest first)
app.get("/jobs", async (req, res) => {
  try {
    const result = await jobs.find({}).sort({ createdAt: -1 }).toArray();
    res.send(result);
  } catch (error) {
    console.error("GET /jobs failed:", error);
    res.status(500).send({ message: "Could not load jobs" });
  }
});

// 2. Create a job (the JSON body comes from the client)
app.post("/jobs", async (req, res) => {
  try {
    // the server decides createdAt — the client doesn't send it
    const job = { ...req.body, createdAt: new Date() };
    const result = await jobs.insertOne(job);
    // insertedId becomes a plain string in the JSON response
    res.status(201).send({ success: true, id: result.insertedId });
  } catch (error) {
    console.error("POST /jobs failed:", error);
    res.status(500).send({ success: false });
  }
});

// 3. Update one job by id (only the fields in the body are changed)
app.put("/jobs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).send({ message: "Invalid job id" });
    }

    const result = await jobs.updateOne(
      { _id: new ObjectId(id) },
      { $set: req.body }
    );

    if (result.matchedCount === 0) {
      return res.status(404).send({ message: "Job not found" });
    }

    res.send({ success: true });
  } catch (error) {
    console.error("PUT /jobs/:id failed:", error);
    res.status(500).send({ success: false });
  }
});

// 4. Delete one job by id (this was "deleteone" before — a typo, now fixed)
app.delete("/jobs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).send({ message: "Invalid job id" });
    }

    const result = await jobs.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).send({ message: "Job not found" });
    }

    res.send({ success: true });
  } catch (error) {
    console.error("DELETE /jobs/:id failed:", error);
    res.status(500).send({ success: false });
  }
});

// ---------- Health check ----------
app.get("/", (req, res) => {
  res.send("Hire Loop Server is running");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;