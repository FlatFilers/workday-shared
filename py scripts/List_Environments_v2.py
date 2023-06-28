import requests
import json
import os
import subprocess
import argparse

# Parse command line arguments
parser = argparse.ArgumentParser(description='Control the subprocess generate_api_key.')
parser.add_argument('--skip_generate_api_key', action='store_true', default=False, help='Skip running Generate_API_Key_v3.py script')
parser.add_argument('--client_id', type=str, default=None, help='Default client ID')
parser.add_argument('--secret', type=str, default=None, help='Default secret')
args = parser.parse_args()

if args.client_id is None or args.secret is None:
    args.client_id = None
    args.secret = None

# Define the function to load access token
def load_access_token(path):
    try:
        with open(path, 'r') as file:
            return json.load(file).get('access_token')
    except (FileNotFoundError, json.JSONDecodeError, KeyError):
        return None

# Get the current script's directory
script_dir = os.path.dirname(os.path.abspath(__file__))

if not args.skip_generate_api_key:
    # Construct the path to the Generate_API_Key_v3.py script
    generate_api_key_path = os.path.join(script_dir, 'Generate_API_Key_v3.py')

    # Prepare the command to run the Generate_API_Key_v3.py script
    cmd = ['python', generate_api_key_path]
    if args.client_id and args.secret:
        cmd.extend(['--client_id', args.client_id, '--secret', args.secret])

    # Run the Generate_API_Key_v3.py script
    result = subprocess.run(cmd, capture_output=True, text=True)

    # Check if the script ran successfully
    if result.returncode != 0:
        print(f"Failed to run Generate_API_Key_v3.py script:\n{result.stderr}")
        exit(1)

# Construct the path to the access_token.json file located one level higher
accessToken_path = os.path.join(script_dir, '..', 'access_token.json')

# Load the access token
accessToken = load_access_token(accessToken_path)

if not accessToken:
    print(f"Failed to load access token from: {accessToken_path}")
    exit(1)

url = "https://platform.flatfile.com/api/v1/environments"

headers = {
    "Accept": "application/json",
    "Authorization": f"Bearer {accessToken}"
}

try:
    response = requests.get(url, headers=headers)
    response.raise_for_status()  # Will raise an exception for 4xx and 5xx status codes
except requests.exceptions.RequestException as err:
    print(f"An error occurred: {err}")
    exit(1)

# Parse the JSON response
response_data = response.json()
data = response_data['data']

environments = []

# Print the parsed response in a human-readable format
print(f"Environments for token {accessToken}:")
for index, environment in enumerate(data, start=1):
    env_data = {
        'ID': environment['id'],
        'Account ID': environment['accountId'],
        'Name': environment['name'],
        'Is Production': environment['isProd'],
        'Guest Authentication': ', '.join(environment['guestAuthentication']),
        'Features': environment['features']
    }
    
    environments.append(env_data)
    
    print(f"{index}. ID: {env_data['ID']}")
    print(f"   Account ID: {env_data['Account ID']}")
    print(f"   Name: {env_data['Name']}")
    print(f"   Is Production: {env_data['Is Production']}")
    print(f"   Guest Authentication: {env_data['Guest Authentication']}")
    print(f"   Features: {env_data['Features']}\n")

print("---------------------------")

# Construct the path to the environments.json file located one level higher
environments_path = os.path.join(script_dir, '..', 'environments.json')

# Write the environments to a JSON file
with open(environments_path, 'w') as file:
    json.dump(environments, file, indent=4)