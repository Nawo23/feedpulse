const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Allows us to read JSON data

// Database Connection (We will add this in Step 3)
// mongoose.connect(process.env.MONGO_URI)... 

// Routes (We will add this in Step 4)
// app.post('/api/feedback', ...)

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));