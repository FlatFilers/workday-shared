import requests
import json
import os
import subprocess

# Call the List_Environments.py script and suppress its output
subprocess.run(['python', 'List_Environments.py'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

# Get the current script's directory
script_dir = os.path.dirname(os.path.abspath(__file__))

# Construct the path to the access_token.json, environments.json and subscription_tokens.json files
token_path = os.path.join(script_dir, '..', 'access_token.json')
envs_path = os.path.join(script_dir, '..', 'environments.json')
subs_path = os.path.join(script_dir, '..', 'subscription_tokens.json')

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

subscription_tokens = []

# Query each environment's subscription token
for env in envs:
    # Construct the API request
    url = "https://platform.flatfile.com/api/v1/environments/subscription-token"
    querystring = {"environmentId": env['ID']}
    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {token}"
    }

    response = requests.get(url, headers=headers, params=querystring)

    # Check the response
    if response.status_code == 200:
        print(f"Retrieved subscription token for environment '{env['Name']}'")
        resp_data = response.json()['data']
        subscription_tokens.append({
            'Name': env['Name'],
            'Environment_ID': env['ID'],
            'Account_ID': resp_data.get('accountId'),
            'Subscribe_Key': resp_data.get('subscribeKey'),
            'TTL': resp_data.get('ttl'),
            'SubscriptionToken': resp_data.get('token')
        })
    else:
        print(f"Failed to get subscription token for environment '{env['Name']}': {response.json()}")

# Write the subscription tokens to the subscription_tokens.json file
try:
    with open(subs_path, 'w') as file:
        json.dump(subscription_tokens, file, indent=4)
except Exception as e:
    print(f"Failed to write to subscription tokens file: {e}")