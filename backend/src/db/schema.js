import {pgTable,serial,text,timestamp,integer} from 'drizzle-orm/pg-core';


export const favouritesTable=pgTable("favourites",{
    id: serial("id").primaryKey(),
    userId:text('user_id').notNull(),
    receipeId:integer('receipe_id').notNull(),
    title:text('text').notNull(),
    image:text('image'),
    cookTime:text('cook_time'),
    servings:text('servings'),
    createdAt:timestamp("created_at").defaultNow(),
})