import json
import sys
import subprocess
import os

def read_environment_secret(environment):
    script_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(script_dir)

    # Construct the path to environments.json in the parent directory
    environments_file_path = os.path.join(parent_dir, "environments.json")
    with open(environments_file_path, "r") as f:
        environments = json.load(f)

    env = None
    for e in environments:
        if e["Name"] == environment:
            env = e
            break

    if not env:
        print(f"Environment '{environment}' not found.")
        return

    secret_key = env.get("SECRET_KEY")
    if not secret_key:
        print("SECRET key not found. Running obtain_api_keys_environments.py...")
        subprocess.run(["python", "obtain_api_keys_environments.py"])

        # Reload the environments after running the script
        with open(environments_file_path, "r") as f:
            environments = json.load(f)
        for e in environments:
            if e["Name"] == environment:
                env = e
                break
        secret_key = env.get("SECRET_KEY")

    print(f"Secret key for environment '{environment}': {secret_key}")
    
    # Write the secret key to a file
    with open("secret_key.txt", "w") as f:
        f.write(secret_key)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        environment = sys.argv[1]
    else:
        print("Please provide an environment name.")
        environment = input("Enter environment name: ")
    read_environment_secret(environment)