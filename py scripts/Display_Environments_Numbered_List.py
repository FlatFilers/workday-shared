import json
import os

def display_environments_numbered_list():
    # Get the current script directory and its parent directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(script_dir)

    # Construct the path to the environments.json file
    environments_file_path = os.path.join(parent_dir, "environments.json")

    with open(environments_file_path, "r") as f:
        data = json.load(f)
    
    for index, environment in enumerate(data, start=1):
        print(f"{index}. {environment['Name']}")

if __name__ == "__main__":
    display_environments_numbered_list()