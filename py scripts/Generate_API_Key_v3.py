import requests
import json
import os
import sys
import re
import datetime

def update_env_file(file_path, api_key):
    if not os.path.exists(file_path):
        print("Creating a new .env file")
        with open(file_path, 'w') as env_file:
            env_file.write(f'FLATFILE_API_KEY="{api_key}"\n')
            env_file.write('FLATFILE_ENVIRONMENT=""\n')
            env_file.write('USERNAME=jkleinberg-impl@wdprofserv_ldp1\n')
            env_file.write('PASSWORD=Workday123!\n')
    else:
        print("Updating the existing .env file")
        with open(file_path, 'r') as env_file:
            lines = env_file.readlines()

        with open(file_path, 'w') as env_file:
            for line in lines:
                if line.startswith("FLATFILE_API_KEY"):
                    env_file.write(f'FLATFILE_API_KEY="{api_key}"\n')
                else:
                    env_file.write(line)

# Default values
default_client_id = "c1e89891-f5bd-4a60-9a93-7499d279bff5"
default_secret_key = "e4034bcc-644d-4d13-804e-daa7a7668799"

# Check if command-line arguments are provided
if len(sys.argv) > 1:
    client_id = sys.argv[1]
    secret_key = sys.argv[2]
else:
    client_id = default_client_id
    secret_key = default_secret_key

def load_access_token_expiration(path):
    try:
        with open(path, 'r') as file:
            return json.load(file).get('expires')
    except (FileNotFoundError, json.JSONDecodeError, KeyError):
        return None

script_dir = os.path.dirname(os.path.abspath(__file__))
print(f"Script directory: {script_dir}")
accessToken_path = os.path.join(script_dir, '..', 'access_token.json')
accessTokenExpiration = load_access_token_expiration(accessToken_path)

#check datetime and exit cleanly if it's still good
if accessTokenExpiration and datetime.datetime.utcnow() <= datetime.datetime.strptime(accessTokenExpiration,'%a, %d %b %Y %H:%M:%S %Z'):
    exit(0)

url = "https://platform.flatfile.com/api/v1/auth"

payload = {
    "clientId": client_id,
    "secret": secret_key
}
headers = {
    "Content-Type": "application/json",
    "Accept": "application/json"
}

try:
    response = requests.post(url, json=payload, headers=headers)
    response.raise_for_status()

    access_token = {re.sub( '(?<!^)(?=[A-Z])', '_', k).lower():v for k,v in response.json()['data'].items()}

    output_file_path = os.path.join(script_dir, '..', 'access_token.json')

    with open(output_file_path, 'w') as json_file:
        json.dump(access_token, json_file)

    env_file_path = os.path.join(script_dir, '..', '.env')
    print(f".env file path: {env_file_path}")
    update_env_file(env_file_path, access_token['access_token'])

except requests.exceptions.HTTPError as http_err:
    print(f"HTTP error occurred: {http_err}")
except requests.exceptions.RequestException as req_err:
    print(f"An error occurred during the request: {req_err}")
except json.decoder.JSONDecodeError as json_err:
    print(f"An error occurred during JSON decoding: {json_err}")
except Exception as e:
    print(f"An unexpected error occurred: {e}")