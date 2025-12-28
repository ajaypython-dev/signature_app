import os

def create_file(path: str):
    """
    Creates an empty file if it does not already exist.
    """
    if not os.path.exists(path):
        with open(path, "w", encoding="utf-8") as f:
            pass  # intentionally creating an empty file

def create_secure_sign_structure(base_path: str = "src"):
    """
    Creates the SecureSign React project folder structure.
    """

    directories = [
        os.path.join(base_path, "components", "Admin"),
        os.path.join(base_path, "components", "User"),
        os.path.join(base_path, "components", "PDF"),
        os.path.join(base_path, "pages"),
        os.path.join(base_path, "styles"),
    ]

    files = [
        os.path.join(base_path, "components", "Admin", "DraggableField.jsx"),
        os.path.join(base_path, "components", "User", "SignaturePad.jsx"),
        os.path.join(base_path, "components", "PDF", "PDFViewer.jsx"),
        os.path.join(base_path, "pages", "AdminDashboard.jsx"),
        os.path.join(base_path, "pages", "UserSigning.jsx"),
        os.path.join(base_path, "styles", "SecureSign.css"),
        os.path.join(base_path, "App.js"),
        os.path.join(base_path, "index.js"),
    ]

    # Create directories
    for directory in directories:
        os.makedirs(directory, exist_ok=True)

    # Create files
    for file_path in files:
        create_file(file_path)

    print("✅ SecureSign project structure created successfully.")

if __name__ == "__main__":
    create_secure_sign_structure()
