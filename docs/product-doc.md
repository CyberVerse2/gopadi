# GoPadi Hackathon MVP Product Doc

## Product Name

**GoPadi**

## Tagline

**Local errands protected by escrow.**

## One-Liner

GoPadi lets users hire trusted local shoppers and errand runners to buy essentials or complete small tasks, with payment locked in **Trustless Work escrow** until the task is completed and confirmed.

## Problem

People often need someone nearby to help them buy things or run errands, such as:

- Buy foodstuff
- Buy fuel
- Pick up groceries
- Buy medicine
- Deliver a small package
- Handle a campus or local errand

But there is a trust problem.

The customer is afraid the runner may disappear with the money.

The runner is afraid the customer may refuse to pay after the task is completed.

GoPadi solves this by locking the payment in escrow before the errand starts and releasing it only after completion is confirmed.

## Target Users

### Customers

People who are busy, far away, sick, in school, at work, or unable to go out and need someone nearby to help them buy or do something.

### Runners / Padi

Trusted local helpers who accept errands, complete them, upload proof, and get paid.

### Admin / Resolver

A trusted moderator who handles disputes if the customer and runner disagree.

## Core MVP Flow

```txt
Customer posts errand
        ↓
Runner accepts errand
        ↓
Customer funds Trustless Work escrow
        ↓
Runner completes errand
        ↓
Runner uploads proof
        ↓
Customer confirms completion
        ↓
Funds are released to runner
```

### Dispute Flow

```txt
Customer or runner opens dispute
        ↓
Both sides submit evidence
        ↓
Resolver reviews
        ↓
Funds are released or refunded
```

## MVP Features

### Customer Features

#### Post Errand

Customer can create an errand request with:

- Errand title
- Description
- Category
- Pickup or delivery location
- Estimated item cost
- Runner fee
- Deadline
- Customer wallet address

Example:

```txt
Buy foodstuff from Ogbete Market
Budget: 25 USDC
Runner fee: 5 USDC
Delivery: My hostel before 6PM
```

#### View Errand Status

Customer can track the errand timeline:

```txt
Posted
Accepted
Escrow funded
In progress
Proof uploaded
Completed
Released
```

#### Confirm Completion

Customer can confirm that the runner completed the task properly.

Confirmation triggers escrow release.

#### Open Dispute

Customer can open a dispute if:

- Item was not delivered
- Wrong item was bought
- Proof is fake
- Task was incomplete
- Runner missed the deadline

### Runner Features

#### Browse Errands

Runner can view open errands.

Each errand card shows:

- Title
- Location
- Category
- Budget
- Runner fee
- Deadline

#### Accept Errand

Runner can accept an errand and become responsible for it.

#### Upload Proof

Runner can upload proof of completion, such as:

- Receipt
- Photo of item
- Delivery image
- Short note

#### Get Paid

Runner receives payment after customer confirmation or dispute resolution.

### Admin Features

#### View Disputes

Admin can see all disputed errands.

#### Resolve Dispute

Admin can choose:

```txt
Release funds to runner
Refund customer
```

## Trustless Work Integration

GoPadi uses **Trustless Work single-release escrow** for each errand.

### Escrow Roles

| GoPadi Role | Trustless Work Role |
| --- | --- |
| Customer | Funder |
| Runner / Padi | Receiver |
| Customer | Approver |
| Admin | Dispute Resolver |
| GoPadi | Platform |

### Escrow Lifecycle

```txt
Errand accepted
        ↓
Escrow created
        ↓
Customer funds escrow
        ↓
Runner completes task
        ↓
Customer approves
        ↓
Funds released to runner
```

### Why Trustless Work Matters

GoPadi depends on escrow because neither side should have to trust the other blindly.

The customer knows funds will not be released until the task is done.

The runner knows the customer has already locked payment before they start working.

## MVP Pages

### Landing Page

Purpose: explain GoPadi quickly.

Hero copy:

```txt
Need something done nearby?
Post an errand, lock payment in escrow, and release funds only when it's completed.
```

Buttons:

```txt
Post an Errand
Become a Padi
```

### Post Errand Page

Form fields:

- Title
- Category
- Description
- Location
- Item budget
- Runner fee
- Deadline

### Errand Feed

Shows available errands for runners.

Each card:

```txt
Buy foodstuff
Location: Nsukka
Budget: 25 USDC
Runner fee: 5 USDC
Deadline: Today, 6PM
```

### Errand Detail Page

Shows full errand details and action buttons.

Possible buttons:

```txt
Accept Errand
Fund Escrow
Upload Proof
Confirm Completion
Open Dispute
```

### Deal Timeline Page

Main transaction page.

Example timeline:

```txt
Errand posted
Runner accepted
Escrow created
Customer funded escrow
Runner uploaded proof
Customer confirmed
Funds released
```

### Resolver Dashboard

Shows disputed errands and evidence.

Actions:

```txt
Release to Runner
Refund Customer
```

## Data Model

```ts
type Errand = {
  id: string;
  customerWallet: string;
  runnerWallet?: string;

  title: string;
  description: string;
  category: "foodstuff" | "fuel" | "groceries" | "medicine" | "delivery" | "other";

  location: string;
  itemBudgetUSDC: number;
  runnerFeeUSDC: number;
  totalEscrowAmountUSDC: number;

  deadline: string;

  escrowId?: string;
  escrowContractId?: string;

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
    | "resolved"
    | "refunded";

  proofUrl?: string;
  proofNote?: string;

  createdAt: string;
  updatedAt: string;
};
```

```ts
type Dispute = {
  id: string;
  errandId: string;
  openedBy: "customer" | "runner";
  reason: string;
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

1. Landing page
2. Post errand form
3. Errand feed
4. Accept errand
5. Create escrow
6. Fund escrow
7. Upload proof
8. Confirm completion
9. Release funds
10. Basic timeline

### Should Build

1. Dispute flow
2. Resolver dashboard
3. Seeded demo errands
4. Status badges

### Skip for Hackathon

1. Real delivery tracking
2. Full KYC
3. Real fiat payments
4. Complex runner ratings
5. Mobile app
6. Multi-location routing
7. Production-grade verification

## Demo Script

### Successful Errand Demo

1. Customer posts an errand:

```txt
Buy foodstuff from the market.
Budget: 25 USDC.
Runner fee: 5 USDC.
```

2. Runner opens the errand feed and accepts it.
3. GoPadi creates a Trustless Work escrow.
4. Customer funds escrow with 30 USDC.
5. Runner uploads receipt/photo proof.
6. Customer confirms completion.
7. Funds are released to runner.
8. Timeline shows the full transaction trail.

### Dispute Demo

1. Customer posts another errand.
2. Runner accepts and escrow is funded.
3. Runner uploads proof.
4. Customer opens dispute:

```txt
Wrong items were delivered.
```

5. Admin views evidence.
6. Admin resolves by refunding customer or releasing funds to runner.

## Success Criteria

The MVP is successful if judges can see:

```txt
Post errand
→ Accept errand
→ Fund escrow
→ Complete task
→ Upload proof
→ Confirm
→ Release payment
```

And understand that Trustless Work is the core trust layer of the product.

## Final Hackathon Pitch

**GoPadi** is an escrow-powered local errand marketplace. Customers post errands like buying foodstuff, fuel, groceries, or medicine. A trusted local runner accepts the task, but payment is not sent directly. Instead, the customer locks funds in Trustless Work escrow. The runner completes the task and uploads proof. Once the customer confirms completion, funds are released.

GoPadi protects customers from disappearing runners and protects runners from customers who refuse to pay after work is done. It turns informal local errands into trusted, programmable transactions.
