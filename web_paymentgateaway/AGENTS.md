# AGENTS.md

## Project Overview

This project is a university UTS project named:

WEB_PaymentGateway

The goal is to build a simple e-commerce payment flow using:

Select Item
→ Checkout
→ Payment
→ Payment Gateway
→ Webhook
→ Automatic Payment Status Update

The application must allow users to:

1. Browse products by category.
2. Select products.
3. Add products to a cart.
4. Review selected products in checkout.
5. Change product quantities.
6. See subtotal, tax, and total.
7. Create a checkout/order.
8. Continue to payment.
9. Pay using Xendit or another payment gateway.
10. Automatically update payment status to PAID/LUNAS after receiving a valid payment webhook.

---

# Technology Stack

Use the following technologies:

- Next.js
- JavaScript
- React
- Pages Router
- MongoDB Atlas
- Official `mongodb` Node.js driver
- Xendit Payment Gateway
- Vercel for deployment
- Tailwind CSS if already configured

Do NOT introduce another framework unless explicitly requested.

---

# IMPORTANT: Next.js Architecture

This project MUST use the Next.js Pages Router.

Use:

pages/

DO NOT use:

app/

Examples of valid pages:

pages/index.js
pages/checkout.js
pages/payment.js

Examples of valid API routes:

pages/api/products/index.js
pages/api/checkout/index.js
pages/api/checkout/[id].js
pages/api/xendit/create-session.js
pages/api/xendit/webhook.js

Do NOT convert this project to the App Router.

Do NOT create:

app/
app/api/
route.js
layout.js

unless explicitly instructed by the user.

---

# Programming Language

Use JavaScript.

Do NOT convert the project to TypeScript.

Use:

.js

instead of:

.ts
.tsx

Keep the code simple enough for a university student to understand and explain during a demo.

---

# Main Application Flow

The required flow is:

1. Select Item Page
2. Checkout Page
3. Payment Page
4. Xendit Hosted Payment
5. Xendit Webhook
6. MongoDB Payment Status Update
7. Website Displays LUNAS

Architecture:

Frontend
↓
Next.js API Routes
↓
MongoDB
↓
Xendit
↓
Webhook
↓
MongoDB
↓
Frontend

The frontend must NEVER directly mark a payment as PAID.

---

# Page Requirements

## 1. Select Item Page

File:

pages/index.js

The page should contain:

- Header / logo
- Search bar
- Product categories
- Product cards
- Product name
- Product price
- Product description
- Product image or placeholder
- Add button
- Cart item counter

Users should be able to:

- Search products
- Filter products by category
- Add products to cart

Product data should eventually come from MongoDB.

Temporary cart data may be stored in localStorage.

---

## 2. Checkout Page

File:

pages/checkout.js

The page should display:

- Selected products
- Product names
- Prices
- Quantity
- Increase quantity button
- Decrease quantity button
- Remove item button
- Subtotal
- Tax
- Total
- Continue to Payment button

Important:

The frontend may calculate totals for display purposes.

However, the backend MUST recalculate the actual payment total using product prices stored in MongoDB.

Never trust totals sent directly by the browser.

When the user clicks:

Continue to Payment

create a checkout/order through:

POST /api/checkout

Then redirect to:

/payment?checkoutId=<checkoutId>

---

## 3. Payment Page

File:

pages/payment.js

The page should retrieve checkout information from the backend using:

GET /api/checkout/[id]

Display:

- Reference ID
- Ordered items
- Quantities
- Subtotal
- Tax
- Total
- Payment status
- Confirm & Pay button

Possible status labels:

PENDING_PAYMENT → Menunggu Pembayaran
PAID → LUNAS
EXPIRED → Pembayaran Kedaluwarsa

The Confirm & Pay button should be disabled or hidden if the checkout is already PAID.

---

# Project Structure

Preferred structure:

WEB_PaymentGateway/
│
├── components/
│   ├── Navbar.js
│   ├── ProductCard.js
│   ├── CartItem.js
│   └── StatusBadge.js
│
├── lib/
│   └── mongodb.js
│
├── pages/
│   ├── api/
│   │   ├── products/
│   │   │   └── index.js
│   │   │
│   │   ├── checkout/
│   │   │   ├── index.js
│   │   │   └── [id].js
│   │   │
│   │   └── xendit/
│   │       ├── create-session.js
│   │       └── webhook.js
│   │
│   ├── _app.js
│   ├── index.js
│   ├── checkout.js
│   └── payment.js
│
├── public/
│
├── styles/
│   └── globals.css
│
├── .env.local
├── .gitignore
├── AGENTS.md
└── package.json

Do not unnecessarily change this structure.

---

# MongoDB

Use MongoDB Atlas.

Use the official:

mongodb

Node.js driver.

Do NOT use Prisma unless explicitly requested.

Do NOT use Mongoose unless explicitly requested.

Create a reusable MongoDB connection helper:

lib/mongodb.js

Environment variables:

MONGODB_URI=
MONGODB_DB=WEB_PaymentGateway

Never expose MongoDB credentials to client-side code.

Never use:

NEXT_PUBLIC_MONGODB_URI

---

# MongoDB Collections

The primary collections are:

1. products
2. checkouts
3. payments

---

# Products Collection

Example structure:

{
  "_id": ObjectId,
  "name": "Coffee",
  "category": "Drinks",
  "description": "Fresh coffee",
  "price": 25000,
  "imageUrl": "",
  "isActive": true
}

Product prices stored in MongoDB are the authoritative prices.

Never trust product prices submitted by the frontend.

---

# Checkouts Collection

Example:

{
  "_id": ObjectId,
  "referenceId": "ORDER-123456",
  "items": [
    {
      "productId": "...",
      "name": "Coffee",
      "price": 25000,
      "quantity": 2,
      "subtotal": 50000
    }
  ],
  "subtotal": 50000,
  "tax": 0,
  "total": 50000,
  "status": "PENDING_PAYMENT",
  "createdAt": Date,
  "updatedAt": Date
}

Possible checkout statuses:

PENDING_PAYMENT
PAID
EXPIRED
CANCELLED

---

# Payments Collection

Example:

{
  "_id": ObjectId,
  "checkoutId": "...",
  "referenceId": "ORDER-123456",
  "paymentSessionId": "...",
  "paymentId": null,
  "amount": 50000,
  "status": "PENDING",
  "paidAt": null,
  "createdAt": Date,
  "updatedAt": Date
}

Possible payment statuses:

PENDING
PAID
EXPIRED
FAILED

---

# Product API

Use:

GET /api/products

The API should:

- Connect to MongoDB
- Retrieve active products
- Return JSON
- Handle errors properly
- Return proper HTTP status codes

The Select Item page should retrieve product data from this API.

---

# Checkout API

Use:

POST /api/checkout

Responsibilities:

1. Receive product IDs and quantities.
2. Validate the request.
3. Retrieve actual product data from MongoDB.
4. Retrieve actual product prices from MongoDB.
5. Recalculate subtotal on the server.
6. Calculate tax on the server.
7. Calculate total on the server.
8. Generate a unique referenceId.
9. Save the checkout.
10. Set initial status to:

PENDING_PAYMENT

11. Return:

checkoutId
referenceId

IMPORTANT:

Never trust:

price
subtotal
tax
total

sent by the frontend.

The server must calculate the authoritative payment amount.

---

# Checkout Detail API

Use:

GET /api/checkout/[id]

Responsibilities:

- Validate MongoDB ObjectId
- Retrieve checkout
- Return 404 if checkout does not exist
- Return checkout information as JSON

The Payment page uses this API.

---

# Xendit Integration

Xendit integration must happen on the SERVER.

Never call Xendit's secret API directly from frontend JavaScript.

Environment variable:

XENDIT_SECRET_KEY=

Never use:

NEXT_PUBLIC_XENDIT_SECRET_KEY

The secret key must never be included in:

- React components
- localStorage
- query parameters
- client-side JavaScript
- GitHub commits
- console logs

---

# Create Payment Session

Use:

POST /api/xendit/create-session

Flow:

Payment Page
↓
POST /api/xendit/create-session
↓
Retrieve Checkout from MongoDB
↓
Validate Checkout
↓
Create Xendit Payment Session
↓
Store Payment Information
↓
Return payment URL
↓
Redirect Browser to Xendit

The endpoint must:

1. Receive checkoutId.
2. Find checkout in MongoDB.
3. Reject if checkout does not exist.
4. Reject if checkout is already PAID.
5. Reject if total <= 0.
6. Create a Xendit payment.
7. Use the checkout referenceId as payment reference.
8. Use checkout.total as the payment amount.
9. Save payment information to MongoDB.
10. Return the payment URL.

Initial local payment status:

PENDING

Do NOT set checkout status to PAID here.

---

# Webhook

Webhook endpoint:

POST /api/xendit/webhook

The webhook is responsible for updating payment status.

Required flow:

Xendit
↓
Webhook
↓
Verify Webhook
↓
Find Transaction
↓
Update Payment
↓
Update Checkout
↓
Return HTTP 200

The webhook must verify that the request genuinely comes from Xendit.

Environment variable:

XENDIT_WEBHOOK_TOKEN=

Never expose this variable to client-side JavaScript.

---

# Payment Status Security Rule

THIS RULE IS CRITICAL.

The following is NOT allowed:

Frontend
→ set payment status = PAID

The following is also NOT allowed:

Success Redirect
→ automatically set PAID

A redirect back from Xendit does NOT prove that payment was successful.

Correct flow:

Xendit Payment
↓
Xendit Webhook
↓
Verified Server Endpoint
↓
MongoDB
↓
status = PAID

Only a verified webhook may mark the payment as PAID.

---

# Webhook Idempotency

Webhook processing must be idempotent.

Xendit may send the same webhook more than once.

If the payment is already PAID:

- Do not create duplicate payment records.
- Do not duplicate checkout records.
- Do not duplicate transactions.
- Do not break the application.

Repeated webhook calls should safely produce the same final state.

---

# Payment Status Update on Frontend

The Payment page may poll:

GET /api/checkout/[id]

approximately every 3 seconds while payment is pending.

Flow:

PENDING_PAYMENT
↓
poll backend
↓
webhook updates MongoDB
↓
poll backend again
↓
PAID
↓
display LUNAS

Stop polling once payment becomes PAID.

Clear intervals when the React component unmounts.

The frontend is READ ONLY regarding payment status.

---

# localStorage

localStorage may be used only for temporary cart information.

Example:

[
  {
    "productId": "...",
    "name": "Coffee",
    "price": 25000,
    "quantity": 2
  }
]

Do NOT use localStorage as the authoritative source for:

- payment amount
- checkout status
- payment status
- payment confirmation

MongoDB must be the authoritative source for checkout and payment state.

---

# Environment Variables

Expected environment variables:

MONGODB_URI=
MONGODB_DB=WEB_PaymentGateway

XENDIT_SECRET_KEY=
XENDIT_WEBHOOK_TOKEN=

NEXT_PUBLIC_BASE_URL=

Never commit `.env.local`.

Ensure `.gitignore` contains:

.env*
.env.local

Do not print secrets in logs.

---

# Security Rules

Always follow these rules:

1. Never expose secret API keys to the browser.
2. Never trust payment amount from frontend.
3. Never allow frontend to mark payments as PAID.
4. Verify Xendit webhook requests.
5. Validate MongoDB ObjectIds.
6. Validate request bodies.
7. Return appropriate HTTP status codes.
8. Handle API failures gracefully.
9. Never commit `.env.local`.
10. Never log API keys or database credentials.

---

# Error Handling

API routes should return meaningful status codes.

Examples:

200 → Success
201 → Resource created
400 → Invalid request
401 → Unauthorized webhook
404 → Resource not found
405 → Method not allowed
409 → Invalid transaction state
500 → Internal server error

Use:

try {
  ...
} catch (error) {
  ...
}

Do not silently ignore errors.

---

# UI Guidelines

Keep the UI:

- Simple
- Clean
- Responsive
- Easy to demonstrate
- Similar to the provided assignment wireframe
- Not unnecessarily complex

The assignment functionality is more important than advanced visual effects.

Avoid:

- Complex animations
- Large UI libraries unless necessary
- Over-engineering
- Unnecessary state management libraries

React state and localStorage are sufficient for the cart.

---

# Code Style

Prefer:

- const
- async/await
- React functional components
- clear variable names
- small reusable functions
- simple code
- comments only when useful

Avoid:

- unnecessary abstraction
- overly complex design patterns
- deeply nested functions
- giant components
- duplicated code
- unused dependencies

Use descriptive names such as:

checkoutId
referenceId
paymentSessionId
paymentStatus
selectedItems
subtotal
total

Avoid vague names such as:

data1
temp2
x
abc

unless used for very small temporary operations.

---

# AI Coding Instructions

When helping with this project:

1. Inspect existing relevant files before making changes.

2. Do NOT rewrite working code unnecessarily.

3. Only modify files related to the requested feature.

4. Before making a major modification, explain:
   - what files will be changed
   - why they need to change

5. Preserve the existing project architecture.

6. Never change the project from Pages Router to App Router.

7. Never convert JavaScript to TypeScript.

8. Never introduce a new database or ORM without permission.

9. Never expose environment secrets.

10. Do not implement multiple major features at once unless explicitly requested.

11. Prefer incremental development.

12. After implementation, always explain:
    - what was changed
    - how it works
    - how to test it
    - possible errors to watch for

13. If an error occurs:
    - identify the root cause first
    - explain the error
    - apply the smallest possible fix
    - do NOT rebuild the entire project unless absolutely necessary

14. Do not delete existing functionality unless explicitly requested.

15. Do not change unrelated files.

---

# Development Strategy

Implement features in this order:

Phase 1:
Next.js Setup

Phase 2:
Select Item UI

Phase 3:
Cart functionality

Phase 4:
Checkout UI

Phase 5:
Payment UI

Phase 6:
MongoDB connection

Phase 7:
Products API

Phase 8:
Checkout API

Phase 9:
Deploy to Vercel

Phase 10:
Xendit Payment Integration

Phase 11:
Webhook

Phase 12:
Automatic Payment Status Update

Phase 13:
Testing

Phase 14:
Final Demo

Do NOT jump to later phases if the previous core functionality is broken.

---

# Testing Checklist

Before considering a feature finished, verify it manually.

## Product

- Products load
- Categories work
- Search works
- Add to cart works

## Cart

- Correct product added
- Quantity works
- Remove item works
- Cart survives page navigation when appropriate

## Checkout

- Products display correctly
- Quantity is correct
- Subtotal is correct
- Tax is correct
- Total is correct
- Checkout is saved to MongoDB

## Payment

- Correct checkout loads
- Correct total appears
- Confirm & Pay works
- User is redirected to Xendit

## Webhook

- Xendit webhook reaches the application
- Webhook is verified
- Correct checkout is found
- Payment becomes PAID
- Checkout becomes PAID
- Duplicate webhook does not create duplicate transactions

## Final Result

The complete flow must work:

Select Item
→ Checkout
→ Payment
→ Xendit
→ Payment Completed
→ Webhook
→ MongoDB Updated
→ LUNAS

---

# Git Rules

Use meaningful commits.

Examples:

chore: initialize Next.js payment gateway project

feat: implement select item page

feat: implement checkout page

feat: connect MongoDB

feat: persist checkout orders

feat: integrate Xendit payment session

feat: implement Xendit webhook

fix: handle duplicate payment webhook

docs: finalize project for UTS submission

Avoid meaningless commit messages such as:

update
fix
test
final
final2

Do not commit:

.env.local
API keys
MongoDB credentials
Xendit secrets

---

# Scope Control

Do NOT add features that are not needed for the assignment unless explicitly requested.

Do not automatically implement:

- Authentication
- Login
- Registration
- Admin dashboard
- User accounts
- JWT
- Redux
- Prisma
- Firebase
- Shopping history
- Email notifications
- Complex inventory systems

The priority is a reliable implementation of:

Select Item
→ Checkout
→ Payment
→ Automatic Payment Status Update

---

# Definition of Done

The project is considered complete when:

1. Select Item page works.
2. Checkout page works.
3. Payment page works.
4. Products are stored in MongoDB.
5. Checkouts are stored in MongoDB.
6. Payments are stored in MongoDB.
7. Xendit payment can be created.
8. User can complete a test payment.
9. Xendit webhook reaches the application.
10. Webhook updates payment status.
11. Checkout becomes PAID.
12. Website automatically displays LUNAS.
13. Application is deployed and accessible.
14. Secrets are not exposed.
15. Source code is pushed to Git.
16. The complete flow can be demonstrated without manual database modification.