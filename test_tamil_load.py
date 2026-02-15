from transformers import pipeline

print("Testing Tamil Model Load...")
try:
    tamil = pipeline(
        "summarization",
        model="ai4bharat/indicbart",
        tokenizer="ai4bharat/indicbart"
    )
    print("SUCCESS: Tamil Model Loaded")
except Exception as e:
    print(f"FAILURE: {e}")
