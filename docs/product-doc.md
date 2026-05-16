# GoPadi Product Document

## Product Name

**GoPadi**

## Tagline

**Local errands protected by Trustless Work escrow.**

## One-Liner

GoPadi is a local errand marketplace where customers hire nearby Padis to buy essentials, pick up items, or complete small tasks, while every payment is protected by **Trustless Work single-release escrow** from funding to final settlement.

## What GoPadi Is

GoPadi turns informal local errands into programmable, escrow-backed transactions.

A customer can post an errand like:

```txt
Buy 2kg rice, 1L oil, and tomato paste from Ogbete Market.
Deliver to my hostel before 6PM.
```

A local Padi accepts the job. The customer does not send money directly to the Padi. Instead, GoPadi creates and funds a **Trustless Work escrow**. The Padi completes the errand, uploads proof, and the customer confirms completion. Only then are funds released.

If something goes wrong, either side can dispute the escrow. A resolver reviews the case and uses Trustless Work dispute resolution to release funds to the Padi or refund the customer.

## Problem

Local errands depend on trust, but both sides carry risk.

Customers worry that a runner may disappear with the money, buy the wrong item, deliver late, or fake proof.

Padis worry that a customer may refuse to pay after the work is complete.

GoPadi solves this by making escrow the default transaction layer. Payment is locked before work begins, and release/refund decisions are enforced through Trustless Work.

## Target Users

### Customers

Students, hostel residents, busy parents, workers, traders, and anyone who needs someone nearby to buy, pick up, or deliver something.

### Padis

Trusted local helpers who accept errands, complete them, upload proof, and get paid after completion or resolver settlement.

### Resolver / Admin

A trusted moderator who handles disputes and signs Trustless Work dispute-resolution transactions.

## Core Flow

```txt
Customer posts errand
        ↓
Padi accepts errand
        ↓
GoPadi prepares Trustless Work escrow creation
        ↓
Customer signs escrow creation with Freighter
        ↓
Customer signs Trustless Work funding transaction
        ↓
Padi completes errand and uploads proof
        ↓
Customer approves completion
        ↓
Customer signs release transaction
        ↓
Funds are released to the Padi
```

## Dispute Flow

```txt
Customer or Padi disputes the escrow
        ↓
GoPadi records the local dispute case
        ↓
Both sides submit evidence through the errand chat/proof flow
        ↓
Resolver reviews the dispute
        ↓
Resolver signs Trustless Work resolve_dispute transaction
        ↓
Funds are released to the Padi or refunded to the customer
```

## Trustless Work Integration

Trustless Work is the core infrastructure layer in GoPadi. The app does not simply display escrow language; it integrates the Trustless Work transaction lifecycle directly into the user flows.

GoPadi uses Trustless Work for:

- Creating a single-release escrow for each accepted errand.
- Funding the escrow with the full item budget plus Padi fee.
- Updating milestone status when the Padi completes the errand.
- Letting the customer approve the completed milestone.
- Releasing funds to the Padi.
- Opening an on-chain dispute when either party disagrees.
- Resolving disputes by distributing funds to the winner.
- Storing every prepared/submitted Trustless Work action in the local database for auditability.

### Integrated Trustless Work Actions

| GoPadi Moment | Trustless Work Action | Purpose |
| --- | --- | --- |
| Customer creates escrow after Padi acceptance | `initialize_escrow` | Deploys a single-release escrow for the errand |
| Customer locks payment | `fund_escrow` | Funds the escrow with total USDC amount |
| Padi marks work complete | `change_milestone_status` | Updates the escrow milestone with completion evidence |
| Customer confirms the work | `approve_milestone` | Approves the completed milestone |
| Customer releases payment | `release_funds` | Sends escrowed funds to the Padi |
| Customer or Padi contests the job | `dispute_escrow` | Moves the escrow into dispute |
| Resolver settles the case | `resolve_dispute` | Releases funds to the Padi or refunds the customer |

### Trustless Work API Endpoints Used

GoPadi prepares and submits transactions through the Trustless Work API:

```txt
/deployer/single-release
/escrow/single-release/fund-escrow
/escrow/single-release/change-milestone-status
/escrow/single-release/approve-milestone
/escrow/single-release/release-funds
/escrow/single-release/dispute-escrow
/escrow/single-release/resolve-dispute
/helper/send-transaction
```

### Escrow Roles

| GoPadi Role | Trustless Work Role |
| --- | --- |
| Customer | Funder |
| Customer | Approver |
| Customer | Release signer |
| Padi | Service provider |
| Padi | Receiver |
| Resolver/Admin | Dispute resolver |
| GoPadi | Platform |

### Why Trustless Work Matters

Trustless Work gives GoPadi the product guarantee:

- The customer can fund the job without handing money directly to the Padi.
- The Padi can start work knowing payment is already locked.
- Completion requires proof and customer approval.
- Disputes have a clear resolver path.
- Settlement is programmable instead of informal.
- Every important money movement is backed by a signed transaction.

## Stellar and Wallet Integration

GoPadi uses Stellar testnet wallets through Freighter.

The app supports:

- Wallet connection with Freighter.
- Signing unsigned Trustless Work XDR transactions.
- Submitting signed XDR through Trustless Work.
- Checking USDC balances through Stellar Horizon.

The payment asset is USDC, configured through the Trustless Work/Stellar asset settings.

## AI Errand Intake

GoPadi includes AI-assisted intake for messy customer requests.

The customer can write a natural-language errand request, and the app uses OpenAI structured generation to extract:

- title
- category
- customer-facing brief
- pickup/delivery location
- item budget
- item checklist
- delivery instructions
- substitution/refund rules
- Padi notes
- confidence score

This makes errand posting faster while preserving the customer's exact local place names and instructions.

## MVP Features

### Customer Features

#### Post Errand

Customers can create an errand with:

- title
- description
- category
- location
- item budget
- Padi fee
- deadline
- phone number
- email address
- wallet address
- optional AI-parsed item checklist

#### Fund Escrow

After a Padi is matched, the customer signs the Trustless Work escrow creation and funding transactions.

The customer funds:

```txt
item budget + Padi fee = total escrow amount
```

#### Track Errand Status

Customers can track:

```txt
posted
accepted
escrow_created
escrow_funded
in_progress
proof_uploaded
completed
released
disputed
refunded
```

#### Confirm Completion

The customer approves the completed milestone and releases funds through Trustless Work.

#### Open Dispute

The customer can dispute the escrow if:

- the item was not delivered
- the wrong item was bought
- proof is missing or fake
- the task was incomplete
- the Padi missed the deadline

### Padi Features

#### Browse Errands

Padis can browse escrow-funded errands by category, fee, deadline, and recency.

Each errand shows:

- title
- category
- location
- item budget
- Padi fee
- total escrow amount
- deadline
- status

#### Complete Errand

The Padi completes the errand and submits proof. GoPadi prepares the Trustless Work milestone update so the escrow reflects completion evidence.

#### Get Paid

The Padi receives funds after customer release or resolver settlement.

### Resolver Features

#### View Disputes

Resolvers can see open dispute cases, linked errands, evidence, chat context, and the current escrow state.

#### Resolve Dispute

Resolvers choose:

```txt
release_to_runner
refund_customer
```

Then the resolver signs a Trustless Work `resolve_dispute` transaction and records local resolver notes.

## MVP Pages

### Landing Page

Explains the product promise:

```txt
Need something done nearby?
Post an errand, lock payment in Trustless Work escrow, and release funds only when it is completed.
```

Primary actions:

```txt
Post an Errand
Browse Work
```

### Post Errand Page

Guides the customer through task, place, money, and review steps. AI intake can prefill structured fields from a natural-language errand description.

### Matching and Funding Page

Shows the selected Padi, payment summary, escrow amount, balance checks, and Trustless Work signing steps for escrow creation and funding.

### Errand Feed

Shows available escrow-funded errands for Padis and customer-owned errands for connected customers.

### Errand Detail Page

Shows full errand details, status timeline, item checklist, proof, chat, and Trustless Work action buttons based on wallet role and current state.

Possible actions:

```txt
Accept Errand
Create Escrow
Fund Escrow
Mark Complete
Approve Completion
Release Funds
Open Dispute
Resolve Dispute
```

### Resolver Dashboard

Shows disputes, escrow records, settlement metrics, and resolver actions.

## Data Model

```ts
type Errand = {
  id: string;
  customerWallet: string;
  customerPhone: string;
  customerEmail: string;
  runnerWallet?: string;
  adminWallet?: string;

  title: string;
  description: string;
  category: "foodstuff" | "fuel" | "groceries" | "medicine" | "delivery" | "other";

  location: string;
  itemBudgetUSDC: number;
  runnerFeeUSDC: number;
  totalEscrowAmountUSDC: number;

  items?: Array<{
    name: string;
    quantity: string | null;
    notes: string | null;
    substitutions: string[];
  }>;

  deadline: string;

  escrowId?: string;
  escrowContractId?: string;
  trustlessEngagementId?: string;

  status:
    | "posted"
    | "accepted"
    | "escrow_created"
    | "escrow_funded"
    | "in_progress"
    | "proof_uploaded"
    | "completed"
    | "released"
    | "disputed"
    | "refunded";

  proofUrl?: string;
  proofNote?: string;

  createdAt: string;
  updatedAt: string;
};
```

```ts
type TrustlessAction = {
  id: string;
  errandId: string;
  disputeId?: string;
  type:
    | "initialize_escrow"
    | "fund_escrow"
    | "change_milestone_status"
    | "approve_milestone"
    | "release_funds"
    | "dispute_escrow"
    | "resolve_dispute";
  status: "pending_signature" | "submitted" | "failed";
  signer: string;
  unsignedTransaction: string;
  signedXdr?: string;
  transactionHash?: string;
  requestPayload: unknown;
  responsePayload?: unknown;
  errorMessage?: string;
  createdAt: string;
  submittedAt?: string;
};
```

```ts
type Dispute = {
  id: string;
  errandId: string;
  openedBy: "customer" | "runner";
  reasonCode?: string;
  reason: string;
  track?: "fast" | "normal";
  evidenceUrl?: string;
  status: "open" | "resolved";
  resolution?: "release_to_runner" | "refund_customer";
  resolverNotes?: string;
  createdAt: string;
  resolvedAt?: string;
};
```

## Build Priority

### Must Build

1. Post errand flow
2. AI errand intake
3. Padi matching
4. Trustless Work escrow creation
5. Trustless Work escrow funding
6. Stellar/Freighter signing
7. USDC balance checks
8. Proof upload
9. Milestone approval
10. Fund release
11. Dispute opening
12. Resolver settlement
13. Trustless Work action audit trail

### Should Build

1. Resolver dashboard metrics
2. Chat and evidence thread
3. Seeded demo errands
4. Status badges and timeline
5. Live smoke scripts for escrow and dispute flows

### Not In MVP

1. Native mobile apps
2. Full KYC
3. Fiat payment rails
4. Complex Padi ratings
5. Real-time delivery tracking
6. Multi-stop route optimization

## Demo Script

### Successful Escrow Demo

1. Customer writes a natural-language errand.
2. AI intake extracts title, category, items, location, and item budget.
3. Customer reviews the total amount.
4. GoPadi matches a Padi.
5. GoPadi prepares Trustless Work `initialize_escrow`.
6. Customer signs the escrow creation transaction with Freighter.
7. GoPadi prepares Trustless Work `fund_escrow`.
8. Customer signs the funding transaction.
9. Padi completes the errand and uploads proof.
10. GoPadi prepares `change_milestone_status`.
11. Customer approves the milestone with `approve_milestone`.
12. Customer releases funds with `release_funds`.
13. Timeline shows the full escrow transaction trail.

### Dispute Demo

1. Customer funds another errand through Trustless Work escrow.
2. Padi uploads proof.
3. Customer disputes the job with `dispute_escrow`.
4. GoPadi opens the local dispute case.
5. Resolver reviews the evidence.
6. Resolver signs `resolve_dispute`.
7. Funds are either released to the Padi or refunded to the customer.
8. GoPadi records resolver notes and final state.

## Success Criteria

The MVP is successful if judges can see this complete Trustless Work-powered flow:

```txt
Post errand
→ Match Padi
→ Create Trustless Work escrow
→ Fund escrow
→ Complete task
→ Upload proof
→ Approve milestone
→ Release funds
```

And this dispute path:

```txt
Fund escrow
→ Dispute escrow
→ Resolver reviews evidence
→ Resolve dispute
→ Release or refund
```

## Final Hackathon Pitch

**GoPadi** is a Trustless Work-powered errand marketplace for local communities. Customers post errands like buying foodstuff, fuel, groceries, medicine, or handling campus deliveries. A local Padi accepts the job, but payment is not sent directly. Instead, GoPadi creates and funds a Trustless Work single-release escrow.

The Padi completes the task and uploads proof. The customer approves completion and releases funds. If there is a disagreement, either side can dispute the escrow, and a resolver settles the case through Trustless Work dispute resolution.

GoPadi protects customers from disappearing runners and protects Padis from unpaid work. Trustless Work turns informal errands into signed, auditable, programmable transactions.
