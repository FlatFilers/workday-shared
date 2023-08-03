import requests
import json
import os

# Get the current script's directory
script_dir = os.path.dirname(os.path.abspath(__file__))

# Construct the path to the access_token.json and environments.json files
token_path = os.path.join(script_dir, '..', 'access_token.json')
envs_path = os.path.join(script_dir, '..', 'environments.json')

# Read the token from the access_token.json file
try:
    with open(token_path, 'r') as file:
        creds = json.load(file)
        token = creds['access_token']
except FileNotFoundError:
    print(f"Token file not found in path: {token_path}")
    exit(1)

# Read the environments from the environments.json file
try:
    with open(envs_path, 'r') as file:
        envs = json.load(file)
except FileNotFoundError:
    print(f"Environments file not found in path: {envs_path}")
    exit(1)

# Query each environment's API keys
for env in envs:
    # Construct the API request
    url = "https://platform.flatfile.com/api/v1/auth/api-keys"
    querystring = {"environmentId": env['ID']}
    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {token}"
    }

    response = requests.get(url, headers=headers, params=querystring)

    # Check the response
    if response.status_code == 200:
        print(f"Retrieved API keys for environment '{env['Name']}'")
        resp_data = response.json()['data']

        for key in resp_data:
            if key['type'] == 'PUBLISHABLE':
                env['PUBLIC_KEY'] = key['rawKey']
            else:
                env['SECRET_KEY'] = key['rawKey']
    else:
        print(f"Failed to get API keys for environment '{env['Name']}': {response.json()}")

# Write the environments with their API keys back to the environments.json file
try:
    with open(envs_path, 'w') as file:
        json.dump(envs, file, indent=4)
except Exception as e:
    print(f"Failed to write to environments file: {e}")