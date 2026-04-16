import os

base_dir = os.path.dirname(os.path.abspath(__file__))
output_file = os.path.join(base_dir, "output.txt")

with open(output_file, "w", encoding="utf-8", errors="ignore") as out:
    for root, dirs, files in os.walk(base_dir):
        for file in files:
            path = os.path.join(root, file)

            if path == output_file:
                continue

            try:
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    out.write(f"===== {path} =====\n")
                    out.write(f.read())
                    out.write("\n\n")
            except:
                pass

print("Gotowe! output.txt jest w tym samym folderze co skrypt.")
input()