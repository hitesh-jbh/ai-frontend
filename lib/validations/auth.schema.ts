import { z } from "zod";

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\d{10}$/, "Phone number must be exactly 10 digits");

export const gmailSchema = z
  .string()
  .trim()
  .regex(/^[a-zA-Z0-9._%+-]+@gmail\.com$/, "Please enter a valid Gmail address");

export const loginSchema = z.object({
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

export const signupSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(255, "Name is too long"),
    email: gmailSchema,
    phone: phoneSchema,
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms and conditions",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address").min(1, "Email is required"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

