import yaml

# This defines the correct structure
data = {
    'path': r'C:\Users\linus\.vscode\ROAD\OBJECTVAT\dataset_obj',  # Your dataset root
    'train': r'images\train',  # Path to train images (relative to above)
    'val': r'images\val',      # Path to val images (relative to above)
    'names': {
        0: 'Vehicles',
        1: 'Signs',
        2: 'Pedestrians'
    }
}

# Write the correct YAML file
output_path = r'C:\Users\linus\.vscode\ROAD\OBJECTVAT\objectvat.yaml'

with open(output_path, 'w') as file:
    yaml.dump(data, file)

print(f"SUCCESS: Fixed {output_path}")
print("You can now run your training command.")