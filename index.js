import express from "express";
import cors from "cors";
 const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
    res.send("Hire Loop Server is running");
})


app.listen(PORT, (req, res) => {
    console.log(`Server is running on port ${PORT}`);
})