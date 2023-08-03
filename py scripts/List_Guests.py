import requests
import json
import os
import subprocess

def load_json_file(path):
    try:
        with open(path, 'r') as file:
            return json.load(file)
    except (FileNotFoundError, json.JSONDecodeError):
        return None

script_dir = os.path.dirname(os.path.abspath(__file__))

# Run the Generate_API_Key_v3.py script
generate_api_key_path = os.path.join(script_dir, 'Generate_API_Key_v3.py')
result = subprocess.run(['python', generate_api_key_path], capture_output=True, text=True)

# Check if the script ran successfully
if result.returncode != 0:
    print(f"Failed to run Generate_API_Key_v3.py script:\n{result.stderr}")
    exit(1)

# Construct the path to the access_token.json file located one level higher
access_token_path = os.path.join(script_dir, '..', 'access_token.json')

access_token = load_json_file(access_token_path).get('access_token')

if not access_token:
    print(f"Failed to load access token from: {access_token_path}")
    exit(1)

spaces_path = os.path.join(script_dir, '..', 'spaces.json')
spaces = load_json_file(spaces_path)

if not spaces:
    print(f"Failed to load spaces from: {spaces_path}")
    exit(1)

url = "https://platform.flatfile.com/api/v1/guests"

email = input("Enter a specific email to filter, or just hit ENTER to fetch all guests: ")

headers = {
    "Accept": "application/json",
    "Authorization": f"Bearer {access_token}"
}

guests = []

for space in spaces:
    querystring = {"spaceId": space["ID"]}
    if email:
        querystring["email"] = email

    try:
        response = requests.get(url, headers=headers, params=querystring)
        response.raise_for_status()
        data = response.json()['data']
        guests.extend(data)
    except requests.exceptions.HTTPError as err:
        print(f"An error occurred for space ID {space['ID']}: {err}")
    except requests.exceptions.RequestException as err:
        print(f"An error occurred for space ID {space['ID']}: {err}")

# Sort guests by Environment, Space ID, and then Guest ID
sorted_guests = sorted(guests, key=lambda g: (g["spaces"][0]["id"], g["id"]))

# Count guests in each environment and space
guest_count = {}
for guest in sorted_guests:
    space = next((s for s in spaces if s["ID"] == guest["spaces"][0]["id"]), None)
    env_id = space["Environment ID"] if space else "Unknown"

    if env_id not in guest_count:
        guest_count[env_id] = {}

    space_id = guest["spaces"][0]["id"]

    if space_id not in guest_count[env_id]:
        guest_count[env_id][space_id] = 0

    guest_count[env_id][space_id] += 1

guests_path = os.path.join(script_dir, '..', 'Guests.json')

with open(guests_path, 'w') as file:
    json.dump(guests, file, indent=4)

print("\nGuest Count:")
for env_id, spaces_dict in guest_count.items():
    env_name = next((s["Environment Name"] for s in spaces if s["Environment ID"] == env_id), "Unknown")
    print(f"Environment ID: {env_id} (Name: {env_name})")
    for space_id, count in spaces_dict.items():
        space_name = next((s["Name"] for s in spaces if s["ID"] == space_id), "Unknown")
        print(f"  Space ID {space_id} (Name: {space_name}): {count} guests")

print("\nFetched Guests:")
for index, guest in enumerate(guests, start=1):
    space = next((s for s in spaces if s["ID"] == guest["spaces"][0]["id"]), None)
    space_name = space.get("Name", "Unknown")
    environment_id = space["Environment ID"] if space else "Unknown"
    environment_name = space["Environment Name"] if space else "Unknown"

    print(f"{index}. ID: {guest['id']}")
    print(f"   Email: {guest['email']}")
    print(f"   Name: {guest['name']}")

    # Access the nested "id" field inside the "spaces" list
    spaces_list = guest.get("spaces", [])
    if spaces_list:
        space_id = spaces_list[0]["id"]
        print(f"   Space ID: {space_id} (Name: {space_name})")
    else:
        print("   No spaces found for this guest.")

    print(f"   Environment ID: {environment_id} (Name: {environment_name})\n")

print(f"\nFetched guest data has been written to: {guests_path}")