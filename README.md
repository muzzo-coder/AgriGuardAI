# 🌱 AgriGuard AI - Intelligent Plant Disease Diagnostic System

[![GitHub License](https://img.shields.io/github/license/muzzo-coder/AgriGuardAI)](https://github.com/muzzo-coder/AgriGuardAI)
[![React](https://img.shields.io/badge/Frontend-React%20%28TypeScript%29-blue)](https://reactjs.org/)
[![Flask](https://img.shields.io/badge/Backend-Flask%20%28Python%29-green)](https://flask.palletsprojects.com/)
[![TensorFlow](https://img.shields.io/badge/ML-TensorFlow%20%2F%20Keras-orange)](https://wwww.tensorflow.org/)

**AgriGuard AI** is a premium, full-stack solution designed to bridge the gap between advanced Machine Learning and practical agriculture. By combining deep learning-based plant disease detection with a healthcare-inspired user interface, it empowers farmers and gardening enthusiasts to identify, treat, and prevent plant diseases with professional precision.

---

## 🚀 Features

- 📸 **Disease Detection**: High-accuracy ML-based prediction using image uploads or real-time webcam capture.
- 🤖 **AI Chatbot Assistant**: Specialized agricultural AI providing organic treatments and preventive measures.
- 🎙️ **Voice Integration**: Hands-free interaction with integrated Speech-to-Text (STT) functionality.
- 🌍 **Multi-Language Support**: Accessible global interface supporting multiple regional languages.
- 🌓 **Theme Toggle**: Seamless switching between Light and Dark modes for optimal outdoor visibility.
- 🌿 **Agriculture + Healthcare UI**: A unique design system blending natural aesthetics with clinical data precision.
- 📱 **Fully Responsive**: Optimized for desktops, tablets, and mobile devices for field use.

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: [React](https://react.dev/) (TypeScript)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **State Management**: React Hooks & Context API

### **Backend**
- **Framework**: [Flask](https://flask.palletsprojects.com/) (Python)
- **AI/ML**: [TensorFlow](https://www.tensorflow.org/) / Keras
- **Image Processing**: OpenCV / PIL
- **Integration**: OpenAI API (for agricultural intelligence)

---

## 📁 Project Structure

```text
AgriGuardAI/
├── frontend/             # React (TypeScript) Source Code
│   ├── src/              # Components, Pages, Assets
│   ├── public/           # Static Public Files
│   └── package.json      # Frontend Dependencies
├── leaf.py               # Flask Backend Main Entry Point
├── requirements.txt      # Python Dependencies
├── model.h5              # Trained Keras Model
├── Dataset/              # Sample Data for Testing
└── static/               # Backend Static Assets & Uploads
```

---

## ⚙️ Installation & Setup

### **1. Backend Setup**
Navigate to the root directory:
```bash
# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the backend server
python leaf.py
```
> [!NOTE]
> The backend will run on [http://127.0.0.1:8080](http://127.0.0.1:8080)

### **2. Frontend Setup**
Navigate to the frontend directory:
```bash
cd frontend

# Install npm packages
npm install

# Run the development server
npm run dev
```
> [!NOTE]
> The frontend will run on [http://localhost:5173](http://localhost:5173)

---

## 🌐 Usage

1.  **Launch the App**: Open [Frontend Link](http://localhost:5173) in your browser.
2.  **Select Diagnostic Tool**: Choose between **Image Upload** or **Webcam Capture**.
3.  **Run Analysis**: Click "Scan" to let the AI process the cellular patterns of the leaf.
4.  **View Results**: Receive a Top-3 prediction with confidence scores and disease descriptions.
5.  **Consult AI Bot**: Ask the chatbot about specific organic treatments or prevention strategies.
6.  **Switch Settings**: Use the navbar to change languages or toggle Dark Mode.

---

## 📸 Screenshots

| Dashboard (Light Mode) | Diagnosis View |
| :---: | :---: |
| ![Placeholder](https://placehold.co/600x400?text=Dashboard+UI) | ![Placeholder](https://placehold.co/600x400?text=Diagnosis+Result) |

| AI Chatbot | Settings & Language |
| :---: | :---: |
| ![Placeholder](https://placehold.co/600x400?text=AI+Chatbot) | ![Placeholder](https://placehold.co/600x400?text=Settings+View) |

---

## 🔗 API Endpoints

-   `POST /predict` - Accepts image data and returns disease classification results.
-   `POST /chatbot` - Communicates with the agricultural AI for treatment advice.

---

## 🤝 Contribution

Contributions make the open-source community better! 
1. **Fork** the Project.
2. **Create** your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. **Commit** your Changes (`git commit -m 'Add some AmazingFeature'`).
4. **Push** to the Branch (`git push origin feature/AmazingFeature`).
5. **Open** a Pull Request.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 👨‍💻 Author Info

**Muzzo-Coder**  
GitHub: [@muzzo-coder](https://github.com/muzzo-coder)  
Project Link: [https://github.com/muzzo-coder/AgriGuardAI](https://github.com/muzzo-coder/AgriGuardAI)

---

<p align="center">Made with ❤️ for a Greener Planet</p>
