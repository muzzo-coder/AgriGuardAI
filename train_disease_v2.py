import os
import json
import random
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications import EfficientNetB3
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout, BatchNormalization
from tensorflow.keras.models import Model
from tensorflow.keras.preprocessing.image import load_img, img_to_array
from tensorflow.keras.applications.efficientnet import preprocess_input
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau
from tensorflow.keras.utils import to_categorical

# Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, 'Dataset_disease_v2')
TRAIN_DIR = os.path.join(DATASET_DIR, 'train')
VAL_DIR = os.path.join(DATASET_DIR, 'val')
MODEL_PATH = os.path.join(BASE_DIR, 'model_disease.h5')

IMG_SIZE = (224, 224)
BATCH_SIZE = 32
NUM_CLASSES = 20

def build_model():
    # Pre-trained base model - Freeze weights for fast CPU training
    base_model = EfficientNetB3(weights='imagenet', include_top=False, input_shape=IMG_SIZE + (3,))
    base_model.trainable = False

    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = BatchNormalization()(x)
    x = Dense(512, activation='swish')(x)
    x = Dropout(0.5)(x)
    predictions = Dense(NUM_CLASSES, activation='softmax', dtype='float32')(x)

    model = Model(inputs=base_model.input, outputs=predictions)

    # Compile with classification learning rate (1e-3)
    optimizer = tf.keras.optimizers.Adam(learning_rate=1e-3)
    model.compile(optimizer=optimizer, loss='categorical_crossentropy', metrics=['accuracy'])
    return model

def load_balanced_subset(split_dir, class_mapping, samples_per_class=150):
    """
    Loads a balanced representative subset of images directly into RAM.
    Ensures that labels are correctly mapped based on class_mapping.
    """
    X = []
    y = []
    
    for class_name, class_idx in class_mapping.items():
        class_dir = os.path.join(split_dir, class_name)
        if not os.path.exists(class_dir):
            print(f"WARNING: Directory not found: {class_dir}")
            continue
        all_files = [os.path.join(class_dir, f) for f in os.listdir(class_dir) if f.endswith(('.jpg', '.png'))]
        
        # Sample evenly
        random.seed(42)
        selected_files = random.sample(all_files, min(samples_per_class, len(all_files)))
        
        print(f"Loading {len(selected_files)} images for class '{class_name}' (idx {class_idx}) from {os.path.basename(split_dir)}...")
        for filepath in selected_files:
            try:
                img = load_img(filepath, target_size=IMG_SIZE)
                arr = img_to_array(img)
                arr = preprocess_input(arr)
                X.append(arr)
                y.append(class_idx)
            except Exception as e:
                print(f"Error loading {filepath}: {e}")
                
    return np.array(X, dtype='float32'), np.array(y, dtype='int32')

def main():
    print("--- Preparing Balanced Disease Dataset in Memory ---")
    
    # Check/Load existing class mapping to guarantee indices match
    mapping_path = os.path.join(BASE_DIR, 'classes_disease.json')
    if os.path.exists(mapping_path):
        with open(mapping_path, 'r') as f:
            class_mapping = json.load(f)
        print("Loaded existing class indices mapping:", class_mapping)
    else:
        # Generate mapping alphabetically (matches flow_from_directory default behavior)
        classes = sorted([d for d in os.listdir(TRAIN_DIR) if os.path.isdir(os.path.join(TRAIN_DIR, d))])
        class_mapping = {name: idx for idx, name in enumerate(classes)}
        with open(mapping_path, 'w') as f:
            json.dump(class_mapping, f)
        print("Generated new class mapping:", class_mapping)
        
    # Load 150 images per class for training, and 40 images per class for validation
    X_train, y_train_indices = load_balanced_subset(TRAIN_DIR, class_mapping, samples_per_class=150)
    X_val, y_val_indices = load_balanced_subset(VAL_DIR, class_mapping, samples_per_class=40)
    
    # Convert labels to one-hot encoding
    y_train = to_categorical(y_train_indices, num_classes=NUM_CLASSES)
    y_val = to_categorical(y_val_indices, num_classes=NUM_CLASSES)
    
    print(f"Training dataset shape: {X_train.shape}, Labels: {y_train.shape}")
    print(f"Validation dataset shape: {X_val.shape}, Labels: {y_val.shape}")
    
    model = build_model()
    checkpoint = ModelCheckpoint(MODEL_PATH, monitor='val_accuracy', save_best_only=True, verbose=1)
    early_stop = EarlyStopping(monitor='val_loss', patience=4, restore_best_weights=True)
    reduce_lr = ReduceLROnPlateau(monitor='val_loss', factor=0.2, patience=2, min_lr=1e-5)
    
    print("\n--- Training Disease Classifier Head ---")
    model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=10,
        batch_size=BATCH_SIZE,
        shuffle=True,
        callbacks=[checkpoint, early_stop, reduce_lr]
    )
    print("Disease Model Training Completed and Saved.")

if __name__ == '__main__':
    main()
