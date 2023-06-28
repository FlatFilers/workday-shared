import json
import sys

def get_environment_by_index(index):
    with open('../environments.json', 'r') as f:
        environments = json.load(f)

    if 1 <= index <= len(environments):
        selected_environment = environments[index - 1]
        return selected_environment['Name']
    else:
        return None

if __name__ == "__main__":
    if len(sys.argv) > 1:
        index = int(sys.argv[1])
        environment_name = get_environment_by_index(index)
        if environment_name:
            with open('selected_environment.txt', 'w') as f:
                f.write(environment_name)
            print(f"Selected environment: {environment_name}")
        else:
            print("Invalid index. Please provide a valid index.")
    else:
        print("Please provide an index as an argument.")