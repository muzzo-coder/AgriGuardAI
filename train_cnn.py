import os
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Dropout
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint

def train_cnn():
    train_datagen = ImageDataGenerator(
        rescale=1./255,
        shear_range=0.2,
        zoom_range=0.2,
        horizontal_flip=True
    )

    val_datagen = ImageDataGenerator(rescale=1./255)

    train_generator = train_datagen.flow_from_directory(
        'Dataset/train',
        target_size=(128, 128),
        batch_size=16,
        class_mode='categorical'
    )

    val_generator = val_datagen.flow_from_directory(
        'Dataset/val',
        target_size=(128, 128),
        batch_size=16,
        class_mode='categorical',
        shuffle=False
    )

    classifier = Sequential()
    classifier.add(Conv2D(32, (3, 3), input_shape=(128, 128, 3), activation='relu'))
    classifier.add(MaxPooling2D(pool_size=(2, 2)))
    classifier.add(Conv2D(64, (3, 3), activation='relu'))
    classifier.add(MaxPooling2D(pool_size=(2, 2)))
    classifier.add(Conv2D(128, (3, 3), activation='relu'))
    classifier.add(MaxPooling2D(pool_size=(2, 2)))
    classifier.add(Flatten())
    classifier.add(Dense(units=128, activation='relu'))
    classifier.add(Dropout(0.5))
    classifier.add(Dense(units=10, activation='softmax')) # FIX: Softmax instead of sigmoid

    classifier.compile(optimizer=Adam(learning_rate=1e-3), loss='categorical_crossentropy', metrics=['accuracy'])

    early_stop = EarlyStopping(monitor='val_accuracy', patience=15, restore_best_weights=True)
    reduce_lr = ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=5, min_lr=1e-6)
    checkpoint = ModelCheckpoint('model.h5', monitor='val_accuracy', save_best_only=True, mode='max')

    print("Training original CNN architecture (fixed)...")
    classifier.fit(
        train_generator,
        epochs=100,
        validation_data=val_generator,
        callbacks=[early_stop, reduce_lr, checkpoint]
    )
    print("Training complete!")

if __name__ == "__main__":
    train_cnn()
