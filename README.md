# ShopSphere

## Online + Offline Shopping Platform with Hindsight Memory

ShopSphere is a shopping platform that helps users answer one simple question:

> "I need a product. Where can I get it — online or from a nearby physical shop?"

Instead of checking multiple platforms and physically visiting shops one by one, ShopSphere brings online and nearby offline options together so users can compare, decide, buy online, or reserve from a local shop.

## Problem

Sometimes a customer needs a product quickly, but:

- Online delivery may take too long.
- The product may not be available on fast-delivery platforms.
- Nearby shops may have the product, but the customer does not know which shop has it.
- Visiting multiple shops just to check availability wastes time.
- Customers may want to compare online prices with local shop prices before deciding.

## Our Solution

ShopSphere combines online shopping information with nearby physical-store availability.

### Basic Flow

Search → Compare Online & Offline → Decide → Buy or Reserve

Users can:

- Search for products.
- Compare online prices and information.
- Find nearby physical shops.
- Check shop availability and price.
- See distance and estimated travel information.
- Reserve a product at a nearby shop.
- Go to the shop and collect the reserved product.

## Hindsight Memory

Hindsight is a core technology of ShopSphere.

Instead of treating every interaction as completely new, ShopSphere can retain useful user interactions and preferences.

For example:

- A user prefers nearby physical shops when they need a product quickly.
- A user previously reserved a product from a particular shop.
- A user frequently searches for certain types of products.

The system can retain these experiences and recall relevant information later.

This creates a more personalized shopping experience over time.

### Memory Flow

User Interaction
        ↓
ShopSphere Backend
        ↓
Hindsight Memory
        ↓
Retain useful experience
        ↓
Recall relevant memory
        ↓
Personalized future interaction

## Key Features

### Product Search
Users can search for products and view available options.

### Online vs Offline Comparison
Compare online product information with nearby physical-store options.

### Nearby Shop Discovery
Find physical shops based on distance and selected search radius.

### Shop Reservation
If a product is available in a nearby shop, the customer can reserve it before travelling.

### Reservation Status
Customers can view the status of their reservation.

### Shopkeeper Inventory
The planned platform supports shop inventory information such as:

- Total stock
- Reserved stock
- Available stock
- Purchased stock

### AI Shopping Assistant
The planned AI assistant can help users search, compare and interact with the platform using natural language.

### Hindsight Memory
User experiences and preferences can be retained and recalled to make future interactions more useful.

## Current MVP

The current hackathon MVP focuses on:

- React + Vite frontend
- Node.js + Express backend
- Hindsight memory integration
- Product search
- Online/offline comparison
- Nearby shop concept
- Product reservation
- Basic shopkeeper functionality

## Technology Stack

### Frontend
- React
- Vite
- JavaScript
- CSS

### Backend
- Node.js
- Express.js

### Memory
- Hindsight

### Planned / Future Technologies
- MySQL
- Gemini API
- Google Maps
- Razorpay
- Voice search
- Image search
- Barcode search

## Architecture

User
  ↓
React Frontend
  ↓
Node.js + Express Backend
  ↓
Hindsight Memory

Future integrations can include:

Node.js Backend
  ├── MySQL
  ├── Gemini API
  ├── Google Maps
  └── Razorpay

## Why ShopSphere?

ShopSphere is not simply another online shopping platform.

The goal is to connect two shopping choices:

1. Buy online
2. Buy from a nearby physical shop

This is especially useful when a customer needs something quickly and wants to know whether a nearby store has it before travelling.

## Future Vision

The future version of ShopSphere can expand with:

- Real-time shop inventory
- Verified shopkeepers
- AI-powered shopping assistance
- Voice, image and barcode search
- Personalized recommendations using Hindsight
- Google Maps integration
- Online marketplace integrations
- Secure payments
- Telangana-first expansion followed by wider India

## Project Status

🚧 Hackathon MVP under development.

ShopSphere is being developed as a prototype to demonstrate the combination of online shopping, offline store discovery, reservation and Hindsight-powered memory.

## Team

Built for hackathon development by the ShopSphere team.
