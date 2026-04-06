// const express=require('express');
import express from "express";
import { ENV } from "./config/env.js";
import favouriteRouter from './routes/favourites.js';

const app = express();
const PORT = ENV.PORT;

app.use(express.json())

app.get('/api/health', (req, res) => {
    res.status(200).json({ success: true, message: "Server is healthy" });
})

app.use('/api/favourites', favouriteRouter);


app.listen(PORT, () => {
    console.log(`Server Started at PORT:`, PORT)
})