# File Integrity Checker Using SHA-256

A simple Python application that detects changes in file contents by comparing their SHA-256 hash values. This project is for the Information and Network Security subject.

## Technology Stack

- Python
- Streamlit for the user interface
- Python's built-in `hashlib` library for SHA-256 hashing

## Project Structure

```
integrity-sha256/
├── app.py              # Main Streamlit application
├── requirements.txt    # Project dependencies
└── README.md          # Project documentation
```

## Setup Instructions

### Prerequisites

- Python 3.8 or higher installed on your system
- Windows PowerShell

### Installation

1. Open PowerShell and navigate to the project directory:
   ```powershell
   cd "C:\Users\abhin\Downloads\Integrity SHA-256"
   ```

2. Create a virtual environment (recommended):
   ```powershell
   python -m venv venv
   ```

3. Activate the virtual environment:
   ```powershell
   .\venv\Scripts\Activate.ps1
   ```

4. Install dependencies:
   ```powershell
   pip install -r requirements.txt
   ```

## Running the Application

Run the application using the following command:

```powershell
streamlit run app.py
```

The application will open in your default web browser at `http://localhost:8501`.

## Features (To be Implemented Step by Step)

- Step 1: Project setup and basic application structure ✓
- Step 2: SHA-256 hash generation for selected files ✓
- Step 3: File comparison and integrity verification ✓
- Step 4: Additional enhancements

## Current Functionality

### SHA-256 Hash Generation
- Select any file from your computer using the file uploader
- The application calculates the SHA-256 hash of the file's contents
- The hash is displayed as a 64-character hexadecimal string
- Both text files and binary files are supported
- Errors are handled gracefully without crashing the application

### File Integrity Verification
- Save a reference hash from an original file as a baseline
- Upload a file to verify against the saved reference hash
- Compare hashes to detect whether file contents have changed
- Display clear status messages: "File Unchanged — Integrity Verified" or "File Modified — Hash Mismatch"
- Reference hash persists during the current Streamlit session

### How to Use - Complete Workflow

1. **Run the application:**
   ```powershell
   streamlit run app.py
   ```

2. **Generate a hash for the original file:**
   - Click "Browse files" in the "Select a File" section
   - Choose the original file from your computer
   - The SHA-256 hash will be displayed

3. **Save the reference hash:**
   - Click the "Save Reference Hash" button
   - The hash and filename are saved in the current session
   - The reference hash appears in the "Reference Hash" section

4. **Verify file integrity:**
   - Modify the file or select another version to test
   - Upload the file to verify in the "Verify File Integrity" section
   - Click "Verify Integrity"
   - The application compares the hashes and displays the result

5. **Interpret the result:**
   - "File Unchanged — Integrity Verified": The hash matches, contents appear unchanged
   - "File Modified — Hash Mismatch": The hash differs, contents have changed

### Important Notes
- Matching hashes provide strong evidence that contents are unchanged, but do not prove authenticity or guarantee absolute impossibility of a collision
- The application does not detect who modified a file or when it was modified
- Reference hashes are stored only in the current session and are lost when the browser is closed
- The comparison is based on the complete hexadecimal hash strings, not filenames

## Project Description

This application provides a simple interface to:
- Select files from your computer
- Generate SHA-256 hash values
- Compare hashes to detect file modifications
- Verify file integrity

The SHA-256 algorithm ensures that even a single bit change in the file will result in a completely different hash value, making it an effective tool for detecting unauthorized modifications.
