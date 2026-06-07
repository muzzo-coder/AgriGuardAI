# Import necessary libraries
from flask import Flask, request, jsonify
import numpy as np
import os
import time
import hashlib
from tensorflow.keras.preprocessing.image import load_img, img_to_array
from tensorflow.keras.models import load_model
from tensorflow.keras.applications.efficientnet import preprocess_input
from flask_cors import CORS
from deep_translator import GoogleTranslator
import json
from dotenv import load_dotenv

from google import genai
from google.genai import types
# Force rebuild of FAISS index on startup
if os.path.exists('faiss_index.bin'):
    try:
        os.remove('faiss_index.bin')
        print("Deleted existing faiss_index.bin to force rebuild on startup.")
    except Exception as e:
        print(f"Error removing faiss_index.bin: {e}")

from rag_engine import rag_engine

from quality_filter import check_image_quality

# Initialize Flask app
app = Flask(__name__)
CORS(app)

response_cache = {}

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai_client = genai.Client(api_key=GEMINI_API_KEY)
else:
    print("WARNING: GEMINI_API_KEY not found. Fallback logic will be limited.")
    genai_client = None

def translate_text(text, target_lang='en'):
    if not text or target_lang == 'en':
        return text
    try:
        return GoogleTranslator(source='auto', target=target_lang).translate(text)
    except Exception as e:
        print(f"Translation Error: {str(e)}")
        return text

# Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BINARY_MODEL_PATH = os.path.join(BASE_DIR, 'model_binary.h5')
DISEASE_MODEL_PATH = os.path.join(BASE_DIR, 'model_disease.h5')
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'static/upload')

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Load Multi-Stage Models
print("Loading Intelligent Pipeline Models...")
try:
    binary_model = load_model(BINARY_MODEL_PATH)
    disease_model = load_model(DISEASE_MODEL_PATH)
    print("Multi-Stage Models Loaded Successfully.")
except Exception as e:
    print(f"Error loading models: {e}")
    binary_model, disease_model = None, None

try:
    from generated_disease_info_v2 import DISEASE_INFO
except ImportError:
    DISEASE_INFO = {}

if not DISEASE_INFO:
    print("generated_disease_info_v2 not found. Generating DISEASE_INFO dynamically...")
    classes_path = os.path.join(BASE_DIR, 'classes_disease.json')
    knowledge_path = os.path.join(BASE_DIR, 'agricultural_knowledge.json')
    
    if os.path.exists(classes_path):
        try:
            with open(classes_path, 'r') as f:
                classes = json.load(f)
                
            knowledge = []
            if os.path.exists(knowledge_path):
                with open(knowledge_path, 'r') as f:
                    knowledge = json.load(f)
                    
            def normalize(name):
                return "".join(c.lower() for c in name if c.isalnum())
                
            for name, idx in classes.items():
                display_name = name.replace('_', ' ')
                matched_item = None
                norm_name = normalize(name)
                
                for item in knowledge:
                    k_disease = item.get('disease', '')
                    if k_disease:
                        norm_k = normalize(k_disease)
                        if norm_name == norm_k or norm_k in norm_name or norm_name in norm_k:
                            matched_item = item
                            break
                        if "bacterial" in norm_name and "bacteria" in norm_k:
                            matched_item = item
                            break
                        if "spidermite" in norm_name and "spidermite" in norm_k:
                            matched_item = item
                            break
                            
                if matched_item:
                    DISEASE_INFO[int(idx)] = {
                        "name": matched_item.get("disease", display_name),
                        "description": matched_item.get("symptoms", "No description available."),
                        "treatment": matched_item.get("treatment", "Consult local extension offices for certified treatments."),
                        "prevention": matched_item.get("prevention", "Maintain general crop hygiene and monitor regularly."),
                        "causes": matched_item.get("causes", "Unknown pathogen.")
                    }
                else:
                    DISEASE_INFO[int(idx)] = {
                        "name": display_name,
                        "description": f"Symptoms of {display_name} on plant foliage.",
                        "treatment": "Apply appropriate organic or chemical fungicides/bactericides. Remove infected foliage.",
                        "prevention": "Ensure good crop rotation, proper spacing, and avoid overhead watering.",
                        "causes": f"Infection by {display_name} pathogen."
                    }
            print(f"Dynamically loaded {len(DISEASE_INFO)} disease classes into DISEASE_INFO.")
        except Exception as ex:
            print(f"Error loading disease info dynamically: {ex}")

def get_multi_stage_prediction(image_path):
    """
    Executes the multi-stage pipeline:
    1. Binary Check
    2. Disease Classification (if diseased)
    """
    test_image = load_img(image_path, target_size=(224, 224))
    test_image = img_to_array(test_image)
    test_image = preprocess_input(test_image)
    test_image = np.expand_dims(test_image, axis=0)
    
    # Stage 2: Binary Healthy vs Diseased
    binary_pred = binary_model.predict(test_image)[0][0]
    # class mode binary sorted alphabetically: diseased (0), healthy (1)
    if binary_pred > 0.5:
        return {"stage": "binary", "diagnosis": "Healthy", "confidence": float(binary_pred)}
        
    # Stage 3: Pure Disease Classification
    disease_preds = disease_model.predict(test_image)[0]
    
    # Stage 4: Confidence Calibration (Top-3 Sorting)
    top_3_indices = np.argsort(disease_preds)[::-1][:3]
    top_3_results = []
    
    for idx in top_3_indices:
        # Avoid index out of bounds if info mapping changed
        if idx in DISEASE_INFO:
            top_3_results.append({
                "id": int(idx),
                "name": DISEASE_INFO[idx].get("name", "Unknown"),
                "confidence": float(disease_preds[idx]),
                "info": DISEASE_INFO[idx]
            })
    
    return {"stage": "disease", "top_3": top_3_results}

def get_symptom_prediction(user_symptoms):
    """
    Computes semantic similarity between user's symptom description
    and the symptoms/causes of all known disease classes.
    Returns ranked list of (idx, name, confidence, info).
    """
    if not user_symptoms or not rag_engine:
        return []
        
    # Encode user symptoms
    user_emb = rag_engine.model.encode([user_symptoms])[0]
    
    ranked_results = []
    for idx, info in DISEASE_INFO.items():
        # Build a rich textual description of the disease symptoms & causes to compare against
        disease_text = f"Disease: {info['name']}. Symptoms: {info['description']}. Causes: {info.get('causes', '')}"
        disease_emb = rag_engine.model.encode([disease_text])[0]
        
        # Calculate Cosine Similarity
        cos_sim = np.dot(user_emb, disease_emb) / (np.linalg.norm(user_emb) * np.linalg.norm(disease_emb))
        
        # Calibrate similarity to a realistic confidence score [10%, 99%]
        # Cosine similarity for matching texts usually ranges from 0.2 to 0.8.
        calibrated_conf = min(0.99, max(0.10, (float(cos_sim) - 0.15) / 0.65))
        
        ranked_results.append({
            "id": int(idx),
            "name": info["name"],
            "confidence": calibrated_conf,
            "info": info
        })
        
    # Sort by confidence descending
    ranked_results = sorted(ranked_results, key=lambda x: x["confidence"], reverse=True)
    return ranked_results

@app.route("/api/diagnose", methods=['POST'])
def diagnose():
    start_time = time.time()
    try:
        image_file = request.files.get('image')
        description = request.form.get('description', '').strip()
        lang = request.form.get('language', 'en')
        
        # Mode check
        if not image_file and not description:
            return jsonify({"error": "Please provide either a leaf image or a description of plant symptoms."}), 400

        # Mode 2: Symptom-Only Diagnosis (RAG Semantic Matcher)
        if not image_file:
            print(f"Running Standalone Symptom Diagnosis for symptoms: '{description}'...")
            text_results = get_symptom_prediction(description)
            if not text_results:
                return jsonify({"error": "Symptom matching failed."}), 500
                
            top_1 = text_results[0]
            
            # If top match confidence is high, return it directly
            if top_1["confidence"] >= 0.70:
                final_diagnosis = {
                    "disease": top_1["name"],
                    "confidence": f"{top_1['confidence']*100:.0f}%",
                    "cause": top_1["info"].get("description", ""),
                    "treatment": top_1["info"].get("treatment", ""),
                    "prevention": top_1["info"].get("prevention", "")
                }
                return generate_final_response(final_diagnosis, lang, None, None, text_results[:3], "symptoms")
                
            # If confidence is low, run LLM decision with RAG context
            retrieved_context = rag_engine.retrieve_context(description, k=2)
            top_3_str = ", ".join([f"{p['name']} ({p['confidence']*100:.0f}%)" for p in text_results[:3]])
            
            system_prompt = (
                "You are an expert plant pathologist AI. The symptom matcher is uncertain. "
                "You MUST output exactly ONE definitive disease diagnosis from the options. Do not output a list of probabilities. "
                "If you cannot decide, pick the most likely one based on symptoms."
            )
            prompt = f"""
            {system_prompt}
            
            Top-3 Semantic Matches: {top_3_str}
            User Symptoms: {description}
            Knowledge Base: {retrieved_context}
            
            OUTPUT FORMAT (STRICT JSON):
            {{
              "disease": "Definitive Disease Name",
              "confidence": "Estimation (e.g., 65%)",
              "cause": "Specific cause description",
              "treatment": "Direct treatment steps",
              "prevention": "Prevention measures"
            }}
            """
            
            print("Calling LLM for Symptom-Only Decision...")
            try:
                import concurrent.futures
                
                def call_llm():
                    return genai_client.models.generate_content(
                        model='gemini-1.5-flash',
                        contents=prompt
                    )
                
                with concurrent.futures.ThreadPoolExecutor() as executor:
                    future = executor.submit(call_llm)
                    response = future.result(timeout=8)
                    
                print("LLM generated response successfully.")
                result_text = response.text.replace("```json", "").replace("```", "").strip()
                final_diagnosis = json.loads(result_text)
            except Exception as e:
                print(f"LLM Error during text diagnosis: {e}. Falling back to top matcher.")
                final_diagnosis = {
                    "disease": top_1["name"],
                    "confidence": f"{top_1['confidence']*100:.0f}%",
                    "cause": top_1["info"].get("description", ""),
                    "treatment": top_1["info"].get("treatment", ""),
                    "prevention": top_1["info"].get("prevention", "")
                }
                
            return generate_final_response(final_diagnosis, lang, None, None, text_results[:3], "symptoms")

        # Handle Image-based Requests (Mode 1 and Mode 3)
        filename = image_file.filename
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        image_file.save(file_path)
        image_url = f"/static/upload/{filename}"
        
        # Stage 1: Leaf Quality Filter
        is_good, quality_reason = check_image_quality(file_path)
        if not is_good:
            return jsonify({"error": quality_reason}), 400

        # Execute Pipeline with Automatic Disease Region Detection and Auto-Zoom
        from disease_detector import detect_disease_region

        detection_res = detect_disease_region(file_path, UPLOAD_FOLDER)
        
        prediction_result = None
        used_crop = False
        full_conf = 0.0
        crop_conf = 0.0
        
        # 1. Run prediction on full image
        full_pred_res = get_multi_stage_prediction(file_path)
        if full_pred_res["stage"] == "binary" and full_pred_res["diagnosis"] == "Healthy":
            full_conf = full_pred_res["confidence"]
        else:
            full_conf = full_pred_res["top_3"][0]["confidence"]
            
        # 2. Run prediction on cropped image (if disease region detected)
        if detection_res:
            crop_path = detection_res["croppedPath"]
            crop_pred_res = get_multi_stage_prediction(crop_path)
            
            if crop_pred_res["stage"] == "binary" and crop_pred_res["diagnosis"] == "Healthy":
                crop_conf = crop_pred_res["confidence"]
            else:
                crop_conf = crop_pred_res["top_3"][0]["confidence"]
                
            # Use the prediction with the higher confidence score
            if crop_conf > full_conf:
                prediction_result = crop_pred_res
                used_crop = True
            else:
                prediction_result = full_pred_res
                used_crop = False
        else:
            prediction_result = full_pred_res
            used_crop = False

        # Build visual analysis metadata
        detection_meta = {
            "diseaseAreaDetected": bool(detection_res),
            "usedCrop": used_crop,
            "originalUrl": image_url,
            "fullImageConfidence": f"{full_conf * 100:.0f}%",
            "cropConfidence": f"{crop_conf * 100:.0f}%" if detection_res else "N/A",
            "boxCoordinates": detection_res["boxCoordinates"] if detection_res else None,
            "highlightedUrl": detection_res["highlightedUrl"] if detection_res else None,
            "croppedUrl": detection_res["croppedUrl"] if detection_res else None,
        }

        # Initialize prediction variables
        final_diagnosis = None
        top3_diff = None
        mode = "image"
        
        # Determine image details
        img_is_healthy = (prediction_result["stage"] == "binary" and prediction_result["diagnosis"] == "Healthy")
        img_class = "Healthy Plant" if img_is_healthy else prediction_result["top_3"][0]["name"]
        img_conf = prediction_result["confidence"] if img_is_healthy else prediction_result["top_3"][0]["confidence"]
        
        # If symptoms description is present -> Mode 3: Image + Symptoms Fusion
        if description:
            mode = "hybrid"
            print(f"Running Hybrid Image + Symptom Fusion. Description: '{description}'...")
            text_results = get_symptom_prediction(description)
            top3_diff = text_results[:3]
            
            if text_results:
                text_top = text_results[0]
                text_class = text_top["name"]
                text_conf = text_top["confidence"]
                
                # Add multimodal fusion details for premium frontend rendering
                detection_meta["fusionDetails"] = {
                    "imgClass": img_class,
                    "imgConfidence": f"{img_conf * 100:.0f}%",
                    "textClass": text_class,
                    "textConfidence": f"{text_conf * 100:.0f}%",
                    "agreement": bool(img_class == text_class),
                    "preferred": "image" if (img_class == text_class or img_conf >= text_conf) else "text"
                }
                
                # Fusion logic:
                if img_class == text_class:
                    # Agree: Fuse confidences (60% weight to Image, 40% weight to Text)
                    fused_conf = 0.6 * img_conf + 0.4 * text_conf
                    print(f"CNN and RAG agree on {img_class}. Fusing confidence: {img_conf:.2f} & {text_conf:.2f} -> {fused_conf:.2f}")
                    
                    if img_is_healthy:
                        final_diagnosis = {
                            "disease": "Healthy Plant",
                            "confidence": f"{fused_conf*100:.0f}%",
                            "cause": "No disease detected. Plant appears healthy.",
                            "treatment": "No treatment required. Continue regular maintenance.",
                            "prevention": "Maintain good hygiene and monitor regularly."
                        }
                    else:
                        info = prediction_result["top_3"][0]["info"]
                        final_diagnosis = {
                            "disease": img_class,
                            "confidence": f"{fused_conf*100:.0f}%",
                            "cause": info.get("description", ""),
                            "treatment": info.get("treatment", ""),
                            "prevention": info.get("prevention", "")
                        }
                else:
                    # Disagree: Choose the higher confidence
                    print(f"CNN ({img_class}: {img_conf:.2f}) and RAG ({text_class}: {text_conf:.2f}) disagree.")
                    if text_conf > img_conf:
                        print("Selecting RAG text-based prediction (higher confidence).")
                        final_diagnosis = {
                            "disease": text_class,
                            "confidence": f"{text_conf*100:.0f}%",
                            "cause": text_top["info"].get("description", ""),
                            "treatment": text_top["info"].get("treatment", ""),
                            "prevention": text_top["info"].get("prevention", "")
                        }
                    else:
                        print("Selecting CNN image-based prediction (higher confidence).")
                        if img_is_healthy:
                            final_diagnosis = {
                                "disease": "Healthy Plant",
                                "confidence": f"{img_conf*100:.0f}%",
                                "cause": "No disease detected. Plant appears healthy.",
                                "treatment": "No treatment required. Continue regular maintenance.",
                                "prevention": "Maintain good hygiene and monitor regularly."
                            }
                        else:
                            info = prediction_result["top_3"][0]["info"]
                            final_diagnosis = {
                                "disease": img_class,
                                "confidence": f"{img_conf*100:.0f}%",
                                "cause": info.get("description", ""),
                                "treatment": info.get("treatment", ""),
                                "prevention": info.get("prevention", "")
                            }
                            
        # Mode 1: Image Only (no description provided)
        else:
            mode = "image"
            if img_is_healthy:
                final_diagnosis = {
                    "disease": "Healthy Plant",
                    "confidence": f"{img_conf*100:.0f}%",
                    "cause": "No disease detected. Plant appears healthy.",
                    "treatment": "No treatment required. Continue regular maintenance.",
                    "prevention": "Maintain good hygiene and monitor regularly."
                }
            else:
                # If very confident, return directly
                top_1 = prediction_result["top_3"][0]
                if top_1["confidence"] >= 0.70:
                    final_diagnosis = {
                        "disease": top_1["name"],
                        "confidence": f"{top_1['confidence']*100:.0f}%",
                        "cause": top_1["info"].get("description", ""),
                        "treatment": top_1["info"].get("treatment", ""),
                        "prevention": top_1["info"].get("prevention", "")
                    }
                else:
                    # Run LLM Decision Strategy for Image-only low confidence
                    query_for_rag = f"{top_1['name']} or {prediction_result['top_3'][1]['name']}"
                    retrieved_context = rag_engine.retrieve_context(query_for_rag, k=2)
                    top_3_str = ", ".join([f"{p['name']} ({p['confidence']*100:.0f}%)" for p in prediction_result["top_3"]])
                    
                    system_prompt = (
                        "You are an expert plant pathologist AI. The image CNN is uncertain. "
                        "You MUST output exactly ONE definitive disease diagnosis from the options. Do not output a list of probabilities. "
                        "If you cannot decide, pick the most likely one based on symptoms."
                    )
                    prompt = f"""
                    {system_prompt}
                    
                    CNN Top-3 Guesses: {top_3_str}
                    User Symptoms: None provided
                    Knowledge Base: {retrieved_context}
                    
                    OUTPUT FORMAT (STRICT JSON):
                    {{
                      "disease": "Definitive Disease Name",
                      "confidence": "Estimation (e.g., 65%)",
                      "cause": "Specific cause description",
                      "treatment": "Direct treatment steps",
                      "prevention": "Prevention measures"
                    }}
                    """
                    
                    print("Calling LLM for Image-Only Decision...")
                    try:
                        import concurrent.futures
                        
                        def call_llm():
                            return genai_client.models.generate_content(
                                model='gemini-1.5-flash',
                                contents=prompt
                            )
                        
                        with concurrent.futures.ThreadPoolExecutor() as executor:
                            future = executor.submit(call_llm)
                            response = future.result(timeout=8)
                            
                        print("LLM generated response successfully.")
                        result_text = response.text.replace("```json", "").replace("```", "").strip()
                        final_diagnosis = json.loads(result_text)
                    except Exception as e:
                        print(f"LLM Error: {e}. Falling back to top CNN prediction.")
                        final_diagnosis = {
                            "disease": top_1["name"],
                            "confidence": f"{top_1['confidence']*100:.0f}%",
                            "cause": top_1["info"].get("description", ""),
                            "treatment": top_1["info"].get("treatment", ""),
                            "prevention": top_1["info"].get("prevention", "")
                        }
                        
        return generate_final_response(final_diagnosis, lang, image_url, detection_meta, top3_diff, mode)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Diagnosis failed: {str(e)}"}), 500

def translate_value(val, lang):
    if not val or lang == 'en':
        return val
    if isinstance(val, str):
        return translate_text(val, lang)
    elif isinstance(val, list):
        return [translate_value(item, lang) for item in val]
    elif isinstance(val, dict):
        return {k: translate_value(v, lang) for k, v in val.items()}
    return val

def generate_final_response(final_diagnosis, lang, image_url, detection_meta=None, top3_diff=None, mode="image"):
    # Lookup scientific metadata
    disease_name = final_diagnosis.get("disease", "")
    rag_meta = rag_engine.retrieve_metadata(disease_name)
    
    if rag_meta:
        final_diagnosis["scientific_name"] = rag_meta.get("scientific_name", "")
        final_diagnosis["fungicides"] = rag_meta.get("fungicides", [])
        final_diagnosis["pesticides"] = rag_meta.get("pesticides", [])
        final_diagnosis["recovery_timeline"] = rag_meta.get("recovery_timeline", "")
        final_diagnosis["reference_sources"] = rag_meta.get("reference_sources", "")
        
        # Override cause, treatment, prevention with RAG database content
        if rag_meta.get("causes"):
            final_diagnosis["cause"] = rag_meta.get("causes")
        if rag_meta.get("treatment"):
            final_diagnosis["treatment"] = rag_meta.get("treatment")
        if rag_meta.get("prevention"):
            final_diagnosis["prevention"] = rag_meta.get("prevention")

    # Determine dynamic severity based on confidence
    conf_str = final_diagnosis.get("confidence", "50%")
    import re
    digits = re.findall(r'\d+', str(conf_str))
    conf_val = float(digits[0]) / 100.0 if digits else 0.5
    
    if conf_val < 0.50:
        severity = "Low"
        severity_action = "Low severity. Monitor the plant closely and implement preventive cultural practices."
    elif conf_val < 0.75:
        severity = "Medium"
        severity_action = "Medium severity. Implement early treatment protocols and physical removal of infected leaves."
    elif conf_val < 0.90:
        severity = "High"
        severity_action = "High severity. Active pathogen spread. Initiate target chemical treatments and isolate infected crops."
    else:
        severity = "Critical"
        severity_action = "Critical severity. Severe infestation. Immediate physical quarantine, destroy heavily infected plants, and apply systemic crop protection."

    final_diagnosis["severity"] = severity
    final_diagnosis["severity_action"] = severity_action

    # Translate final_diagnosis if lang != 'en'
    translated_diagnosis = {}
    if lang != 'en':
        for key, val in final_diagnosis.items():
            if key == 'confidence':
                translated_diagnosis[key] = val
            elif key == 'scientific_name':
                # Don't translate scientific botanical name
                translated_diagnosis[key] = val
            else:
                translated_diagnosis[key] = translate_value(val, lang)
        
        # Translate fusion details if present
        if detection_meta and "fusionDetails" in detection_meta:
            fd = detection_meta["fusionDetails"]
            if fd.get("imgClass"):
                fd["imgClass"] = translate_text(fd["imgClass"], lang)
            if fd.get("textClass"):
                fd["textClass"] = translate_text(fd["textClass"], lang)
    else:
        translated_diagnosis = final_diagnosis.copy()
    
    prediction_shim = {
        "name": translated_diagnosis.get("disease"),
        "scientific_name": translated_diagnosis.get("scientific_name", ""),
        "severity": translated_diagnosis.get("severity", "Medium"),
        "severity_action": translated_diagnosis.get("severity_action", ""),
        "description": translated_diagnosis.get("cause"),
        "treatment": translated_diagnosis.get("treatment"),
        "prevention": translated_diagnosis.get("prevention"),
        "fungicides": translated_diagnosis.get("fungicides", []),
        "pesticides": translated_diagnosis.get("pesticides", []),
        "recovery_timeline": translated_diagnosis.get("recovery_timeline", ""),
        "reference_sources": translated_diagnosis.get("reference_sources", "")
    }
    
    res = {
        "status": "success",
        "diagnosis": translated_diagnosis,
        "prediction": prediction_shim,
        "imageUrl": image_url,
        "mode": mode
    }
    if detection_meta:
        res.update(detection_meta)
        
    if top3_diff:
        translated_diff = []
        for d in top3_diff:
            name = d["name"]
            if lang != 'en':
                name = translate_text(name, lang)
            conf_val = d['confidence']
            conf_str = f"{conf_val * 100:.0f}%" if isinstance(conf_val, float) else str(conf_val)
            translated_diff.append({
                "name": name,
                "confidence": conf_str
            })
        res["top3Differential"] = translated_diff
        
    return jsonify(res)

@app.route("/api/translate", methods=['POST'])
def translate():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        texts = data.get('texts')
        target = data.get('target', 'en')
        
        if not texts:
            return jsonify({"error": "No texts provided"}), 400
            
        if isinstance(texts, dict):
            translated = {}
            for k, v in texts.items():
                if k != 'confidence':
                    translated[k] = translate_text(v, target)
                else:
                    translated[k] = v
        elif isinstance(texts, list):
            translated = [translate_text(t, target) for t in texts]
        else:
            translated = translate_text(texts, target)
            
        return jsonify({
            "status": "success",
            "translated": translated
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def generate_single_report_pdf(data):
    from io import BytesIO
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    import time
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    
    styles = getSampleStyleSheet()
    
    primary_color = colors.HexColor("#0f766e")  # Teal 700
    text_color = colors.HexColor("#1f2937")     # Gray 800
    bg_light = colors.HexColor("#f3f4f6")       # Gray 100
    border_color = colors.HexColor("#e5e7eb")   # Gray 200
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=primary_color,
        spaceAfter=15
    )
    
    h2_style = ParagraphStyle(
        'H2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=primary_color,
        spaceBefore=12,
        spaceAfter=6
    )
    
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=text_color,
        spaceAfter=8
    )
    
    meta_style = ParagraphStyle(
        'Meta',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#4b5563")
    )
    
    story = []
    
    story.append(Paragraph("AgriGuard AI — Case Diagnosis Report", title_style))
    story.append(Table([[""]], colWidths=[532], rowHeights=[2], style=TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), primary_color),
        ('PADDING', (0,0), (-1,-1), 0),
    ])))
    story.append(Spacer(1, 15))
    
    diagnosis = data.get('diagnosis', {})
    disease_name = diagnosis.get('disease', 'Unknown Specimen')
    confidence = diagnosis.get('confidence', 'N/A')
    cause = diagnosis.get('cause', 'N/A')
    treatment = diagnosis.get('treatment', 'N/A')
    prevention = diagnosis.get('prevention', 'N/A')
    image_url = data.get('imageUrl', '')
    scientific_name = diagnosis.get('scientific_name', '')
    
    disease_name_with_sci = f"{disease_name} (<i>{scientific_name}</i>)" if scientific_name else disease_name

    date_str = time.strftime("%Y-%m-%d %H:%M:%S")
    report_id = f"AGR-{int(time.time())}"
    
    meta_data = [
        [Paragraph(f"<b>Date Generated:</b> {date_str}", meta_style), Paragraph(f"<b>Report ID:</b> {report_id}", meta_style)],
        [Paragraph(f"<b>Specimen Diagnosis:</b> {disease_name_with_sci}", meta_style), Paragraph(f"<b>System Confidence:</b> {confidence}", meta_style)]
    ]
    meta_table = Table(meta_data, colWidths=[266, 266])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), bg_light),
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('PADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 15))
    
    image_element = None
    if image_url:
        local_path = os.path.join(BASE_DIR, image_url.lstrip('/'))
        if os.path.exists(local_path):
            try:
                image_element = Image(local_path, width=240, height=180)
            except Exception as e:
                print(f"Error loading image {local_path}: {e}")
                
    if image_element:
        right_p = [
            Paragraph("DIAGNOSTIC INSIGHTS", h2_style),
            Paragraph(f"<b>Diagnosis:</b> {disease_name_with_sci}", ParagraphStyle('Diag', parent=body_style, fontSize=12, leading=15, textColor=primary_color, fontName='Helvetica-Bold')),
            Spacer(1, 8),
            Paragraph("<b>Symptom & Cause Analysis:</b>", ParagraphStyle('BoldText', parent=body_style, fontName='Helvetica-Bold')),
            Paragraph(cause, body_style)
        ]
        main_table = Table([[image_element, right_p]], colWidths=[240, 292])
        main_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('PADDING', (0,0), (-1,-1), 0),
        ]))
        story.append(main_table)
    else:
        story.append(Paragraph("DIAGNOSTIC INSIGHTS", h2_style))
        story.append(Paragraph(f"<b>Diagnosis:</b> {disease_name_with_sci}", ParagraphStyle('Diag', parent=body_style, fontSize=12, leading=15, textColor=primary_color, fontName='Helvetica-Bold')))
        story.append(Spacer(1, 8))
        story.append(Paragraph("<b>Symptom & Cause Analysis:</b>", ParagraphStyle('BoldText', parent=body_style, fontName='Helvetica-Bold')))
        story.append(Paragraph(cause, body_style))
        
    story.append(Spacer(1, 15))
    
    story.append(Paragraph("RECOVERY & SHIELD PROTOCOLS", h2_style))
    story.append(Table([[
        Paragraph("<b>Recovery Treatment Steps:</b>", ParagraphStyle('Sub', parent=body_style, fontName='Helvetica-Bold')),
        Paragraph("<b>Prevention Shield Measures:</b>", ParagraphStyle('Sub', parent=body_style, fontName='Helvetica-Bold'))
    ]], colWidths=[260, 260], style=TableStyle([('PADDING', (0,0), (-1,-1), 0)])))
    story.append(Spacer(1, 4))
    
    proto_table = Table([[
        Paragraph(treatment, body_style),
        Paragraph(prevention, body_style)
    ]], colWidths=[250, 250])
    proto_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,0), colors.HexColor("#f0fdf4")),
        ('BACKGROUND', (1,0), (1,0), colors.HexColor("#f8fafc")),
        ('BOX', (0,0), (0,0), 1, colors.HexColor("#bbf7d0")),
        ('BOX', (1,0), (1,0), 1, colors.HexColor("#e2e8f0")),
        ('PADDING', (0,0), (-1,-1), 10),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(proto_table)
    
    # Recommended chemical protocols
    fungicides = diagnosis.get('fungicides', [])
    pesticides = diagnosis.get('pesticides', [])
    recovery_timeline = diagnosis.get('recovery_timeline', '')
    reference_sources = diagnosis.get('reference_sources', '')
    
    if fungicides or pesticides or recovery_timeline:
        story.append(Spacer(1, 15))
        story.append(Paragraph("SCIENTIFIC CHEMICAL ACTION PROTOCOLS", h2_style))
        if recovery_timeline:
            story.append(Paragraph(f"<b>Expected Recovery Timeline:</b> {recovery_timeline}", body_style))
            story.append(Spacer(1, 5))
            
        chemical_rows = []
        chemical_rows.append([
            Paragraph("<b>Category</b>", ParagraphStyle('ChemH', parent=body_style, fontName='Helvetica-Bold', fontSize=8.5)),
            Paragraph("<b>Chemical Name</b>", ParagraphStyle('ChemH', parent=body_style, fontName='Helvetica-Bold', fontSize=8.5)),
            Paragraph("<b>Active Ingredient</b>", ParagraphStyle('ChemH', parent=body_style, fontName='Helvetica-Bold', fontSize=8.5)),
            Paragraph("<b>Mode of Action</b>", ParagraphStyle('ChemH', parent=body_style, fontName='Helvetica-Bold', fontSize=8.5)),
            Paragraph("<b>Dosage</b>", ParagraphStyle('ChemH', parent=body_style, fontName='Helvetica-Bold', fontSize=8.5)),
            Paragraph("<b>Frequency</b>", ParagraphStyle('ChemH', parent=body_style, fontName='Helvetica-Bold', fontSize=8.5))
        ])
        
        for f in fungicides:
            chemical_rows.append([
                Paragraph("Fungicide", body_style),
                Paragraph(f.get('name', ''), body_style),
                Paragraph(f.get('active_ingredient', ''), body_style),
                Paragraph(f.get('mode_of_action', ''), body_style),
                Paragraph(f.get('dosage', ''), body_style),
                Paragraph(f.get('frequency', ''), body_style)
            ])
            
        for p in pesticides:
            chemical_rows.append([
                Paragraph("Pesticide", body_style),
                Paragraph(p.get('name', ''), body_style),
                Paragraph(p.get('active_ingredient', ''), body_style),
                Paragraph(p.get('mode_of_action', ''), body_style),
                Paragraph(p.get('dosage', ''), body_style),
                Paragraph(p.get('frequency', ''), body_style)
            ])
            
        if len(chemical_rows) > 1:
            chem_table = Table(chemical_rows, colWidths=[65, 80, 100, 110, 80, 97])
            chem_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f1f5f9")),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
                ('PADDING', (0,0), (-1,-1), 5),
                ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ]))
            story.append(chem_table)
            story.append(Spacer(1, 10))
            
        if reference_sources:
            story.append(Paragraph(f"<b>Scientific References:</b> {reference_sources}", ParagraphStyle('Ref', parent=body_style, fontSize=8, textColor=colors.HexColor("#64748b"))))
            story.append(Spacer(1, 5))
            
        safety_style = ParagraphStyle(
            'SafetyWarning',
            parent=body_style,
            fontName='Helvetica-BoldOblique',
            fontSize=8,
            textColor=colors.HexColor("#b91c1c")
        )
        story.append(Paragraph("SAFETY NOTICE: Always follow local agricultural regulations and label instructions before applying any chemical treatment.", safety_style))
        story.append(Spacer(1, 5))

    story.append(Spacer(1, 20))
    story.append(Table([[""]], colWidths=[532], rowHeights=[1], style=TableStyle([('BACKGROUND', (0,0), (-1,-1), border_color)])))
    story.append(Spacer(1, 8))
    
    disclaimer_style = ParagraphStyle(
        'Disclaimer',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#9ca3af"),
        alignment=1
    )
    story.append(Paragraph("This report was automatically generated by the AgriGuard AI Plant Pathology System. Consult certified crop pathologists or extension offices for critical crop management decisions.", disclaimer_style))
    
    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()

def generate_vault_report_pdf(items):
    from io import BytesIO
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    import os
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    
    styles = getSampleStyleSheet()
    
    primary_color = colors.HexColor("#0f766e")  # Teal 700
    text_color = colors.HexColor("#1f2937")     # Gray 800
    bg_light = colors.HexColor("#f3f4f6")       # Gray 100
    border_color = colors.HexColor("#e5e7eb")   # Gray 200
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=primary_color,
        spaceAfter=15
    )
    
    h2_style = ParagraphStyle(
        'H2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=primary_color,
        spaceBefore=12,
        spaceAfter=6
    )
    
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=text_color,
        spaceAfter=8
    )
    
    meta_style = ParagraphStyle(
        'Meta',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#4b5563")
    )
    
    disclaimer_style = ParagraphStyle(
        'Disclaimer',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#9ca3af"),
        alignment=1
    )
    
    story = []
    
    story.append(Paragraph("AgriGuard AI — Crop Diagnosis Vault", title_style))
    story.append(Table([[""]], colWidths=[532], rowHeights=[2], style=TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), primary_color),
        ('PADDING', (0,0), (-1,-1), 0),
    ])))
    story.append(Spacer(1, 20))
    
    story.append(Paragraph("<b>VAULT EXPORT SUMMARY</b>", h2_style))
    story.append(Paragraph(f"This document represents a comprehensive historical export of the diagnosis vault containing <b>{len(items)} scanned specimens</b>. Below is the historical checklist.", body_style))
    story.append(Spacer(1, 10))
    
    checklist_data = [["No.", "Specimen / Diagnosis", "Severity", "Scan Date"]]
    for idx, item in enumerate(items):
        res = item.get('result', {})
        diag = res.get('diagnosis', {})
        disease_name = diag.get('disease', 'Unknown')
        severity = res.get('prediction', {}).get('severity', 'Medium')
        timestamp = item.get('timestamp', 'N/A').split(',')[0]
        checklist_data.append([str(idx + 1), disease_name, severity, timestamp])
        
    checklist_table = Table(checklist_data, colWidths=[40, 262, 100, 130])
    checklist_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('GRID', (0,0), (-1,-1), 0.5, border_color),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
    ]))
    story.append(checklist_table)
    
    story.append(Spacer(1, 30))
    story.append(Paragraph("<i>Detailed case diagnostic reports follow on the subsequent pages.</i>", ParagraphStyle('CenterDisc', parent=body_style, fontName='Helvetica-Oblique', alignment=1, textColor=colors.HexColor("#6b7280"))))
    
    for idx, item in enumerate(items):
        story.append(PageBreak())
        
        res = item.get('result', {})
        diagnosis = res.get('diagnosis', {})
        disease_name = diagnosis.get('disease', 'Unknown Specimen')
        confidence = diagnosis.get('confidence', 'N/A')
        cause = diagnosis.get('cause', 'N/A')
        treatment = diagnosis.get('treatment', 'N/A')
        prevention = diagnosis.get('prevention', 'N/A')
        image_url = res.get('imageUrl', '')
        timestamp = item.get('timestamp', 'N/A')
        scientific_name = diagnosis.get('scientific_name', '')
        
        disease_name_with_sci = f"{disease_name} (<i>{scientific_name}</i>)" if scientific_name else disease_name
        
        story.append(Paragraph(f"Case Report #{idx + 1} — {disease_name_with_sci}", title_style))
        story.append(Table([[""]], colWidths=[532], rowHeights=[2], style=TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), primary_color),
            ('PADDING', (0,0), (-1,-1), 0),
        ])))
        story.append(Spacer(1, 15))
        
        meta_data = [
            [Paragraph(f"<b>Scan Date:</b> {timestamp}", meta_style), Paragraph(f"<b>Case ID:</b> AGR-VLT-{item.get('id', idx)}", meta_style)],
            [Paragraph(f"<b>Diagnosis Status:</b> {disease_name_with_sci}", meta_style), Paragraph(f"<b>System Confidence:</b> {confidence}", meta_style)]
        ]
        meta_table = Table(meta_data, colWidths=[266, 266])
        meta_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), bg_light),
            ('BOX', (0,0), (-1,-1), 1, border_color),
            ('PADDING', (0,0), (-1,-1), 8),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        story.append(meta_table)
        story.append(Spacer(1, 15))
        
        image_element = None
        if image_url:
            local_path = os.path.join(BASE_DIR, image_url.lstrip('/'))
            if os.path.exists(local_path):
                try:
                    image_element = Image(local_path, width=240, height=180)
                except Exception as e:
                    print(f"Error loading image {local_path}: {e}")
                    
        if image_element:
            right_p = [
                Paragraph("DIAGNOSTIC INSIGHTS", h2_style),
                Paragraph(f"<b>Diagnosis:</b> {disease_name_with_sci}", ParagraphStyle('Diag', parent=body_style, fontSize=12, leading=15, textColor=primary_color, fontName='Helvetica-Bold')),
                Spacer(1, 8),
                Paragraph("<b>Symptom & Cause Analysis:</b>", ParagraphStyle('BoldText', parent=body_style, fontName='Helvetica-Bold')),
                Paragraph(cause, body_style)
            ]
            main_table = Table([[image_element, right_p]], colWidths=[240, 292])
            main_table.setStyle(TableStyle([
                ('VALIGN', (0,0), (-1,-1), 'TOP'),
                ('PADDING', (0,0), (-1,-1), 0),
            ]))
            story.append(main_table)
        else:
            story.append(Paragraph("DIAGNOSTIC INSIGHTS", h2_style))
            story.append(Paragraph(f"<b>Diagnosis:</b> {disease_name_with_sci}", ParagraphStyle('Diag', parent=body_style, fontSize=12, leading=15, textColor=primary_color, fontName='Helvetica-Bold')))
            story.append(Spacer(1, 8))
            story.append(Paragraph("<b>Symptom & Cause Analysis:</b>", ParagraphStyle('BoldText', parent=body_style, fontName='Helvetica-Bold')))
            story.append(Paragraph(cause, body_style))
            
        story.append(Spacer(1, 15))
        
        story.append(Paragraph("RECOVERY & SHIELD PROTOCOLS", h2_style))
        story.append(Table([[
            Paragraph("<b>Recovery Treatment Steps:</b>", ParagraphStyle('Sub', parent=body_style, fontName='Helvetica-Bold')),
            Paragraph("<b>Prevention Shield Measures:</b>", ParagraphStyle('Sub', parent=body_style, fontName='Helvetica-Bold'))
        ]], colWidths=[260, 260], style=TableStyle([('PADDING', (0,0), (-1,-1), 0)])))
        story.append(Spacer(1, 4))
        
        proto_table = Table([[
            Paragraph(treatment, body_style),
            Paragraph(prevention, body_style)
        ]], colWidths=[250, 250])
        proto_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (0,0), colors.HexColor("#f0fdf4")),
            ('BACKGROUND', (1,0), (1,0), colors.HexColor("#f8fafc")),
            ('BOX', (0,0), (0,0), 1, colors.HexColor("#bbf7d0")),
            ('BOX', (1,0), (1,0), 1, colors.HexColor("#e2e8f0")),
            ('PADDING', (0,0), (-1,-1), 10),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ]))
        story.append(proto_table)

        # Recommended chemical protocols
        fungicides = diagnosis.get('fungicides', [])
        pesticides = diagnosis.get('pesticides', [])
        recovery_timeline = diagnosis.get('recovery_timeline', '')
        reference_sources = diagnosis.get('reference_sources', '')
        
        if fungicides or pesticides or recovery_timeline:
            story.append(Spacer(1, 15))
            story.append(Paragraph("SCIENTIFIC CHEMICAL ACTION PROTOCOLS", h2_style))
            if recovery_timeline:
                story.append(Paragraph(f"<b>Expected Recovery Timeline:</b> {recovery_timeline}", body_style))
                story.append(Spacer(1, 5))
                
            chemical_rows = []
            chemical_rows.append([
                Paragraph("<b>Category</b>", ParagraphStyle('ChemH', parent=body_style, fontName='Helvetica-Bold', fontSize=8.5)),
                Paragraph("<b>Chemical Name</b>", ParagraphStyle('ChemH', parent=body_style, fontName='Helvetica-Bold', fontSize=8.5)),
                Paragraph("<b>Active Ingredient</b>", ParagraphStyle('ChemH', parent=body_style, fontName='Helvetica-Bold', fontSize=8.5)),
                Paragraph("<b>Mode of Action</b>", ParagraphStyle('ChemH', parent=body_style, fontName='Helvetica-Bold', fontSize=8.5)),
                Paragraph("<b>Dosage</b>", ParagraphStyle('ChemH', parent=body_style, fontName='Helvetica-Bold', fontSize=8.5)),
                Paragraph("<b>Frequency</b>", ParagraphStyle('ChemH', parent=body_style, fontName='Helvetica-Bold', fontSize=8.5))
            ])
            
            for f in fungicides:
                chemical_rows.append([
                    Paragraph("Fungicide", body_style),
                    Paragraph(f.get('name', ''), body_style),
                    Paragraph(f.get('active_ingredient', ''), body_style),
                    Paragraph(f.get('mode_of_action', ''), body_style),
                    Paragraph(f.get('dosage', ''), body_style),
                    Paragraph(f.get('frequency', ''), body_style)
                ])
                
            for p in pesticides:
                chemical_rows.append([
                    Paragraph("Pesticide", body_style),
                    Paragraph(p.get('name', ''), body_style),
                    Paragraph(p.get('active_ingredient', ''), body_style),
                    Paragraph(p.get('mode_of_action', ''), body_style),
                    Paragraph(p.get('dosage', ''), body_style),
                    Paragraph(p.get('frequency', ''), body_style)
                ])
                
            if len(chemical_rows) > 1:
                chem_table = Table(chemical_rows, colWidths=[65, 80, 100, 110, 80, 97])
                chem_table.setStyle(TableStyle([
                    ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f1f5f9")),
                    ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
                    ('PADDING', (0,0), (-1,-1), 5),
                    ('VALIGN', (0,0), (-1,-1), 'TOP'),
                ]))
                story.append(chem_table)
                story.append(Spacer(1, 10))
                
            if reference_sources:
                story.append(Paragraph(f"<b>Scientific References:</b> {reference_sources}", ParagraphStyle('Ref', parent=body_style, fontSize=8, textColor=colors.HexColor("#64748b"))))
                story.append(Spacer(1, 5))
                
            safety_style = ParagraphStyle(
                'SafetyWarning',
                parent=body_style,
                fontName='Helvetica-BoldOblique',
                fontSize=8,
                textColor=colors.HexColor("#b91c1c")
            )
            story.append(Paragraph("SAFETY NOTICE: Always follow local agricultural regulations and label instructions before applying any chemical treatment.", safety_style))
            story.append(Spacer(1, 5))
            
        story.append(Spacer(1, 20))
        story.append(Table([[""]], colWidths=[532], rowHeights=[1], style=TableStyle([('BACKGROUND', (0,0), (-1,-1), border_color)])))
        story.append(Spacer(1, 8))
        story.append(Paragraph("This report was automatically generated by the AgriGuard AI Plant Pathology System. Consult certified crop pathologists or extension offices for critical crop management decisions.", disclaimer_style))
        
    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()

@app.route("/api/export/pdf", methods=['POST'])
def export_pdf():
    from flask import send_file
    from io import BytesIO
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        pdf_bytes = generate_single_report_pdf(data)
        
        date_str = time.strftime("%Y_%m_%d")
        filename = f"Agriguard_AI_Report_{date_str}.pdf"
        
        return send_file(
            BytesIO(pdf_bytes),
            mimetype="application/pdf",
            as_attachment=True,
            download_name=filename
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Failed to generate report: {str(e)}"}), 500

@app.route("/api/export/vault", methods=['POST'])
def export_vault():
    from flask import send_file
    from io import BytesIO
    try:
        data = request.json
        if not data or 'items' not in data:
            return jsonify({"error": "No history items provided"}), 400
            
        items = data.get('items', [])
        pdf_bytes = generate_vault_report_pdf(items)
        
        date_str = time.strftime("%Y_%m_%d")
        filename = f"Agriguard_AI_Vault_Report_{date_str}.pdf"
        
        return send_file(
            BytesIO(pdf_bytes),
            mimetype="application/pdf",
            as_attachment=True,
            download_name=filename
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Failed to generate vault report: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(debug=True, port=8088, host='0.0.0.0')
