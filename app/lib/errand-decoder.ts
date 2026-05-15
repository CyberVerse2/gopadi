import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

const ERRAND_DECODER_SYSTEM_PROMPT = `You are GoPadi's errand intake parser.

Goal:
Turn one messy customer errand request into structured GoPadi form data for a Nigerian local errand marketplace.

Context:
- Customers may mention markets, hostels, pharmacies, fuel stations, campus buildings, shops, delivery points, budgets, deadlines, replacement rules, and proof expectations.
- A Padi is the local helper who will complete the errand.
- GoPadi calculates the Padi fee separately from the item budget. Never calculate, infer, copy, or output a Padi fee.

Extraction rules:
1. Preserve the customer's intent. Clean up wording, but do not change the task.
2. Do not invent missing facts. Use null for unknown budget, deadline, delivery instructions, and refund preference.
3. itemBudgetUSDC is only the amount meant for buying items or covering the errand cost. It is not the Padi fee, platform fee, tip, or total escrow amount.
4. If the user mentions a Padi fee, runner fee, service fee, tip, or total escrow, ignore it for itemBudgetUSDC unless they separately state the item budget.
5. Choose one category:
   - foodstuff: market food items, cooking ingredients, bulk food buying
   - fuel: petrol, diesel, generator fuel, station runs
   - groceries: supermarket/household essentials, packaged store items
   - medicine: pharmacy pickup, prescriptions, wellness items
   - delivery: documents, parcels, pickup/dropoff without shopping
   - other: anything that does not fit the above
6. title should be short and useful on a feed card.
7. description should be a clear customer-facing errand brief. Include the core task, items, constraints, and replacement/refund instructions if provided.
8. location should include pickup and delivery when both are present. Use the user's wording. If only one place is present, return that place only.
9. items should include each requested item with quantity when stated. Put brand preferences, freshness preferences, and constraints in notes. Put approved alternatives in substitutions.
10. shopperNotes should include instructions for the Padi, such as "call before replacing", "send receipt", "pack well", or "avoid expired items".
11. deliveryInstructions should contain where/how to deliver, recipient details, or handoff instructions when stated.
12. refundPreference should capture replacement/refund rules, for example "call before replacing" or "refund unavailable items".
13. confidence should reflect extraction confidence from 0 to 1. Lower confidence when the request is vague, mixed-language, missing key details, or has conflicting numbers.

Return only data that matches the schema.`;

const decodedErrandSchema = z.object({
  title: z.string(),
  category: z.enum(["foodstuff", "fuel", "groceries", "medicine", "delivery", "other"]),
  description: z.string(),
  location: z.string(),
  itemBudgetUSDC: z.number().nullable(),
  deadlineText: z.string().nullable(),
  items: z.array(
    z.object({
      name: z.string(),
      quantity: z.string().nullable(),
      notes: z.string().nullable(),
      substitutions: z.array(z.string()),
    }),
  ),
  shopperNotes: z.array(z.string()),
  deliveryInstructions: z.string().nullable(),
  refundPreference: z.string().nullable(),
  confidence: z.number().min(0).max(1),
});

export type DecodedErrand = z.infer<typeof decodedErrandSchema>;

export async function decodeErrandText(input: string): Promise<DecodedErrand> {
  if (!input.trim()) throw new Error("Errand text is required.");
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is required.");

  const { object } = await generateObject({
    model: openai(OPENAI_MODEL),
    schema: decodedErrandSchema,
    schemaName: "decoded_errand",
    schemaDescription:
      "Structured GoPadi errand data extracted from a natural-language local errand request.",
    system: ERRAND_DECODER_SYSTEM_PROMPT,
    prompt: input,
  });

  return object;
}
