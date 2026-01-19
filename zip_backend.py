import shutil
import os

def make_zip():
    # Define paths
    backend_dir = r"c:\Users\dear_\OneDrive\Desktop\filevora\backend"
    output_filename = r"c:\Users\dear_\OneDrive\Desktop\filevora\backend" # shutil.make_archive adds .zip automatically

    print(f"Zipping {backend_dir} to {output_filename}.zip...")
    
    # Create zip
    shutil.make_archive(output_filename, 'zip', backend_dir)
    
    print("Done!")

if __name__ == "__main__":
    make_zip()
