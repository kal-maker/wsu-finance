// lib/inngest/client.js
import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "finance-platform",
  name: "Finance Platform",
  eventKey: process.env.INNGEST_EVENT_KEY, // Add this line
});