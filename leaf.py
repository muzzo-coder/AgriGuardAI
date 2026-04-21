# Import necessary libraries
from flask import Flask, request, jsonify
import numpy as np
import os
from tensorflow.keras.preprocessing.image import load_img, img_to_array
from tensorflow.keras.models import load_model
from flask_cors import CORS
from deep_translator import GoogleTranslator

# Initialize Flask app
app = Flask(__name__)
CORS(app) # Allow all routes for development

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

# Disease Information Mapping
DISEASE_INFO = {
    0: {
        "name": "Tomato - Bacteria Spot Disease",
        "description": "Bacterial spot is caused by Xanthomonas bacteria. It appears as small, water-soaked spots on leaves which later turn brown and necrotic.",
        "treatment": "Use copper-based fungicides. Ensure seeds are disease-free. Avoid overhead irrigation.",
        "prevention": "Rotate crops every 2-3 years. Remove plant debris after harvest. Use resistant varieties.",
        "severity": "Medium"
    },
    1: {
        "name": "Tomato - Early Blight Disease",
        "description": "Early blight is caused by the fungus Alternaria solani. It produces target-like spots on older leaves.",
        "treatment": "Apply fungicides like Chlorothalonil or copper-based sprays. Remove infected lower leaves.",
        "prevention": "Keep foliage dry. Space plants for good airflow. Mulch around the base.",
        "severity": "High"
    },
    2: {
        "name": "Tomato - Healthy and Fresh",
        "description": "The plant appears healthy with no visible signs of disease or pest infestation.",
        "treatment": "Continue regular maintenance, watering, and nutrient application.",
        "prevention": "Maintain good hygiene and monitor regularly for early signs of issues.",
        "severity": "Low"
    },
    3: {
        "name": "Tomato - Late Blight Disease",
        "description": "Late blight is a serious disease caused by Phytophthora infestans. It can rapidly destroy entire crops.",
        "treatment": "Immediate application of specialized fungicides. Remove and destroy infected plants immediately.",
        "prevention": "Plant resistant varieties. Avoid planting near potatoes. Ensure good drainage.",
        "severity": "Critical"
    },
    4: {
        "name": "Tomato - Leaf Mold Disease",
        "description": "Leaf mold is caused by Passalora fulva. It typically develops in high humidity environments.",
        "treatment": "Improve greenhouse ventilation. Use fungicides if infestation is severe.",
        "prevention": "Reduce humidity. Prune for better airflow. Use resistant cultivars.",
        "severity": "Medium"
    },
    5: {
        "name": "Tomato - Septoria Leaf Spot Disease",
        "description": "Septoria leaf spot is caused by Septoria lycopersici. Small, circular spots with gray centers appear on leaves.",
        "treatment": "Apply fungicides containing copper or chlorothalonil. Remove affected leaves.",
        "prevention": "Avoid overhead watering. Rotate crops. Keep the garden free of weeds.",
        "severity": "Medium"
    },
    6: {
        "name": "Tomato - Target Spot Disease",
        "description": "Target spot is caused by Corynespora cassiicola. It shows as circular brown spots with concentric rings.",
        "treatment": "Spray with fungicides such as azoxystrobin or chlorothalonil.",
        "prevention": "Improve airflow. Avoid excessively long periods of leaf wetness.",
        "severity": "Medium"
    },
    7: {
        "name": "Tomato - Tomato Yellow Leaf Curl Virus Disease",
        "description": "TYLCV is a viral disease transmitted by silverleaf whiteflies. It causes yellowing and upward curling of leaves.",
        "treatment": "Primarily involves controlling the whitefly population. No cure for existing virus.",
        "prevention": "Use insect-proof netting. Plant resistant varieties. Control weeds.",
        "severity": "High"
    },
    8: {
        "name": "Tomato - Tomato Mosaic Virus Disease",
        "description": "ToMV causes mottling and discoloration of leaves, often in a mosaic pattern.",
        "treatment": "No cure. Remove and destroy infected plants to prevent spread.",
        "prevention": "Sanitize tools. Avoid touching plants after using tobacco. Control weeds.",
        "severity": "High"
    },
    9: {
        "name": "Tomato - Two Spotted Spider Mite Disease",
        "description": "Spider mites are tiny pests that suck juices from leaves, causing yellow stippling and webbing.",
        "treatment": "Use insecticidal soap or neem oil. Introduce natural predators like ladybugs.",
        "prevention": "Keep plants well-hydrated. Mist leaves in hot, dry weather to discourage mites.",
        "severity": "Medium"
    }
}

def get_prediction(image_path):
    test_image = load_img(image_path, target_size=(128, 128))
    test_image = img_to_array(test_image)/255.0
    test_image = np.expand_dims(test_image, axis=0)
    
    predictions = model.predict(test_image)[0]
    
    # Get top prediction only
    top_idx = np.argmax(predictions)
    confidence = float(predictions[top_idx])
    info = DISEASE_INFO.get(top_idx, {})
    
    return {
        "id": int(top_idx),
        "name": info.get("name", "Unknown"),
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

@app.route("/api/predict", methods=['POST'])
def api_predict():
    if 'image' not in request.files:
        return jsonify({"error": "No image uploaded"}), 400
    
    file = request.files['image']
    lang = request.form.get('language', 'en')
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    filename = file.filename
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(file_path)
    
    try:
        result = get_prediction(file_path)
        
        # Translate result if needed
        if lang != 'en':
            result['name'] = translate_text(result['name'], lang)
            result['description'] = translate_text(result['description'], lang)
            result['treatment'] = translate_text(result['treatment'], lang)
            result['prevention'] = translate_text(result['prevention'], lang)
            result['severity'] = translate_text(result['severity'], lang)

        return jsonify({
            "status": "success",
            "prediction": result,
            "imageUrl": f"/static/upload/{filename}"
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/chatbot", methods=['POST'])
def chatbot():
    try:
        data = request.json
        if not data:
            return jsonify({"response": "I didn't receive any data. Could you try typing your message again?"}), 400
            
        user_message = data.get("message", "").strip()
        prediction = data.get("prediction") 
        lang = data.get("language", 'en')
        
        context_name = "Unknown Condition"
        if prediction and isinstance(prediction, dict):
            context_name = prediction.get("name", "Unknown Condition")
        
        msg_lower = user_message.lower()
        
        # Domain Restriction: Only respond to plant-related queries
        plant_keywords = ["leaf", "plant", "grow", "water", "soil", "treatment", "cure", "help", "disease", "spot", "yellow", "white", "pest", "insect", "organic", "prevent"]
        is_plant_related = any(word in msg_lower for word in plant_keywords) or prediction
        
        if not user_message and prediction:
            # Auto-response triggered after ML prediction
            response = f"### Diagnostic Results: {context_name}\n\n"
            response += f"**Cause:** Environmental stress or pathogen infection specific to {context_name.split('-')[0].strip()} crops.\n\n"
            response += "**Organic Treatment Steps:**\n"
            response += f"1. {prediction.get('treatment', 'Apply neem oil or insecticidal soap.')}\n"
            response += "2. Prune infected leaves to prevent spatial spread.\n\n"
            response += "**Preventive Measures:**\n"
            response += f"- {prediction.get('prevention', 'Ensure balanced soil nutrition.')}\n"
            response += "- Maintain consistent watering schedules early in the morning.\n\n"
            response += "**Extra Care Tips:**\n"
            response += "- Sterilize garden tools after each use.\n- Monitor neighboring plants for similar symptoms."
            
        elif not is_plant_related and user_message:
            response = "I'm specialized in plant health and disease analysis. Please ask me about plant care, organic treatments, or disease prevention!"
            
        else:
            # Natural Language Logic (Heuristic Engine)
            if "yellow" in msg_lower or "spot" in msg_lower:
                response = f"**Observation:** Identified potential Nitrogen deficiency or Bacterial Spot.\n\n"
                response += "**Cause:** Excessive moisture on foliage or nutrient imbalance.\n\n"
                response += "**Organic Treatment:** Apply a copper-based organic fungicide or a 1:1 mixture of water and apple cider vinegar.\n\n"
                response += "**Prevention:** Improve soil drainage and avoid overhead irrigation."
                
            elif "white" in msg_lower or "mildew" in msg_lower:
                response = "**Diagnosis:** High likelihood of Powdery Mildew.\n\n"
                response += "**Cause:** High humidity and poor air circulation.\n\n"
                response += "**Organic Treatment:** Spray a solution of 1 part milk to 9 parts water. The protein in milk creates a natural antiseptic effect under sunlight.\n\n"
                response += "**Prevention:** Thin out dense foliage to improve airflow and plant in sunny locations."
                
            elif "pest" in msg_lower or "bug" in msg_lower or "insect" in msg_lower:
                response = "**Strategy:** Organic Pest Management.\n\n"
                response += "**Organic Treatment:** Use a strong stream of water to dislodge pests, followed by an application of 2% Neem Oil solution twice a week.\n\n"
                response += "**Prevention:** Introduce beneficial insects like ladybugs and lacewings to your garden ecosystem."
                
            else:
                response = f"Regarding your input: '{user_message}'\n\n"
                if prediction:
                    response += f"For the detected **{context_name}**, I recommend immediate pruning followed by the specialized treatment: {prediction.get('treatment')}."
                else:
                    response = "I understand you're concerned about your plant. Could you specify if you see any color changes (yellowing, browning) or unusual textures (spots, mold)? This will help me provide a precise organic remedy."

        # Final translation of response
        if lang != 'en' and response:
            try:
                # Use a larger timeout or chunking if response is very long, 
                # but deep-translator handles up to 5000 chars.
                response = translate_text(response, lang)
            except:
                pass

        return jsonify({"response": response})
        
    except Exception as e:
        print(f"Chatbot Error: {str(e)}")
        return jsonify({"response": "I encountered an internal processing error. Please try asking again in a moment."}), 500

if __name__ == "__main__":
    app.run(threaded=False, port=8080, debug=True)
    
    
