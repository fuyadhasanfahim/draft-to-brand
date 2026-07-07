import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(2, "Please enter your name."),
  email: z.string().email("Enter a valid email address."),
  company: z.string().optional(),
  budget: z.string().min(1, "Please choose a range."),
  message: z.string().min(20, "Tell us a little more, at least 20 characters."),
});

export type ContactInput = z.infer<typeof contactSchema>;
