import sys
import json
import os

def check_environment_exists(environment):
    # Get the current script directory and its parent directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(script_dir)

    # Construct the path to environments.json in the parent directory
    environments_file_path = os.path.join(parent_dir, "environments.json")

    with open(environments_file_path, "r") as f:
        data = json.load(f)
    
    environment_exists = 0
    for env in data:
        if env["Name"] == environment:
            environment_exists = 1
            break
    
    with open("environment_exists.txt", "w") as f:
        f.write(str(environment_exists))

if __name__ == "__main__":
    if len(sys.argv) > 1:
        environment = sys.argv[1]
    else:
        print("Please provide an environment name.")
        environment = input("Enter environment name: ")

    check_environment_exists(environment)