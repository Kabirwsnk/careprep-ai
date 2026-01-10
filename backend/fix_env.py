import os

def fix_env():
    env_path = 'c:/Users/Kabir Wasnik/.gemini/antigravity/scratch/careprep-ai/backend/.env'
    if not os.path.exists(env_path):
        print("File not found")
        return

    with open(env_path, 'rb') as f:
        raw_data = f.read()

    # Split the data into pieces based on common encodings
    # The first part is usually UTF-8
    # The second part (appended via PowerShell) is often UTF-16 LE (starts with BOM or has null bytes)
    
    parts = []
    
    # Try to find where UTF-16 starts (look for null bytes if it's UTF-16 LE)
    # Or just try to decode the whole thing as UTF-8 ignoring errors, then search for strings
    
    clean_lines = []
    
    # Method 1: Decode UTF-8 with ignore
    utf8_decoded = raw_data.decode('utf-8', errors='ignore')
    for line in utf8_decoded.splitlines():
        if '=' in line and len(line) > 3:
            clean_lines.append(line.strip())
            
    # Method 2: Decode UTF-16 LE with ignore (for the appended part)
    # We look for the null bytes specifically
    utf16_decoded = raw_data.decode('utf-16', errors='ignore')
    for line in utf16_decoded.splitlines():
        if '=' in line and len(line) > 3:
            if line.strip() not in clean_lines:
                clean_lines.append(line.strip())

    # Sort out duplicates and keep the most complete ones
    final_env = {}
    for line in clean_lines:
        if '=' in line:
            key, val = line.split('=', 1)
            # If we already have this key, and the new value is longer/more complete, update it
            if key not in final_env or len(val) > len(final_env[key]):
                final_env[key] = val

    # Specific fix for OPENROUTER_API_KEY which might be truncated or mangled
    # The user provided: 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
    final_env['OPENROUTER_API_KEY'] = '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'
    final_env['OPENROUTER_MODEL'] = 'mistralai/mistral-7b-instruct:free'

    with open(env_path + '.fixed', 'w', encoding='utf-8') as f:
        for k, v in final_env.items():
            f.write(f"{k}={v}\n")
    
    print(f"Fixed env written to {env_path}.fixed")
    for k in final_env:
        print(f"Recovered: {k}")

if __name__ == "__main__":
    fix_env()
