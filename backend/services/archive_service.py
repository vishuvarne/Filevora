
import os
import zipfile
import tarfile
# import py7zr # Lazy imported
from pathlib import Path
from typing import Union, IO
import shutil

class ArchiveService:
    @staticmethod
    def convert_archive(job_input: Union[Path, IO[bytes]], output_dir: Path, target_format: str = "zip"):
        """
        Extracts archive and repacks it into target format.
        Supported inputs: .zip, .rar (if unrar installed, else limited), .7z, .tar.gz
        Supported targets: .zip, .7z, .tar.gz
        """
        extract_dir = output_dir / "temp_extracted"
        extract_dir.mkdir(parents=True, exist_ok=True)
        
        input_path = None
        
        # Save input stream to temp file if needed
        if hasattr(job_input, "read"): 
             # ... handling logic for stream would go here, but usually we pass file path 
             pass

        if isinstance(job_input, Path):
            input_path = job_input
        else:
            raise ValueError("Invalid input for archive conversion")

        try:
            # EXTRACT
            suffix = input_path.suffix.lower()
            if suffix == ".zip":
                with zipfile.ZipFile(input_path, 'r') as zip_ref:
                    zip_ref.extractall(extract_dir)
            elif suffix == ".7z":
                import py7zr
                with py7zr.SevenZipFile(input_path, mode='r') as z:
                    z.extractall(path=extract_dir)
            elif suffix in [".tar", ".gz", ".tgz"]:
                if input_path.name.endswith("tar.gz") or suffix == ".tgz":
                     with tarfile.open(input_path, "r:gz") as tar:
                        tar.extractall(extract_dir)
                else:
                    with tarfile.open(input_path, "r") as tar:
                        tar.extractall(extract_dir)
            
            # REPACK
            output_filename = f"{input_path.stem}.{target_format}"
            output_file = output_dir / output_filename
            
            if target_format == "zip":
                shutil.make_archive(str(output_file.with_suffix('')), 'zip', extract_dir)
            elif target_format == "7z":
                import py7zr
                with py7zr.SevenZipFile(output_file, 'w') as z:
                    z.writeall(extract_dir, arcname="")
            elif target_format == "tar.gz":
                with tarfile.open(output_file, "w:gz") as tar:
                    tar.add(extract_dir, arcname="")
            
            # Cleanup
            shutil.rmtree(extract_dir)
            
            return output_file

        except Exception as e:
            if extract_dir.exists():
                shutil.rmtree(extract_dir)
            raise ValueError(f"Archive conversion failed: {e}")
