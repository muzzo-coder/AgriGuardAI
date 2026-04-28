import numpy as np
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report
from tensorflow.keras.applications.resnet50 import preprocess_input
import os
import tensorflow as tf

def evaluate_model():
    model_path = "model.h5"
    if not os.path.exists(model_path):
        print(f"Error: {model_path} not found.")
        return

    print("Loading model...")
    model = load_model(model_path)

    print("Preparing test data...")
    test_datagen = ImageDataGenerator(preprocessing_function=preprocess_input)
    
    # We use validation set as test set since it's already organized in class subdirectories
    test_dir = 'Dataset/val'
    
    test_generator = test_datagen.flow_from_directory(
        test_dir,
        target_size=(224, 224),
        batch_size=32,
        class_mode='categorical',
        shuffle=False
    )

    print("Predicting...")
    y_pred = model.predict(test_generator)
    y_pred_classes = np.argmax(y_pred, axis=1)
    y_test = test_generator.classes

    print("\nCalculating Metrics...")
    accuracy = accuracy_score(y_test, y_pred_classes)
    # Using 'weighted' average to account for class imbalance if any
    precision = precision_score(y_test, y_pred_classes, average='weighted', zero_division=0)
    recall = recall_score(y_test, y_pred_classes, average='weighted', zero_division=0)
    f1 = f1_score(y_test, y_pred_classes, average='weighted', zero_division=0)

    print("\n📊 MODEL PERFORMANCE METRICS")
    print(f"Accuracy : {accuracy * 100:.2f}%")
    print(f"Precision: {precision:.2f}")
    print(f"Recall   : {recall:.2f}")
    print(f"F1 Score : {f1:.2f}")

    print("\nDetailed Report:")
    class_labels = list(test_generator.class_indices.keys())
    print(classification_report(y_test, y_pred_classes, target_names=class_labels, zero_division=0))

if __name__ == "__main__":
    evaluate_model()
