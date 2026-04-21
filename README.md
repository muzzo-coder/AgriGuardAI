# AgriGuard AI - Funded Startup-Level Plant Health SaaS

AgriGuard AI is a high-performance, industry-level Clinical Decision Support System for plant disease detection. It combines a deep learning backend with a modern, healthcare-inspired React dashboard to provide expert-level agricultural insights.

## 🌟 Key Features
- **AI Scan Dashboard**: Real-time cellular pattern analysis with "Scanning" animations.
- **Top-3 Prediction Engine**: Provides primary diagnosis and alternative possibilities with confidence scoring.
- **Expert Chat Assistant**: Context-aware ChatGPT-inspired guidance on treatment and prevention.
- **Spray Intelligence**: Real-time safety status and optimal spraying windows.
- **Healthcare Design System**: Premium emerald palette, glassmorphism, and full mobile responsiveness.

---

## 🛠 Tech Stack
- **Frontend**: React (Vite), TypeScript, Tailwind CSS v4, Framer Motion.
- **Backend**: Python (Flask), TensorFlow/Keras.
- **API**: Centralized Axios interface with JSON communication.

---

## 💻 IntelliJ IDEA Setup Instructions

To ensure the project runs without errors in IntelliJ:

1.  **Open Project**: Open the root folder in IntelliJ.
2.  **Configure Interpreter**:
    - Go to `Settings` > `Project` > `Python Interpreter`.
    - Click `Add Interpreter` > `Add Local Interpreter`.
    - Select `Existing Environment` and browse to `./venv/bin/python`.
3.  **Install Dependencies**:
    - Open the IntelliJ Terminal and run: `pip install -r requirements.txt`.
4.  **Run Configuration**:
    - Select the pre-configured **"leaf"** run profile in the top-right toolbar.
    - Click the **Run** (Green Play) button.

---

## 🚀 Execution Guide

### 1. Backend (Flask)
```bash
source venv/bin/activate
python3 leaf.py
```
*Port: 8080*

### 2. Frontend (React)
```bash
cd frontend
npm install
npm run dev
```
*URL: http://localhost:5173*

---

## 🛡 Security & Reliability
- **Input Validation**: Only image files are accepted for analysis.
- **Confidence Strategy**: 
  - > 70% | High Confidence
  - 40% - 70% | Medium Confidence
  - < 40% | Low Confidence (Triggers user warning)
- **Error Handling**: Graceful fallback for API failures and no-dead-end UI flow.

---

## 📈 Future Roadmap
- integration with real-time weather APIs for dynamic Spray Intelligence.
- Bulk analysis for commercial farming operations.
- Integration with Gemini Pro for unlimited agricultural conversation depth.
