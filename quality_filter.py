import cv2
import numpy as np

def check_image_quality(image_path, blur_threshold=50.0, dark_threshold=40.0, bright_threshold=220.0):
    """
    Checks if an image meets the minimum quality standards for diagnosis.
    Returns (True, "Good") if passed, otherwise (False, Reason).
    """
    try:
        # Load image in grayscale for blur and lighting calculation
        img_gray = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
        
        if img_gray is None:
            return False, "Image could not be loaded."

        # 1. Blur Detection (Laplacian Variance)
        laplacian_var = cv2.Laplacian(img_gray, cv2.CV_64F).var()
        if laplacian_var < blur_threshold:
            return False, "Image is too blurry. Please capture a sharper photo."

        # 2. Lighting Detection (Mean Brightness)
        mean_brightness = np.mean(img_gray)
        if mean_brightness < dark_threshold:
            return False, "Image is too dark. Please use better lighting."
        if mean_brightness > bright_threshold:
            return False, "Image is overexposed/too bright. Please reduce glare."

        # 3. Simple Object/Leaf Presence Check (Contour Area)
        # Threshold to create binary mask
        _, thresh = cv2.threshold(img_gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if not contours:
            return False, "No leaf detected in the image."
            
        # Find largest contour
        largest_contour = max(contours, key=cv2.contourArea)
        area = cv2.contourArea(largest_contour)
        img_area = img_gray.shape[0] * img_gray.shape[1]
        
        # If the largest object occupies less than 5% of the image, it might just be noise or a tiny speck
        if area < (img_area * 0.05):
            return False, "Leaf is too far or too small. Please move closer."

        return True, "Image quality is good."

    except Exception as e:
        return False, f"Error processing image quality: {str(e)}"

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        img_path = sys.argv[1]
        is_good, reason = check_image_quality(img_path)
        print(f"Quality Check: {'PASSED' if is_good else 'FAILED'} - {reason}")
    else:
        print("Usage: python quality_filter.py <image_path>")
