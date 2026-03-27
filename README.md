# ⚡ Amazon Realtime Slot Tracker

A production-ready Chrome Extension (Manifest V3) designed to extract and track job slot availability on Amazon hiring portals in real-time. This extension provides recruiters, applicants, and warehouse managers with an instant, high-fidelity view of workforce demand and filling rates.

![Screenshot](src/assets/icons/128.png)

## 🚀 Key Features

- **Real-time Extraction**: Automatically identifies `scheduleId` from active Amazon hiring URLs (supporting `.ca` and `.com`).
- **Authorization Bypass**: Uses a sophisticated "Main World" injection technique to bypass 401 Unauthorized errors and CORS restrictions by leveraging the site's own session context.
- **Comprehensive Metrics**: Tracks 11 distinct data points across overall schedules and specific batch start dates.
- **Premium UI**: Modern, glass-morphic dashboard with dark-mode aesthetics, subtle micro-animations, and status-aware color coding.
- **High Performance**: Built with React and built with a lightweight background service worker for zero latency.

## 📊 Tracked Metrics

### 🛡️ Labor (Overall Schedule)
- **Total Orders**: Number of overall labor orders.
- **Total Positions**: Total capacity for the schedule.
- **Open Positions**: Currently available slots in the pool.
- **Filled Positions**: Slots occupied by applicants.
- **Available Positions**: Net slots ready for immediate intake.
- **Soft/Hard Matches**: Precise tracking of placement statuses.

### 📅 Start Date (Specific Batch)
- **Batch Demand**: Total positions for the specific start date.
- **Batch Filled**: Currently filled slots for the batch.
- **Batch Available**: Slots remaining for the specific date.
- **Denied Applications**: Real-time count of rejected applications for the batch.

## 🛠️ Technical Stack

- **Frontend**: React.js
- **Styling**: Tailwind CSS (Glassmorphism & Custom Gradients)
- **Build System**: Webpack + Babel
- **Extension API**: Manifest V3 (Service Workers, Scripting API, Tabs)
- **Security**: "Main World" Script Execution for session persistence.

## 📥 Installation

1. **Clone or Download** this repository.
2. Run **`yarn install`** to install dependencies.
3. Run **`yarn build`** to generate the production `dist` folder.
4. Open Chrome and navigate to **`chrome://extensions/`**.
5. Enable **Developer mode** in the top right.
6. Click **Load unpacked** and select the **`dist`** folder from the project directory.

## 💡 Usage

1. Navigate to an Amazon Hiring page (e.g., `hiring.amazon.com/application/us/...`).
2. Ensure you are looking at a **Job Confirmation** or **Schedule** page where a `scheduleId` is present in the URL.
3. Click the extension icon to reveal the live metrics dashboard.
4. Click the **Refresh** icon in the popup header to trigger a new sync at any time.

## 📝 Configuration

The extension is pre-configured to handle both `.ca` (Canada) and `.com` (US) Amazon hiring domains. If additional country domains are needed, add them to the `host_permissions` section of `public/manifest.json`.

---
*Created by Antigravity AI for the next generation of Amazon hiring management.*