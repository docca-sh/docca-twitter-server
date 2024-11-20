import { pgTable, serial, text } from 'drizzle-orm/pg-core';

export const posts = pgTable('posts', {
    id: serial('id').primaryKey(),
    content: text('content').notNull(),
    images: text('images').array(),
});
