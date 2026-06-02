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

from google import genai
from google.genai import types
from dotenv import load_dotenv
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

@app.route("/api/diagnose", methods=['POST'])
def diagnose():
    start_time = time.time()
    try:
        image_file = request.files.get('image')
        description = request.form.get('description', '').strip()
        lang = request.form.get('language', 'en')
        
        if not image_file:
            return jsonify({"error": "No image provided. Please upload a leaf image."}), 400

        filename = image_file.filename
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        image_file.save(file_path)
        image_url = f"/static/upload/{filename}"
        
        # Stage 1: Leaf Quality Filter
        is_good, quality_reason = check_image_quality(file_path)
        if not is_good:
            return jsonify({"error": quality_reason}), 400

        # Execute Pipeline
        prediction_result = get_multi_stage_prediction(file_path)
        
        # Binary Early Exit (Healthy)
        if prediction_result["stage"] == "binary" and prediction_result["diagnosis"] == "Healthy":
            final_diagnosis = {
                "disease": "Healthy Plant",
                "confidence": f"{prediction_result['confidence']*100:.0f}%",
                "cause": "No disease detected. Plant appears healthy.",
                "treatment": "No treatment required. Continue regular maintenance.",
                "prevention": "Maintain good hygiene and monitor regularly."
            }
            return generate_final_response(final_diagnosis, lang, image_url)
            
        # Disease Fallback to LLM Strategy
        top_3 = prediction_result["top_3"]
        top_1 = top_3[0]
        
        # If very confident, return the top-1 directly without confusing the user
        if top_1["confidence"] >= 0.70:
            final_diagnosis = {
                "disease": top_1["name"],
                "confidence": f"{top_1['confidence']*100:.0f}%",
                "cause": top_1["info"].get("description", ""),
                "treatment": top_1["info"].get("treatment", ""),
                "prevention": top_1["info"].get("prevention", "")
            }
            return generate_final_response(final_diagnosis, lang, image_url)
            
        # Stage 5: Hybrid Intelligent Decision System
        # Confident < 70%, silently use LLM to choose ONE definitive diagnosis
        query_for_rag = f"{top_1['name']} or {top_3[1]['name']}"
        retrieved_context = rag_engine.retrieve_context(query_for_rag, k=2)
        
        top_3_str = ", ".join([f"{p['name']} ({p['confidence']*100:.0f}%)" for p in top_3])
        
        system_prompt = (
            "You are an expert plant pathologist AI. The image CNN is uncertain. "
            "You MUST output exactly ONE definitive disease diagnosis. Do not output a list of probabilities. "
            "If you cannot decide, pick the most likely one based on symptoms."
        )
        prompt = f"""
        {system_prompt}
        
        CNN Top-3 Guesses: {top_3_str}
        User Symptoms: {description if description else 'None provided'}
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
        
        print(f"Calling LLM for Hybrid Decision (Confidence: {top_1['confidence']:.2f})...")
        try:
            import concurrent.futures
            
            def call_llm():
                return genai_client.models.generate_content(
                    model='gemini-1.5-flash',
                    contents=prompt
                )
            
            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(call_llm)
                # Hard timeout of 8 seconds for the LLM to prevent hanging
                response = future.result(timeout=8)
                
            print("LLM generated response successfully.")
            result_text = response.text.replace("```json", "").replace("```", "").strip()
            final_diagnosis = json.loads(result_text)
        except concurrent.futures.TimeoutError:
            print("LLM Request timed out! Falling back to CNN.")
            final_diagnosis = {
                "disease": top_1["name"],
                "confidence": f"{top_1['confidence']*100:.0f}%",
                "cause": top_1["info"].get("description", ""),
                "treatment": top_1["info"].get("treatment", ""),
                "prevention": top_1["info"].get("prevention", "")
            }
        except Exception as e:
            print(f"LLM Error: {e}. Falling back to CNN.")
            # Absolute fallback if LLM fails
            final_diagnosis = {
                "disease": top_1["name"],
                "confidence": f"{top_1['confidence']*100:.0f}%",
                "cause": top_1["info"].get("description", ""),
                "treatment": top_1["info"].get("treatment", ""),
                "prevention": top_1["info"].get("prevention", "")
            }
            
        return generate_final_response(final_diagnosis, lang, image_url)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Diagnosis failed: {str(e)}"}), 500

def generate_final_response(final_diagnosis, lang, image_url):
    # Translate Final Result
    if lang != 'en':
        for key in final_diagnosis:
            if key != 'confidence':
                final_diagnosis[key] = translate_text(final_diagnosis[key], lang)
    
    prediction_shim = {
        "name": final_diagnosis.get("disease"),
        "severity": "Medium",
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
    
    date_str = time.strftime("%Y-%m-%d %H:%M:%S")
    report_id = f"AGR-{int(time.time())}"
    
    meta_data = [
        [Paragraph(f"<b>Date Generated:</b> {date_str}", meta_style), Paragraph(f"<b>Report ID:</b> {report_id}", meta_style)],
        [Paragraph(f"<b>Specimen Diagnosis:</b> {disease_name}", meta_style), Paragraph(f"<b>System Confidence:</b> {confidence}", meta_style)]
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
            Paragraph(f"<b>Diagnosis:</b> {disease_name}", ParagraphStyle('Diag', parent=body_style, fontSize=12, leading=15, textColor=primary_color, fontName='Helvetica-Bold')),
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
        story.append(Paragraph(f"<b>Diagnosis:</b> {disease_name}", ParagraphStyle('Diag', parent=body_style, fontSize=12, leading=15, textColor=primary_color, fontName='Helvetica-Bold')))
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
        
        story.append(Paragraph(f"Case Report #{idx + 1} — {disease_name}", title_style))
        story.append(Table([[""]], colWidths=[532], rowHeights=[2], style=TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), primary_color),
            ('PADDING', (0,0), (-1,-1), 0),
        ])))
        story.append(Spacer(1, 15))
        
        meta_data = [
            [Paragraph(f"<b>Scan Date:</b> {timestamp}", meta_style), Paragraph(f"<b>Case ID:</b> AGR-VLT-{item.get('id', idx)}", meta_style)],
            [Paragraph(f"<b>Diagnosis Status:</b> {disease_name}", meta_style), Paragraph(f"<b>System Confidence:</b> {confidence}", meta_style)]
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
                Paragraph(f"<b>Diagnosis:</b> {disease_name}", ParagraphStyle('Diag', parent=body_style, fontSize=12, leading=15, textColor=primary_color, fontName='Helvetica-Bold')),
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
            story.append(Paragraph(f"<b>Diagnosis:</b> {disease_name}", ParagraphStyle('Diag', parent=body_style, fontSize=12, leading=15, textColor=primary_color, fontName='Helvetica-Bold')))
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
