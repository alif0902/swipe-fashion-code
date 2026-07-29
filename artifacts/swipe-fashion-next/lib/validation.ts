import { z } from "zod";

// sessionId sengaja tidak ada di sini. Server membacanya dari cookie httpOnly,
// supaya klien tidak bisa membuat order atas nama sesi orang lain.
export const createOrderSchema = z.object({
  productId: z.number().int().positive(),
  selectedSize: z.string().min(1),
  selectedColor: z.string().min(1),
  quantity: z.number().int().min(1),
});

export const confirmOrderSchema = z.object({
  paymentMethod: z.string().min(1),
  shippingAddress: z.string().min(1),
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
});

export const superLikeSchema = z.object({
  productId: z.number().int().positive(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type ConfirmOrderInput = z.infer<typeof confirmOrderSchema>;
export type SuperLikeInput = z.infer<typeof superLikeSchema>;
