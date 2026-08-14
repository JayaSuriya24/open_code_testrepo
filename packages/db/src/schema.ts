import { index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const rfqs = pgTable(
  "rfqs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    company: text("company"),
    email: text("email").notNull(),
    phone: text("phone"),
    message: text("message"),
    source: text("source").notNull().default("page"),
    ip: text("ip"),
    status: text("status").notNull().default("new"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("rfqs_email_idx").on(table.email), index("rfqs_created_at_idx").on(table.createdAt)],
);

export const rfqItems = pgTable(
  "rfq_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    rfqId: uuid("rfq_id")
      .notNull()
      .references(() => rfqs.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    aws: text("aws").notNull(),
    quantity: integer("quantity").notNull(),
    position: integer("position").notNull(),
  },
  (table) => [index("rfq_items_rfq_id_idx").on(table.rfqId)],
);

export type Rfq = typeof rfqs.$inferSelect;
export type NewRfq = typeof rfqs.$inferInsert;
export type RfqItem = typeof rfqItems.$inferSelect;
export type NewRfqItem = typeof rfqItems.$inferInsert;
