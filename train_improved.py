import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications.mobilenet_v2 import MobileNetV2, preprocess_input
from tensorflow.keras.layers import GlobalAveragePooling2D, Dropout, Dense
from tensorflow.keras.models import Model
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint
from sklearn.utils.class_weight import compute_class_weight

def build_and_train_model():
    print("Preparing Datasets...")
    img_size = (128, 128)
    batch_size = 16

    # Data Augmentation matching original but with proper MobileNetV2 preprocessing
    train_datagen = ImageDataGenerator(
        preprocessing_function=preprocess_input,
        shear_range=0.2,
        zoom_range=0.2,
        horizontal_flip=True
    )

    # Only preprocess for validation
    val_datagen = ImageDataGenerator(preprocessing_function=preprocess_input)

    train_generator = train_datagen.flow_from_directory(
        'Dataset/train',
        target_size=img_size,
        batch_size=batch_size,
        class_mode='categorical'
    )

    val_generator = val_datagen.flow_from_directory(
        'Dataset/val',
        target_size=img_size,
        batch_size=batch_size,
        class_mode='categorical',
        shuffle=False
    )

    # Compute class weights to handle imbalance
    print("Computing class weights...")
    class_indices = train_generator.classes
    classes_list = np.unique(class_indices)
    weights = compute_class_weight(class_weight='balanced', classes=classes_list, y=class_indices)
    class_weight_dict = {cls: weight for cls, weight in zip(classes_list, weights)}
    print(f"Class Weights: {class_weight_dict}")

    print("Building Transfer Learning Model (MobileNetV2)...")
    base_model = MobileNetV2(weights='imagenet', include_top=False, input_shape=(128, 128, 3))
    
    # Freeze base model for Phase 1
    for layer in base_model.layers:
        layer.trainable = False

    inputs = tf.keras.Input(shape=(128, 128, 3))
    x = base_model(inputs, training=False)
    x = GlobalAveragePooling2D()(x)
    x = Dropout(0.2)(x)
    predictions = Dense(train_generator.num_classes, activation='softmax')(x)

    model = Model(inputs=inputs, outputs=predictions)

    print("Compiling model (Phase 1)...")
    model.compile(optimizer=Adam(learning_rate=1e-3), loss='categorical_crossentropy', metrics=['accuracy'])

    # Callbacks
    early_stop = EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True)
    reduce_lr = ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=3, min_lr=1e-6)
    checkpoint = ModelCheckpoint('model_improved.h5', monitor='val_accuracy', save_best_only=True, mode='max')

    print("Training Phase 1 (Top layers only)...")
    model.fit(
        train_generator,
        epochs=50,
        validation_data=val_generator,
        class_weight=class_weight_dict,
        callbacks=[early_stop, reduce_lr, checkpoint]
    )

    print("Loading best weights from Phase 1...")
    if os.path.exists('model_improved.h5'):
        model.load_weights('model_improved.h5')

    print("Replacing old model.h5 with newly trained model...")
    # Save the final model
    model.save('model.h5')
    print("Training complete! New model.h5 saved.")

if __name__ == "__main__":
    build_and_train_model()
