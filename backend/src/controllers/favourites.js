import { db } from '../config/db.js';
import { and, eq } from "drizzle-orm";
import { favouritesTable } from "../db/schema.js";


async function handleCreateNewFavourite(req, res) {
    try {
        const { userId, receipeId, title, image, cookTime, servings } = req.body;
        if (!userId || !receipeId || !title) {
            res.status(400).json({ error: "Missing Fields Required" })
        }
        const newFavourite = await db.insert(favouritesTable).values({
            userId,
            receipeId,
            title,
            image,
            cookTime,
            servings
        }).returning();

        res.status(201).json(newFavourite[0])
    } catch (error) {
        console.log("Error Adding", error)
        res.status(500).json({ error: 'Something Went Wrong!' })
    }
}


async function handleDeleteFavourite(req, res) {
    try {
        const { userId, receipeId } = req.params;
        await db.delete(favouritesTable).where(
            and(eq(favouritesTable.userId, userId), eq(favouritesTable.receipeId, parseInt(receipeId)))
        )

        res.status(200).json({ success: 'Deleted Successfully!' })

    } catch (error) {
        console.log("Error Removing favourite", error)
        res.status(500).json({ error: 'Something Went Wrong!' })

    }
}


async function handleGetFavourite(req, res) {
    try {
        const { userId } = req.params;
        const userFavourites = await db.select().from(favouritesTable).where(eq(favouritesTable.userId, userId))
        res.status(200).json(userFavourites);
    } catch (error) {
        console.log("Error Fetching the Favourites", error)
        res.status(500).json({ error: 'Something Went Wrong!' })

    }
}


export {
    handleCreateNewFavourite,
    handleDeleteFavourite,
    handleGetFavourite
}


