# GoPadi

GoPadi is an escrow-backed local errands marketplace for Nigerian university towns and dense local markets. A customer posts a funded errand, a nearby Padi accepts it, both sides coordinate in chat, and payment is released only after completion or dispute resolution.

The app is built around Trustless Work escrow on Stellar, Freighter signing, AI-assisted errand prefill, open pre-acceptance chat, and a Bybit P2P-style dispute chat when the job goes wrong.

![GoPadi banner](public/gopadi-banner.png)

## What It Does

- Creates errands for foodstuff, market runs, delivery, pickups, and similar local tasks.
- Requires the customer to fund escrow before the errand is saved to the database.
- Simulates an inDrive-style matching flow that finds a Padi before funding.
- Uses Freighter to sign Trustless Work escrow deployment and funding transactions.
- Shows Trustless Work receipts, contract links, and escrow viewer links in the status timeline.
- Keeps chat open so Padis can ask questions before accepting.
- Converts chat into a dispute chat when either party opens a dispute.
- Lets the Padi upload evidence during disputes while customers can describe missing or wrong items without forcing an evidence URL.
- Supports AI-assisted errand prefill for structured details such as title, category, budget, deadline, contacts, items, substitutions, proof needs, and route context.

## Core Flow

1. Customer writes an errand brief.
2. AI assists with structured prefill without renaming markets, hostels, streets, or landmarks.
3. Customer reviews required fields, phone, email, items, budget, and deadline.
4. Matching page simulates finding available Padis.
5. Customer selects or confirms the matched Padi.
6. App verifies USDC readiness where possible.
7. Customer signs Trustless Work escrow creation in Freighter.
8. Customer signs escrow funding in Freighter.
9. Only after funding succeeds, the errand is saved to Postgres.
10. Padi and customer coordinate in chat.
11. Padi submits proof.
12. Customer confirms delivery and releases payment, or either side opens a dispute.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Drizzle ORM
- Postgres
- Stellar SDK
- Freighter wallet API
- Trustless Work API
- OpenAI AI SDK
- Cloudinary for chat/proof image uploads

## Requirements

- Node.js 20+
- npm
- Postgres database
- Freighter wallet extension
- Trustless Work API key
- OpenAI API key for AI-assisted prefill
- Cloudinary credentials for image uploads
- Stellar USDC trustlines on wallets that receive USDC

The simulated Padi wallet currently needs the required USDC asset trustline before release/funding operations that involve it can complete.

## Environment

Copy the example file and fill in real values:

```bash
cp .env.example .env
```

Important variables:

```bash
DATABASE_URL=postgres://user:password@localhost:5432/gopadi
TRUSTLESS_WORK_API_KEY=your_trustless_work_api_key
TRUSTLESS_WORK_BASE_URL=https://dev.api.trustlesswork.com
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4.1-mini
GOPADI_PLATFORM_WALLET=G...
GOPADI_RESOLVER_WALLET=G...
GOPADI_PLATFORM_FEE_PERCENT=5
NEXT_PUBLIC_GOPADI_PLATFORM_FEE_PERCENT=5
USDC_TRUSTLINE_ADDRESS=C...
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

AI prefill is a real dependency. The app should not silently downgrade semantic prefill, matching, routing, or classification into regex or keyword heuristics if the AI dependency is missing.

## Setup

Install dependencies:

```bash
npm install
```

Run migrations:

```bash
npm run db:migrate
```

Start development:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

The dev script uses webpack intentionally:

```bash
next dev --webpack
```

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run db:generate
npm run db:migrate
npm run db:seed
npm run test:backend
npm run test:trustless
npm run test:escrow:live
npm run test:dispute:live
```

The live Trustless Work scripts use real configured services and should only be run with wallets and environment variables that are ready for actual signing and escrow operations.

## Key Routes

- `/` - landing page
- `/post-errand` - AI-assisted errand creation wizard
- `/post-errand/matching` - simulated Padi matching and escrow funding flow
- `/errands` - funded errand list
- `/errands/[id]` - errand detail, status timeline, receipts, chat, proof, release, and dispute actions
- `/admin` - resolver/admin dispute surface

## Trustless Work Links

Errand details show Trustless Work data near the status timeline:

- Trustless engagement ID
- Stellar escrow contract ID
- escrow viewer link, shaped like `https://viewer.trustlesswork.com/{contractId}`
- submitted Trustless action receipts
- transaction hashes where available

## Disputes

GoPadi disputes follow a P2P order-chat model:

- Customer or Padi can open a dispute from the errand detail page.
- The existing chat becomes the dispute chat.
- Resolver context joins the chat.
- Padi is prompted to upload full, unedited proof such as receipts, item photos, delivery photos, handoff notes, and substitution context.
- Customers can describe missing, wrong, or incomplete delivery without being forced to provide an evidence link.
- The resolver can release funds to the Padi or refund the customer through Trustless Work dispute resolution.

## Design Assets

- SVG logo: `public/gopadi-logo.svg`
- PNG logo: `public/gopadi-logo.png`
- Banner: `public/gopadi-banner.png`
- Current UI system: `DESIGN.md`
- Product direction: `PRODUCT.md`

## Production Notes

- Do not list unfunded errands. The customer must lock funds before the errand row is created.
- Do not rename user-entered markets, hostels, streets, or landmarks in AI output.
- Do not add deterministic fallbacks for AI-owned behavior unless that fallback is explicitly requested.
- Keep Trustless Work and Stellar state visible to users wherever money movement depends on it.
