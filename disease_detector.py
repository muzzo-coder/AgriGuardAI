import cv2
import numpy as np
import os
import time

def get_leaf_mask(img):
    """
    Isolates the leaf from the background using adaptive thresholding.
    Handles both light and dark backgrounds.
    """
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape
    
    # Sample border pixels to detect background intensity
    border_pixels = np.concatenate([
        gray[0, :], gray[-1, :], gray[:, 0], gray[:, -1]
    ])
    mean_border = np.mean(border_pixels)
    
    # Generate binary mask based on background color
    if mean_border > 120:
        # Light background -> Invert threshold to keep the dark leaf
        _, thresh = cv2.threshold(gray, min(int(mean_border * 0.9), 220), 255, cv2.THRESH_BINARY_INV)
    else:
        # Dark background -> Keep bright leaf
        _, thresh = cv2.threshold(gray, max(int(mean_border * 1.4), 30), 255, cv2.THRESH_BINARY)
        
    # Morphological closing to fill leaf interior holes
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    closed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
    closed = cv2.morphologyEx(closed, cv2.MORPH_OPEN, kernel)
    
    contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    leaf_mask = np.zeros_like(gray)
    
    if contours:
        largest_contour = max(contours, key=cv2.contourArea)
        cv2.drawContours(leaf_mask, [largest_contour], -1, 255, -1)
        return leaf_mask, largest_contour
        
    return closed, None

def detect_disease_region(image_path, upload_folder):
    """
    Processes the leaf image to find the largest infected region.
    Saves highlighted and cropped close-up images to the upload folder.
    Returns metadata dict if disease spots found, else None.
    """
    img = cv2.imread(image_path)
    if img is None:
        return None
        
    h, w, _ = img.shape
    leaf_mask, leaf_contour = get_leaf_mask(img)
    
    if leaf_contour is None:
        return None
        
    # Convert leaf to HSV to detect healthy green vs anomalous colors
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    
    # Define color thresholds for healthy green foliage
    lower_green = np.array([28, 25, 25])
    upper_green = np.array([105, 255, 255])
    green_mask = cv2.inRange(hsv, lower_green, upper_green)
    
    # Diseased candidates are leaf pixels that are NOT healthy green
    non_green_leaf = cv2.bitwise_and(leaf_mask, cv2.bitwise_not(green_mask))
    
    # Specific color ranges for disease symptoms
    # 1. Yellow/Brown (rust, chlorosis, lesions)
    yellow_brown = cv2.inRange(hsv, np.array([5, 45, 35]), np.array([24, 255, 255]))
    # 2. Black/Grey (dark spots, necrosis, blights)
    dark_spots = cv2.inRange(hsv, np.array([0, 0, 0]), np.array([180, 255, 60]))
    # 3. White/Fuzzy (powdery mildew, mold)
    # Saturation set to starting at 35 to ignore pure white specular glare highlights
    white_patches = cv2.inRange(hsv, np.array([0, 35, 140]), np.array([180, 80, 255]))
    
    # Combine symptom filters
    symptom_mask = cv2.bitwise_or(yellow_brown, dark_spots)
    symptom_mask = cv2.bitwise_or(symptom_mask, white_patches)
    
    # Restrict disease spots to the leaf region
    disease_pixels = cv2.bitwise_and(non_green_leaf, symptom_mask)
    
    # Morphological cleanup
    kernel_open = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    kernel_close = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    cleaned_disease = cv2.morphologyEx(disease_pixels, cv2.MORPH_OPEN, kernel_open)
    cleaned_disease = cv2.morphologyEx(cleaned_disease, cv2.MORPH_CLOSE, kernel_close)
    
    contours, _ = cv2.findContours(cleaned_disease, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Filter for significant spots (ignore tiny specks/noise)
    min_spot_area = 25
    significant_contours = [c for c in contours if cv2.contourArea(c) > min_spot_area]
    
    if not significant_contours:
        return None
        
    # Sort by size to target the most severe/largest infected region
    significant_contours = sorted(significant_contours, key=cv2.contourArea, reverse=True)
    largest_spot = significant_contours[0]
    
    # Calculate leaf area and disease area for verification
    leaf_area = cv2.contourArea(leaf_contour)
    disease_area = cv2.contourArea(largest_spot)
    
    # If the disease spot is too small relative to the leaf (e.g. < 2.0%), ignore it
    if leaf_area > 0 and (disease_area / leaf_area) < 0.02:
        return None
        
    # Get bounding box of the main disease region
    x, y, sw, sh = cv2.boundingRect(largest_spot)
    
    # Add proportional padding (25% around the box) for auto-zoom context
    pad_w = int(sw * 0.25)
    pad_h = int(sh * 0.25)
    
    x_start = max(0, x - pad_w)
    y_start = max(0, y - pad_h)
    x_end = min(w, x + sw + pad_w)
    y_end = min(h, y + sh + pad_h)
    
    # Generate visual outputs
    # 1. Cropped disease region (Auto-Zoom)
    cropped_img = img[y_start:y_end, x_start:x_end]
    
    # 2. Highlighted original image with overlay bounding box
    highlighted_img = img.copy()
    # Draw glowing orange/red rectangle
    cv2.rectangle(highlighted_img, (x, y), (x + sw, y + sh), (0, 120, 255), 3)
    # Draw background box for text label
    cv2.rectangle(highlighted_img, (x - 2, max(0, y - 25)), (x + 180, max(0, y)), (0, 120, 255), -1)
    # Draw text label
    cv2.putText(
        highlighted_img, 
        "DISEASE ZONE DETECTED", 
        (x + 5, max(15, y - 8)), 
        cv2.FONT_HERSHEY_SIMPLEX, 
        0.4, 
        (255, 255, 255), 
        1, 
        cv2.LINE_AA
    )
    
    # Create unique filenames
    base_name = os.path.basename(image_path)
    root_name, ext = os.path.splitext(base_name)
    timestamp = int(time.time())
    
    highlighted_filename = f"highlighted_{timestamp}_{base_name}"
    cropped_filename = f"cropped_{timestamp}_{base_name}"
    
    highlighted_path = os.path.join(upload_folder, highlighted_filename)
    cropped_path = os.path.join(upload_folder, cropped_filename)
    
    cv2.imwrite(highlighted_path, highlighted_img)
    cv2.imwrite(cropped_path, cropped_img)
    
    # Return region metadata
    return {
        "diseaseAreaDetected": True,
        "boxCoordinates": [x, y, sw, sh],
        "highlightedUrl": f"/static/upload/{highlighted_filename}",
        "croppedUrl": f"/static/upload/{cropped_filename}",
        "croppedPath": cropped_path
    }
