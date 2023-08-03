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

url_workbooks = "https://platform.flatfile.com/api/v1/workbooks"
spaces_path = os.path.join(script_dir, '..', 'spaces.json')

def load_spaces(path):
    try:
        with open(path, 'r') as file:
            return json.load(file)
    except (FileNotFoundError, json.JSONDecodeError, KeyError):
        return None

spaces = load_spaces(spaces_path)

if not spaces:
    print(f"Failed to load spaces from: {spaces_path}")
    exit(1)

headers = {
    "Accept": "application/json",
    "Authorization": f"Bearer {accessToken}"
}

all_workbooks = []

try:
    for space in spaces:
        space_id = space['ID']
        querystring = {"spaceId": space_id, "includeCounts": "true"}

        response = requests.get(url_workbooks, headers=headers, params=querystring)
        response.raise_for_status()

        workbooks_data = response.json()['data']

        workbooks = [workbook for workbook in workbooks_data if workbook.get('id') and workbook.get('name')]

        formatted_workbooks = [{
            "id": workbook['id'],
            "name": workbook['name'],
            "spaceId": space_id,
            "environmentId": workbook['environmentId'],
            "sheets": workbook['sheets'],
            "labels": workbook['labels'],
            "actions": workbook.get('actions', []),
            "updatedAt": workbook['updatedAt'],
            "createdAt": workbook['createdAt'],
            "namespace": workbook.get('namespace', '')
        } for workbook in workbooks]

        all_workbooks.extend(formatted_workbooks)

        if formatted_workbooks:
            print(f"Space ID: {space_id}\nWorkbooks:")
            for index, workbook in enumerate(formatted_workbooks, start=1):
                print(f"   {index}. ID: {workbook['id']}")
                print(f"      Name: {workbook['name']}")
                print(f"      Environment ID: {workbook['environmentId']}")
                print(f"      Space ID: {workbook['spaceId']}")
                print(f"      Sheets: {json.dumps(workbook['sheets'], indent=4)}")
                print(f"      Labels: {workbook['labels']}")
                print(f"      Actions: {json.dumps(workbook['actions'], indent=4)}")
                print(f"      Updated At: {workbook['updatedAt']}")
                print(f"      Created At: {workbook['createdAt']}")
                print(f"      Namespace: {workbook['namespace']}\n")

except requests.exceptions.RequestException as err:
    print(f"An error occurred: {err}")
    exit(1)

workbooks_path = os.path.join(script_dir, '..', 'workbooks.json')
with open(workbooks_path, 'w') as file:
    json.dump(all_workbooks, file, indent=2)

print(f"Successfully wrote {len(all_workbooks)} workbooks to {workbooks_path}")