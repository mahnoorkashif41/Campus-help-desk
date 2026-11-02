import { z } from "zod";
import { BUILDINGS, CATEGORIES, STATUSES, type CategoryValue, type StatusValue } from "./constants";

const categoryValues = CATEGORIES.map((c) => c.value) as [CategoryValue, ...CategoryValue[]];
const statusValues = STATUSES.map((s) => s.value) as [StatusValue, ...StatusValue[]];

export const complaintSchema = z.object({
  studentName: z.string().trim().min(2, "Please enter your full name.").max(100, "Name is too long."),
  studentEmail: z.string().trim().toLowerCase().email("Please enter a valid email address.").max(150),
  category: z.enum(categoryValues, { errorMap: () => ({ message: "Please choose a category." }) }),
  title: z.string().trim().min(5, "Title must be at least 5 characters.").max(120, "Title must be 120 characters or fewer."),
  description: z.string().trim().min(20, "Please describe the issue in at least 20 characters.").max(2000, "Description must be 2000 characters or fewer."),
  building: z.enum(BUILDINGS, { errorMap: () => ({ message: "Please choose a building." }) }),
  roomNumber: z.string().trim().max(20, "Room number is too long.").optional().or(z.literal("")),
  website: z.string().max(0).optional().or(z.literal("")), // honeypot: real users leave it empty
});
export type ComplaintInput = z.infer<typeof complaintSchema>;

export const trackSchema = z.object({
  ticketId: z.string().trim().toUpperCase().regex(/^CH-[A-Z0-9]{4}-[A-Z0-9]{4}$/, "Ticket ID looks like CH-7K3M-9PQ2."),
  token: z.string().trim().min(20, "Please paste the full tracking token.").max(128, "That token is too long."),
});
export type TrackInput = z.infer<typeof trackSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address.").max(150),
  password: z.string().min(1, "Please enter your password.").max(200, "Password is too long."),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const statusUpdateSchema = z
  .object({
    status: z.enum(statusValues, { errorMap: () => ({ message: "Please choose a status." }) }),
    note: z.string().trim().max(1000, "Note must be 1000 characters or fewer.").optional(),
  })
  .refine((d) => d.status !== "RESOLVED" || (d.note && d.note.length >= 5), {
    message: "Please add a resolution note (at least 5 characters) before marking as Resolved.",
    path: ["note"],
  });
export type StatusUpdateInput = z.infer<typeof statusUpdateSchema>;