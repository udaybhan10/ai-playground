import sys
import os

# Add backend to path if needed, though we are running from root
sys.path.append(os.path.join(os.getcwd(), 'backend'))

try:
    from kokoro_onnx import Kokoro
    import soundfile as sf
    print("Kokoro imported successfully")
except ImportError as e:
    print(f"Failed to import: {e}")
    sys.exit(1)

model_path = "backend/models/kokoro-v0_19.onnx"
voices_path = "backend/models/voices.bin"

print(f"Loading model from {model_path}")
print(f"Loading voices from {voices_path}")

try:
    kokoro = Kokoro(model_path, voices_path)
    print("Kokoro loaded successfully")
    
    text = "Hello world"
    print(f"Generating audio for: {text}")
    samples, sample_rate = kokoro.create(text, voice="af_sarah", speed=1.0, lang="en-us")
    print(f"Generated {len(samples)} samples at {sample_rate}Hz")
    
except Exception as e:
    print("An error occurred:")
    import traceback
    traceback.print_exc()
