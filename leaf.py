# Import necessary libraries
from flask import Flask, request, jsonify
import numpy as np
import os
from tensorflow.keras.preprocessing.image import load_img, img_to_array
from tensorflow.keras.models import load_model
from flask_cors import CORS
from deep_translator import GoogleTranslator

import google.generativeai as genai
from dotenv import load_dotenv
from rag_engine import rag_engine # Import our RAG engine

# Initialize Flask app
app = Flask(__name__)
CORS(app) # Allow all routes for development

# Load environment variables
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model_gemini = genai.GenerativeModel('gemini-1.5-flash')
else:
    print("WARNING: GEMINI_API_KEY not found in environment variables. Chatbot will use fallback logic.")
    model_gemini = None

def translate_text(text, target_lang='en'):
    if not text or target_lang == 'en':
        return text
    try:
        translated = GoogleTranslator(source='auto', target=target_lang).translate(text)
        return translated
    except Exception as e:
        print(f"Translation Error: {str(e)}")
        return text

# Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, 'model.h5')
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'static/upload')

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Load model
model = load_model(MODEL_PATH)
print("Model Loaded Successfully")

# Disease Information Mapping (Shortened for brevity here, but keep full version in file)
# ... [Keeping the full DISEASE_INFO as it is used for local mapping] ...

DISEASE_INFO = {
    0: {
        "name": "Bacteria Spot Disease",
        "description": "Bacterial spot is caused by Xanthomonas bacteria. It appears as small, water-soaked spots on leaves which later turn brown and necrotic.",
        "treatment": "Use copper-based fungicides. Ensure seeds are disease-free. Avoid overhead irrigation.",
        "prevention": "Rotate crops every 2-3 years. Remove plant debris after harvest. Use resistant varieties.",
        "severity": "Medium"
    },
    1: {
        "name": "Early Blight Disease",
        "description": "Early blight is caused by the fungus Alternaria solani. It produces target-like spots on older leaves.",
        "treatment": "Apply fungicides like Chlorothalonil or copper-based sprays. Remove infected lower leaves.",
        "prevention": "Keep foliage dry. Space plants for good airflow. Mulch around the base.",
        "severity": "High"
    },
    2: {
        "name": "Healthy and Fresh",
        "description": "The plant appears healthy with no visible signs of disease or pest infestation.",
        "treatment": "Continue regular maintenance, watering, and nutrient application.",
        "prevention": "Maintain good hygiene and monitor regularly for early signs of issues.",
        "severity": "Low"
    },
    3: {
        "name": "Late Blight Disease",
        "description": "Late blight is a serious disease caused by Phytophthora infestans. It can rapidly destroy entire crops.",
        "treatment": "Immediate application of specialized fungicides. Remove and destroy infected plants immediately.",
        "prevention": "Plant resistant varieties. Avoid planting near potatoes. Ensure good drainage.",
        "severity": "Critical"
    },
    4: {
        "name": "Leaf Mold Disease",
        "description": "Leaf mold is caused by Passalora fulva. It typically develops in high humidity environments.",
        "treatment": "Improve greenhouse ventilation. Use fungicides if infestation is severe.",
        "prevention": "Reduce humidity. Prune for better airflow. Use resistant cultivars.",
        "severity": "Medium"
    },
    5: {
        "name": "Septoria Leaf Spot Disease",
        "description": "Septoria leaf spot is caused by Septoria lycopersici. Small, circular spots with gray centers appear on leaves.",
        "treatment": "Apply fungicides containing copper or chlorothalonil. Remove affected leaves.",
        "prevention": "Avoid overhead watering. Rotate crops. Keep the garden free of weeds.",
        "severity": "Medium"
    },
    6: {
        "name": "Target Spot Disease",
        "description": "Target spot is caused by Corynespora cassiicola. It shows as circular brown spots with concentric rings.",
        "treatment": "Spray with fungicides such as azoxystrobin or chlorothalonil.",
        "prevention": "Improve airflow. Avoid excessively long periods of leaf wetness.",
        "severity": "Medium"
    },
    7: {
        "name": "Leaf Curl Virus Disease",
        "description": "TYLCV is a viral disease transmitted by silverleaf whiteflies. It causes yellowing and upward curling of leaves.",
        "treatment": "Primarily involves controlling the whitefly population. No cure for existing virus.",
        "prevention": "Use insect-proof netting. Plant resistant varieties. Control weeds.",
        "severity": "High"
    },
    8: {
        "name": "Mosaic Virus Disease",
        "description": "ToMV causes mottling and discoloration of leaves, often in a mosaic pattern.",
        "treatment": "No cure. Remove and destroy infected plants to prevent spread.",
        "prevention": "Sanitize tools. Avoid touching plants after using tobacco. Control weeds.",
        "severity": "High"
    },
    9: {
        "name": "Two Spotted Spider Mite Disease",
        "description": "Spider mites are tiny pests that suck juices from leaves, causing yellow stippling and webbing.",
        "treatment": "Use insecticidal soap or neem oil. Introduce natural predators like ladybugs.",
        "prevention": "Keep plants well-hydrated. Mist leaves in hot, dry weather to discourage mites.",
        "severity": "Medium"
    }
}

from tensorflow.keras.applications.resnet50 import preprocess_input

def get_prediction(image_path):
    test_image = load_img(image_path, target_size=(224, 224))
    test_image = img_to_array(test_image)
    test_image = preprocess_input(test_image)
    test_image = np.expand_dims(test_image, axis=0)
    
    predictions = model.predict(test_image)[0]
    
    # Get top prediction only
    top_idx = np.argmax(predictions)
    confidence = float(predictions[top_idx])
    info = DISEASE_INFO.get(top_idx, {})
    
    name = info.get("name", "Unknown")
    
    if confidence < 0.6:
        name = "Uncertain / Unrecognized Pathogen"
        
    return {
        "id": int(top_idx),
        "name": name,
        "confidence": confidence,
        "description": info.get("description", ""),
        "treatment": info.get("treatment", ""),
        "prevention": info.get("prevention", ""),
        "severity": info.get("severity", "Medium")
    }

@app.route("/api/health", methods=['GET'])
def health_check():
    return jsonify({
        "status": "online",
        "model_loaded": model is not None,
        "classes": len(DISEASE_INFO)
    })

@app.route("/api/diagnose", methods=['POST'])
def diagnose():
    try:
        # 1. Parse Inputs
        image_file = request.files.get('image')
        description = request.form.get('description', '').strip()
        lang = request.form.get('language', 'en')
        
        # Clinical Debug Logs
        print("--- Diagnosis Request ---")
        print("Image Specimen:", image_file.filename if image_file else "None")
        print("Symptom Description:", description if description else "None")
        print("Target Language:", lang)
        
        if not description and not image_file:
            return jsonify({"error": "No input provided. Please upload an image or describe symptoms."}), 400

        print(f"DEBUG: Processing diagnosis for Description: '{description}'")
        prediction_result = None
        image_url = None
        
        # 2. Handle Image Prediction
        if image_file:
            filename = image_file.filename
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            image_file.save(file_path)
            image_url = f"/static/upload/{filename}"
            prediction_result = get_prediction(file_path)
            
            # Short-circuit for healthy plant
            if prediction_result and prediction_result.get('id') == 2:
                final_diagnosis = {
                    "disease": "Healthy Plant",
                    "confidence": f"{prediction_result.get('confidence', 0)*100:.0f}%",
                    "cause": "No disease detected. Plant appears healthy and fresh.",
                    "treatment": "No treatment required. Continue regular maintenance.",
                    "prevention": "Maintain good hygiene and monitor regularly for early signs of issues."
                }
                
                # Translate Final Result
                if lang != 'en':
                    for key in final_diagnosis:
                        if key != 'confidence':
                            final_diagnosis[key] = translate_text(final_diagnosis[key], lang)
                
                prediction_shim = {
                    "name": final_diagnosis.get("disease"),
                    "severity": "Low",
                    "description": final_diagnosis.get("cause"),
                    "treatment": final_diagnosis.get("treatment"),
                    "prevention": final_diagnosis.get("prevention")
                }
                
                return jsonify({
                    "status": "success",
                    "diagnosis": final_diagnosis,
                    "prediction": prediction_shim,
                    "imageUrl": image_url
                })

        # 3. Handle Text/Context Retrieval (RAG)
        # Combine user description with model prediction for better retrieval
        query_for_rag = description
        if not query_for_rag and prediction_result:
            query_for_rag = prediction_result.get('name', '')
            
        # Translate query to English for better RAG accuracy
        query_for_rag_en = translate_text(query_for_rag, 'en') if lang != 'en' else query_for_rag
        
        print(f"DEBUG: RAG Query (EN): {query_for_rag_en}")
        retrieved_context = rag_engine.retrieve_context(query_for_rag_en or "", k=3)
        
        print(f"DEBUG: Retrieved Context: {retrieved_context[:200]}...") # Log first 200 chars
        
        if not retrieved_context or "No local knowledge available" in retrieved_context:
            print("WARNING: Retrieval returned empty or default context. Using general knowledge fallback.")
            retrieved_context = "Knowledge base search did not yield specific local results for this query. Fallback to general plant pathology knowledge: Fungal infections often present as spots or wilting, while viruses cause curling and mosaic patterns. Pests like mites cause stippling and webbing."

        system_prompt = (
            "You are an expert plant pathologist. Provide a precise diagnostic report."
            "Identify the MOST LIKELY disease based on the data."
            "NEVER return 'Unknown condition' if there are symptoms."
        )
        
        prompt = f"""
        {system_prompt}
        
        INPUTS:
        - ML Prediction: {prediction_result.get('name') if prediction_result else 'None'} ({prediction_result.get('confidence', 0) if prediction_result else 0.0:.2f})
        - Symptoms: {description if description else 'None'}
        - Context: {retrieved_context}
        
        OUTPUT FORMAT (STRICT JSON):
        {{
          "disease": "Disease Name",
          "confidence": "Estimation (e.g., 90%)",
          "cause": "Specific cause",
          "treatment": "Direct treatment steps",
          "prevention": "Prevention measures"
        }}
        """

        final_diagnosis = {}
        if model_gemini:
            print("Initiating Gemini LLM analysis (15s Threaded Timeout)...")
            
            import threading
            import json
            
            llm_result = {"data": None, "error": None}
            
            def run_gemini():
                try:
                    # Attempt the call
                    response = model_gemini.generate_content(prompt)
                    llm_result["data"] = response.text
                except Exception as e:
                    llm_result["error"] = str(e)
            
            llm_thread = threading.Thread(target=run_gemini)
            llm_thread.start()
            llm_thread.join(timeout=20)
            
            if llm_thread.is_alive():
                print("Gemini call timed out after 20 seconds. Switching to local fallback.")
                # We don't need to kill the thread, just proceed. It will finish or die with the process.
            
            if llm_result["data"]:
                try:
                    text = llm_result["data"]
                    if "```json" in text:
                        text = text.split("```json")[1].split("```")[0].strip()
                    elif "```" in text:
                        text = text.split("```")[1].split("```")[0].strip()
                    final_diagnosis = json.loads(text)
                    
                    # Safety check for 'Unknown' in response
                    if "unknown" in str(final_diagnosis.get("disease", "")).lower():
                         print("LLM returned 'Unknown' - forcing local prediction fallback.")
                         final_diagnosis["disease"] = prediction_result.get('name') if prediction_result else "General Plant Pathogen"

                    print("Gemini report generated successfully.")
                except Exception as parse_err:
                    print(f"LLM Parse Error: {parse_err}")
            
            # If still empty or timed out, use fallback
            if not final_diagnosis:
                print("Using local RAG-enhanced fallback due to LLM failure.")
                # Try to extract a name from retrieved_context if possible
                fallback_disease = "General Plant Pathology Analysis"
                if prediction_result:
                    fallback_disease = prediction_result.get('name', 'General Plant Pathogen')
                elif "Disease: " in retrieved_context:
                    try:
                        fallback_disease = retrieved_context.split("Disease: ")[1].split("\n")[0].strip()
                    except: pass
                
                if "unknown" in str(fallback_disease).lower():
                    fallback_disease = "General Plant Pathology Analysis"

                final_diagnosis = {
                    "disease": fallback_disease,
                    "confidence": f"{prediction_result.get('confidence', 0)*100:.0f}%" if prediction_result else "60%",
                    "cause": prediction_result.get('description', 'Pathogen identified through symptom pattern analysis.') if prediction_result else "Symptoms and local context suggest a specific pathogen.",
                    "treatment": prediction_result.get('treatment', 'Apply organic fungicides/pesticides immediately.') if prediction_result else "Apply organic fungicides/pesticides immediately.",
                    "prevention": prediction_result.get('prevention', 'Improve airflow and maintain consistent watering.') if prediction_result else "Improve airflow and maintain consistent watering."
                }
        else:
            # No Gemini - Fallback to ML Model and RAG
            fallback_disease = "General Pathogen Analysis"
            if prediction_result:
                fallback_disease = prediction_result.get('name', 'General Pathogen')
            elif "Disease: " in retrieved_context:
                try:
                    fallback_disease = retrieved_context.split("Disease: ")[1].split("\n")[0].strip()
                except: pass

            final_diagnosis = {
                "disease": fallback_disease,
                "confidence": f"{prediction_result.get('confidence', 0)*100:.0f}%" if prediction_result else "65%",
                "cause": prediction_result.get('description', 'Pathogen identified through symptom pattern analysis.') if prediction_result else "Symptom patterns indicate a potential plant pathology.",
                "treatment": prediction_result.get('treatment', 'Remove infected leaves and apply organic fungicide.') if prediction_result else "Immediate pruning of affected areas and application of organic neem oil or copper spray recommended.",
                "prevention": prediction_result.get('prevention', 'Ensure proper soil health and crop rotation.') if prediction_result else "Improve spacing for airflow, avoid overhead watering, and maintain clean gardening tools."
            }

        # 5. Translate Final Result
        if lang != 'en':
            for key in final_diagnosis:
                final_diagnosis[key] = translate_text(final_diagnosis[key], lang)

        # Compatibility Shim for HistoryPanel (expects 'prediction' object)
        prediction_shim = {
            "name": final_diagnosis.get("disease", "General Plant Pathology"),
            "severity": "High" if "Critical" in str(final_diagnosis) else "Medium",
            "description": final_diagnosis.get("cause", "N/A"),
            "treatment": final_diagnosis.get("treatment", "N/A"),
            "prevention": final_diagnosis.get("prevention", "N/A")
        }

        return jsonify({
            "status": "success",
            "diagnosis": final_diagnosis,
            "prediction": prediction_shim, # Required for HistoryPanel compatibility
            "imageUrl": image_url or "/static/upload/leaf3.png" # Fallback to prevent crash
        })

    except Exception as e:
        import traceback
        err_msg = f"Diagnosis failure: {str(e)}"
        print(f"ERROR: {err_msg}")
        print(traceback.format_exc())
        return jsonify({
            "error": "Analysis engine encountered an internal error.",
            "details": str(e),
            "traceback": traceback.format_exc()
        }), 500

@app.route("/api/translate", methods=['POST'])
def translate_endpoint():
    data = request.json
    if not data or 'texts' not in data or 'target' not in data:
        return jsonify({"error": "Invalid request. Provide 'texts' object and 'target' language."}), 400
    
    texts = data['texts']
    target = data['target']
    
    translated_texts = {}
    for key, text in texts.items():
        if key == 'confidence' or not isinstance(text, str):
            translated_texts[key] = text
        else:
            translated_texts[key] = translate_text(text, target)
            
    return jsonify({
        "status": "success",
        "translated": translated_texts,
        "target": target
    })

import socket

def find_free_port():
    """Finds an available port if the default is busy."""
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.bind(('', 0))
    port = s.getsockname()[1]
    s.close()
    return port

def kill_existing_process_on_port(port):
    """Kills any process currently running on the specified port."""
    try:
        print(f"Cleaning up port {port}...")
        os.system(f"lsof -ti:{port} | xargs kill -9 > /dev/null 2>&1")
    except Exception as e:
        print(f"Cleanup error: {e}")

if __name__ == "__main__":
    # Get preferred port from environment or default to 8088
    preferred_port = int(os.getenv("PORT", 8088))
    
    # Clean up any existing process on the preferred port
    kill_existing_process_on_port(preferred_port)
    
    try:
        print(f"Starting Intelligent Diagnosis Server on port {preferred_port}")
        app.run(host='0.0.0.0', threaded=True, port=preferred_port, debug=True, use_reloader=False)
    except OSError:
        # If still busy, find any free port
        free_port = find_free_port()
        print(f"Port {preferred_port} busy. Falling back to dynamic port: {free_port}")
        app.run(host='0.0.0.0', threaded=True, port=free_port, debug=True, use_reloader=False)
