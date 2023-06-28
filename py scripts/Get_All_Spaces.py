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

def load_access_token(path):
    try:
        with open(path, 'r') as file:
            return json.load(file).get('access_token')
    except (FileNotFoundError, json.JSONDecodeError, KeyError):
        return None

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

url_spaces = "https://platform.flatfile.com/api/v1/spaces"
environments_path = os.path.join(script_dir, '..', 'environments.json')

with open(environments_path, 'r') as file:
    environments = json.load(file)

headers = {
    "Accept": "application/json",
    "Authorization": f"Bearer {accessToken}"
}

all_spaces = []

try:
    for environment in environments:
        environment_id = environment['ID']
        environment_name = environment['Name']
        querystring = {"environmentId": environment_id, "archived": "false"}

        response = requests.get(url_spaces, headers=headers, params=querystring)
        response.raise_for_status()

        spaces_data = response.json()['data']

        spaces = [space for space in spaces_data if space.get('id') and space.get('name')]

        formatted_spaces = [{
            "ID": space['id'],
            "Workbooks Count": space.get('workbooksCount', 'N/A'),
            "Created By User ID": space.get('createdByUserId', 'N/A'),
            "Created By User Name": space.get('createdByUserName', 'N/A'),
            "Space Config ID": space.get('spaceConfigId', 'N/A'),
            "Environment ID": space['environmentId'],
            "Environment Name": environment_name,
            "Name": space['name'],
            "Primary Workbook ID": space.get('primaryWorkbookId', 'N/A'),
            "Display Order": space.get('displayOrder', 'N/A'),
            "Access": space.get('access', 'N/A'),
            "Metadata": space.get('metadata', {})
        } for space in spaces]

        all_spaces.extend(formatted_spaces)

        if formatted_spaces:
            print(f"Environment ID: {environment_id} - Environment Name: {environment_name}\nSpaces:")
            for index, space in enumerate(formatted_spaces, start=1):
                print(f"   {index}. ID: {space['ID']}")
                print(f"      Name: {space['Name']}")
                print(f"      Workbooks Count: {space['Workbooks Count']}")
                print(f"      Created By User Name: {space['Created By User Name']}")
                print(f"      Created By User ID: {space['Created By User ID']}")
                print(f"      Space Config ID: {space['Space Config ID']}")
                print(f"      Environment ID: {space['Environment ID']}")
                print(f"      Environment Name: {space['Environment Name']}")
                print(f"      Primary Workbook ID: {space['Primary Workbook ID']}")
                print(f"      Display Order: {space['Display Order']}")
                print(f"      Access: {space['Access']}")
                print(f"      Metadata: {space['Metadata']}\n")

except requests.exceptions.RequestException as err:
    print(f"An error occurred: {err}")
    exit(1)

spaces_path = os.path.join(script_dir, '..', 'spaces.json')
with open(spaces_path, 'w') as file:
    json.dump(all_spaces, file, indent=2)

print(f"Successfully wrote {len(all_spaces)} spaces to {spaces_path}")