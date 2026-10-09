# StockTrack - Mobile Stock Receiving & Delivery Tracking App

A fast, mobile-first inventory tracking application built strictly for **stock receiving and delivery quantity tracking** across any product category (chocolates, perfumes, cosmetics, groceries, electronics, hardware, garments, etc.).

---

## 🌟 Key Features

### 1. 📊 Dashboard
- **Total Products**: Real-time count of unique catalogued products.
- **Total In-Stock Units**: Aggregated sum of all quantities currently on hand.
- **Received Today**: Sum of all units received today.
- **Delivered Today**: Sum of all units delivered today.
- **Quick Inbound/Outbound Shortcuts**: One-tap access to Receive or Deliver.
- **Recent Activities Stream**: Live transaction log showing type, timestamp, product, quantity (+/-), and balance.

### 2. 📦 Product Management
- Add & manage products with:
  - Product Name (e.g. *Ferrero Rocher 24s*, *Dior Sauvage 100ml*)
  - Unique Product ID / SKU code (auto-generator included)
  - Category (Confectionery, Perfumes, Cosmetics, Groceries, Electronics, etc.)
  - Unit of Measurement (*pieces, boxes, bottles, packets, kg, litres, cartons, dozens, etc.*)
  - Current stock balance
- Seamless inline creation directly inside Receive Stock workflow.

### 3. 📥 Receive Stock (Inbound)
- Select existing product or create a new product inline.
- Shows current balance and real-time calculation preview (`Current + Received = New Balance`).
- Optional supplier name, reference slip/PO number, and notes.
- Automatic date/time recording (with optional custom timestamp override).
- **Mandatory Review & Confirmation Dialog** before updating balances.
- Post-confirmation success card showing previous balance, received quantity, and updated balance with celebration animation.

### 4. 📤 Deliver Stock (Outbound)
- Select product and see instant available stock badge.
- **Strict Over-Delivery Protection**: Prevents entering quantities exceeding available stock.
- Rejects zero or negative quantities with clear validation messages.
- Real-time balance calculation (`Current - Delivered = Remaining Balance`).
- Optional recipient, destination, dispatch slip number, and notes.
- Mandatory Review & Confirmation dialog before finalizing delivery.

### 5. 🗃️ Current Stock (Inventory)
- Clean card-based inventory list with product name, SKU, category, current balance, and unit.
- Instant search filter (by name, code, or category).
- Category filter pills.
- Sorting options (Name A-Z, Highest Quantity, Lowest Quantity, Recently Active).
- Direct one-tap action buttons on each card to **Receive** or **Deliver** that product directly.

### 6. 🕒 Transaction History & Controlled Reversal
- Immutable audit log showing:
  - Product name & SKU
  - Transaction Type (Stock Received, Stock Delivered, Reversal)
  - Quantity received or delivered
  - Previous balance & updated balance
  - Date, time, and operator name
  - Supplier or recipient & reference number
- Search and filter by product, transaction type, and date range (Today, 7 Days, Month, All Time).
- **Controlled Reversal Process**: If an entry was made in error, a controlled reversal creates an offsetting transaction with a mandatory reason while preserving the original record in the audit trail.

### 7. 👥 Multi-User Attribution & Data Reliability
- Operator selector in the header (e.g., *Umair (Store Manager)*, *Ali (Storekeeper)*, or custom name).
- Every transaction explicitly records who performed it.
- Multi-tab synchronization via storage events.
- **Data Backup & Restore**: One-click JSON backup export/import.
- **CSV Reports**: Export transactions and inventory balances to CSV for spreadsheet viewing.

---

## 🚀 How to Run Locally

### Prerequisites
- Node.js (v18+) and npm

### Steps
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173/` in your browser. On mobile devices on the same Wi-Fi network, access using the network IP shown in the terminal.

---

## 📱 Mobile App Creation with GitHub Actions

This repository includes a ready-to-run GitHub Actions workflow (`.github/workflows/build-android-apk.yml`) powered by Capacitor.

### How to Build the Android APK automatically:
1. **Push this repository to GitHub**:
   ```bash
   git add .
   git commit -m "Initial commit: StockTrack mobile app"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
   git branch -M main
   git push -u origin main
   ```
2. **GitHub Actions automatically starts building**:
   - Go to your repository on GitHub.
   - Click on the **Actions** tab.
   - You will see the **Build Android APK** workflow running.
3. **Download your Android APK**:
   - Once the workflow completes (takes ~2-3 minutes), click on the workflow run.
   - Scroll down to the **Artifacts** section at the bottom.
   - Click **`StockTrack-debug-apk`** to download the zip containing your installable `.apk` file!
   - Transfer and install the `.apk` on any Android smartphone.

### How to Build APK Locally (Optional):
If you have Android Studio installed on your PC:
```bash
npm run build
npx cap sync android
npx cap open android
```
Then click **Build > Build Bundle(s) / APK(s) > Build APK(s)** in Android Studio.

---

## 🌐 Install as PWA (Progressive Web App)
You can also install this app directly onto any iPhone or Android phone without an app store:
1. Open the hosted web link in **Chrome** (Android) or **Safari** (iOS).
2. Tap **Share / Menu** (`...` or share icon).
3. Select **"Add to Home Screen"**.
4. The app installs with its custom icon and runs fullscreen like a native mobile app!

---

## 🛑 Scope Compliance
As requested:
- Strictly tracks physical quantities.
- No pricing, sales orders, purchase costs, profits, revenue, accounting, or low-stock alerts.
