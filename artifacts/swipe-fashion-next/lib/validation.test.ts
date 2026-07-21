import { describe, expect, it } from "vitest";

import { createOrderSchema } from "./validation";

describe("createOrderSchema", () => {
  it("accepts a well-formed order", () => {
    const result = createOrderSchema.safeParse({
      productId: 3,
      selectedSize: "M",
      selectedColor: "Black",
      quantity: 1,
    });

    expect(result.success).toBe(true);
  });

  it("strips a sessionId supplied by the client", () => {
    const result = createOrderSchema.safeParse({
      sessionId: "someone-elses-session",
      productId: 3,
      selectedSize: "M",
      selectedColor: "Black",
      quantity: 1,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect("sessionId" in result.data).toBe(false);
    }
  });

  it("rejects a quantity below one", () => {
    const result = createOrderSchema.safeParse({
      productId: 3,
      selectedSize: "M",
      selectedColor: "Black",
      quantity: 0,
    });

    expect(result.success).toBe(false);
  });
});
