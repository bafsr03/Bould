# Bould — Clothing Fit for Shopify USING ML

**Bould** is a native Shopify app that allows customers to upload a photo and receive accurate clothing size recommendations. Powered by 3D body measurements and garment fitting models, Bould helps reduce returns and improve customer satisfaction.

---

This app is built with the [Shopify App](https://shopify.dev/docs/apps/getting-started) framework and [Remix](https://remix.run), 
Future Features include:

- **Converter**: Transforms 2D images into body measurements
- **Blanks**: Showcases a catalog of pre-sized garments
- **Stickers**: Uses image generation for product visualizations

Visit the [Shopify Remix Docs](https://shopify.dev/docs/api/shopify-app-remix) for more.

---

## 📌 Project Overview

| Key Area            | Description                                                                 |
|---------------------|-----------------------------------------------------------------------------|
| **Goal**            | Match clothing to users using only their photo                              |
| **Platform**        | Shopify Embedded App                                                        |
| **Stack**           | Remix, Polaris, Node.js, Python APIs, Prisma                                |
| **ML Models**       | Body measurement + HRNet garment matching                                   |
| **Current Status**  | Initial development phase + model testing                                   |

---

##  Technical Stack

| Layer       | Tech                             |
|-------------|----------------------------------|
| Frontend    | Remix, React, Polaris            |
| Backend     | Node.js (Shopify App Remix)      |
| ML Services | Python (Flask/FastAPI, PyTorch)  |
| Data        | Prisma + SQLite (dev), Shopify   |
| Hosting     | Vercel/Fly.io + API microservices|

---

---

## 📆 Implementation Roadmap

###  Phase 1: Planning & Repo Setup (Week 1–2)

* [x] Clone and test ML repos locally
* [ ] Setup body measurement and garment size APIs
* [ ] Define API interface between app ↔ ML service

---

###  Phase 2: Shopify App UI & Polaris (Week 3–4)

* [ ] Build `/dashboard`, `/products`, `/results`
* [ ] Integrate Polaris UI for all views
* [ ] Shopify auth via `shopify.server.ts`
* [ ] Display garment chart manager for merchants

---

###  Phase 3: ML API Integration (Week 5–7)

* [ ] Send uploaded image → ML API
* [ ] Receive body dimensions → frontend
* [ ] Recommend clothing size from database

---

###  Phase 4: Testing & Matching (Week 8–10)

* [ ] Upload 5 sample garments for testing
* [ ] Match user sizes to store’s garment metadata
* [ ] Add logging + rate limiting for 100 requests/user/month

---

###  Phase 5: Final Polish + Go Live (Week 11–12)

* [ ] Shopify landing page for Bould
* [ ] Final QA and UX tweaks
* [ ] Submit to Shopify App Store for review

---

## 🛍️ Admin Features

* Upload custom size charts per garment, based on images or current catalog.
* Connect charts to Shopify products. 
* View matching success & analytics.

---

## 📲 User Flow

1. Upload or take a photo, if not add custom measurements manually.
2. Body size detected by ML API
3. Garment size matched via store’s data
4. Recommended size shown to customer

---


##  ML Repositories Used

| Repository                                                                                      | Purpose |
|--------------------------------------------------------------------------------------------------|---------|
| [`3d-body-measurements`](https://github.com/vcarlosrb/3d-body-measurements)                     | Extract body measurements from user images |
| [`HRNet + Point Cloud`](https://github.com/ZinoStudio931/Automatic-Garments-Size-Measurement-using-HRNet-and-Point-Cloud) | Match garments to body profiles |

---

## App Architecture

### 🔹 Pages
- `/dashboard`: Image upload + measurement results
- `/products`: Add/store garment size charts
- `/results`: View user fitting recommendations

### 🔹 Backend
- Shopify authentication and product metadata
- Upload handling → ML API integration
- Rate limiting (100 requests/user/month)

### 🔹 ML Microservices
- `POST /measurements`: Get body sizes from user photo
- `POST /recommend`: Match garment size from profile

---

##  Local Setup

### Prerequisites
- Node.js >= 18.x
- Python 3.8+
- Shopify Partner Account + Dev Store
- Prisma + SQLite or PostgreSQL

### Install

```bash
# JavaScript
npm install
npm run dev

# Python - Body Measurement Model
cd 3d-body-measurements
pip install -r requirements.txt
python app.py
````

##  Prisma & Database

* Default: SQLite for development
* Production ready: PostgreSQL, MySQL, or MongoDB
* To migrate DB:

  ```bash
  npx prisma generate
  npx prisma db push
  ```

##  Weekly Worklog

| Date          | Update                                                    |
| ------------- | --------------------------------------------------------- |
| July 30, 2025 | README overhaul + full architecture + roadmap established |
| This Week     | ML API connection, Polaris UI implementation begins       |
| Upcoming      | Garment chart manager + Result mapping                    |

---


## Resources

* [Remix Docs](https://remix.run/docs/en/main)
* [Shopify App CLI](https://shopify.dev/docs/apps/tools/cli)
* [Polaris UI Kit](https://polaris.shopify.com/)
* [GraphQL Admin API](https://shopify.dev/docs/api/admin)
* [Deploy to Vercel](https://vercel.com/docs/frameworks/remix)

---

