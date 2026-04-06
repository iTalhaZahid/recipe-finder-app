import express from "express";
import { handleCreateNewFavourite, handleDeleteFavourite, handleGetFavourite } from '../controllers/favourites.js'
const router = express.Router();

router.route('/')
    .post(handleCreateNewFavourite)

router.route('/:userId/:receipeId')
    .delete(handleDeleteFavourite)

router.route('/:userId')
    .get(handleGetFavourite)

export default router;