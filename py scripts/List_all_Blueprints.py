import os
import csv
import argparse

# Function to convert a string to proper case
def to_proper_case(s):
    return ' '.join(word.capitalize() for word in s.split())

# Function to list all blueprints
def list_all_blueprints(directory):
    blueprint_list = []

    # Walk through the directory and subdirectories
    for root, dirs, files in os.walk(directory):
        # Ignore directories that start with underscore
        if not os.path.basename(root).startswith('_'):
            for file in files:
                if 'blueprint' in file:
                    # Extract the name, replace underscores with spaces, and convert to proper case
                    name = to_proper_case(file.split('blueprint')[0].replace('_', ' ').strip())
                    parent_folder = os.path.basename(root)
                    blueprint_list.append((name, file, parent_folder))

    # Write the list to a csv file
    with open('../blueprints_list.csv', 'w', newline='') as f:
        writer = csv.writer(f)
        for item in blueprint_list:
            writer.writerow(item)

    print('Blueprint list has been saved to blueprints_list.csv')

# Main function
def main():
    parser = argparse.ArgumentParser(description="List all blueprints")
    parser.add_argument('-d', '--dir', default='../Blueprints', help='Directory to search for blueprint files')
    args = parser.parse_args()

    list_all_blueprints(args.dir)

# Run the script
if __name__ == "__main__":
    main()