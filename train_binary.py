import os
import random
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout, BatchNormalization
from tensorflow.keras.models import Model
from tensorflow.keras.preprocessing.image import load_img, img_to_array
from tensorflow.keras.applications.efficientnet import preprocess_input
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping

# Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, 'Dataset_binary')
MODEL_PATH = os.path.join(BASE_DIR, 'model_binary.h5')

IMG_SIZE = (224, 224)
BATCH_SIZE = 32

def build_binary_model():
    # Pre-trained base model - Freeze weights for fast CPU training
    base_model = EfficientNetB0(weights='imagenet', include_top=False, input_shape=IMG_SIZE + (3,))
    base_model.trainable = False

    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = BatchNormalization()(x)
    x = Dense(256, activation='swish')(x)
    x = Dropout(0.4)(x)
    # Binary classification: diseased (0) vs healthy (1)
    predictions = Dense(1, activation='sigmoid', dtype='float32')(x)

    model = Model(inputs=base_model.input, outputs=predictions)

    # Use higher learning rate (1e-3) for training classification head
    optimizer = tf.keras.optimizers.Adam(learning_rate=1e-3)
    model.compile(optimizer=optimizer, loss='binary_crossentropy', metrics=['accuracy'])
    return model

def load_balanced_subset(split_dir, samples_per_class=2000):
    """
    Loads a balanced representative subset of images directly into RAM.
    """
    classes = ['diseased', 'healthy']
    X = []
    y = []
    
    for class_idx, class_name in enumerate(classes):
        class_dir = os.path.join(split_dir, class_name)
        if not os.path.exists(class_dir):
            continue
        all_files = [os.path.join(class_dir, f) for f in os.listdir(class_dir) if f.endswith(('.jpg', '.png'))]
        # Keep deterministic order but sample evenly
        random.seed(42)
        selected_files = random.sample(all_files, min(samples_per_class, len(all_files)))
        
        print(f"Loading {len(selected_files)} images for '{class_name}' from {os.path.basename(split_dir)}...")
        for filepath in selected_files:
            try:
                img = load_img(filepath, target_size=IMG_SIZE)
                arr = img_to_array(img)
                # Preprocess input using EfficientNet-specific preprocessing
                arr = preprocess_input(arr)
                X.append(arr)
                y.append(class_idx)  # diseased=0, healthy=1
            except Exception as e:
                print(f"Error loading {filepath}: {e}")
                
    return np.array(X, dtype='float32'), np.array(y, dtype='float32')

def main():
    print("--- Preparing Balanced Binary Dataset in Memory ---")
    train_dir = os.path.join(DATASET_DIR, 'train')
    val_dir = os.path.join(DATASET_DIR, 'val')
    
    # Load 2500 training images per class, and 1000 validation images per class
    X_train, y_train = load_balanced_subset(train_dir, samples_per_class=2500)
    X_val, y_val = load_balanced_subset(val_dir, samples_per_class=1000)
    
    print(f"Training dataset shape: {X_train.shape}, Labels: {y_train.shape}")
    print(f"Validation dataset shape: {X_val.shape}, Labels: {y_val.shape}")
    
    model = build_binary_model()
    checkpoint = ModelCheckpoint(MODEL_PATH, monitor='val_accuracy', save_best_only=True, verbose=1)
    early_stop = EarlyStopping(monitor='val_loss', patience=3, restore_best_weights=True)
    
    print("\n--- Training Binary Classifier Head ---")
    model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=8,
        batch_size=BATCH_SIZE,
        shuffle=True,
        callbacks=[checkpoint, early_stop]
    )
    print("Binary Model Training Completed and Saved.")

if __name__ == '__main__':
    main()
