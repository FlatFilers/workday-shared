import requests
import json
import os
import subprocess

# Define the function to load access token
def load_access_token(path):
    try:
        with open(path, 'r') as file:
            return json.load(file).get('access_token')
    except (FileNotFoundError, json.JSONDecodeError, KeyError):
        return None

# Get the current script's directory
script_dir = os.path.dirname(os.path.abspath(__file__))

# Construct the path to the Generate_API_Key_v3.py script
generate_api_key_path = os.path.join(script_dir, 'Generate_API_Key_v3.py')

# Run the Generate_API_Key_v3.py script
result = subprocess.run(['python', generate_api_key_path], capture_output=True, text=True)

# Check if the script ran successfully
if result.returncode != 0:
    print(f"Failed to run Generate_API_Key_v3.py script:\n{result.stderr}")
    exit(1)

# Construct the path to the access_token.json file located one level higher
access_token_path = os.path.join(script_dir, '..', 'access_token.json')

# Load the access token
access_token = load_access_token(access_token_path)

if not access_token:
    print(f"Failed to load access token from: {access_token_path}")
    exit(1)

url = "https://platform.flatfile.com/api/v1/users"

# Prompt the user to enter an email
email = input("Enter a specific email to return, or just hit ENTER to fetch all users: ")

querystring = {}
if email:
    querystring["email"] = email

headers = {
    "Accept": "application/json",
    "Authorization": f"Bearer {access_token}"
}

try:
    response = requests.get(url, headers=headers, params=querystring)
    response.raise_for_status()  # Will raise an exception for 4xx and 5xx status codes
except requests.exceptions.HTTPError as err:
    if response.status_code == 400:
        print("Invalid request, please check your parameters.")
    elif response.status_code == 404:
        print("Requested resource not found.")
    else:
        print(f"An error occurred: {err}")
    exit(1)
except requests.exceptions.RequestException as err:
    print(f"An error occurred: {err}")
    exit(1)

# Parse the JSON response
data = response.json()['data']

# Construct the path to the Users.json file located one level higher
users_path = os.path.join(script_dir, '..', 'Users.json')

# Write the users to a JSON file
with open(users_path, 'w') as file:
    json.dump(data, file, indent=4)

# Print the parsed response in a human-readable format
print("\nFetched Users:")
for index, user in enumerate(data, start=1):
    print(f"{index}. ID: {user['id']}")
    print(f"   Email: {user['email']}")
    print(f"   Name: {user['name']}")
    print(f"   Account ID: {user['accountId']}\n")

print(f"\nFetched user data has been written to: {users_path}")