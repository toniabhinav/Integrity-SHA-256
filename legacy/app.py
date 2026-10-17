import hashlib
import streamlit as st

st.set_page_config(
    page_title="SecureFile — File Integrity Checker",
    page_icon="🔒",
    layout="centered"
)

st.title("SecureFile — File Integrity Checker")

st.markdown("""
This application detects changes in file contents by comparing their SHA-256 hash values.
SHA-256 is a cryptographic hash function that produces a unique fixed-size 256-bit signature for any given file.
""")

st.divider()

st.header("Select a File")
st.markdown("Choose a file to generate its SHA-256 hash.")

file = st.file_uploader(
    "Upload a file",
    type=None,
    help="Select any file from your computer"
)

st.divider()

st.header("Generated SHA-256 Hash")
st.markdown("The SHA-256 hash is displayed below. This 64-character hexadecimal string is unique to the file's contents.")

if file is not None:
    try:
        st.info("File selected: " + file.name)
        
        file_bytes = file.read()
        sha256_hash = hashlib.sha256(file_bytes).hexdigest()
        
        st.success("SHA-256 Hash:")
        st.code(sha256_hash, language=None)
        
        st.markdown("""
        **About this hash:**
        - This hash is calculated from the entire file contents
        - Any change to the file will produce a completely different hash
        - SHA-256 is widely used for file integrity verification
        """)
        
        if st.button("Save Reference Hash"):
            st.session_state.reference_hash = sha256_hash
            st.session_state.reference_filename = file.name
            st.success("Reference hash saved successfully!")
    except Exception as e:
        st.error(f"An error occurred while generating the hash: {e}")
else:
    st.info("No file selected yet. Please upload a file to generate its SHA-256 hash.")

st.divider()

st.header("Reference Hash")
if "reference_hash" in st.session_state:
    st.info(f"Reference file: {st.session_state.reference_filename}")
    st.success("Reference Hash:")
    st.code(st.session_state.reference_hash, language=None)
else:
    st.info("No reference hash saved yet. Upload a file and click 'Save Reference Hash' to set a baseline.")

st.divider()

st.header("Verify File Integrity")
st.markdown("Upload a file to verify against the saved reference hash.")

verify_file = st.file_uploader(
    "Upload file to verify",
    type=None,
    key="verify_uploader",
    help="Select the file you want to verify"
)

if st.button("Verify Integrity"):
    if "reference_hash" not in st.session_state:
        st.warning("Please save a reference hash first before verifying file integrity.")
    elif verify_file is None:
        st.warning("Please upload a file to verify.")
    else:
        try:
            verify_bytes = verify_file.read()
            verify_hash = hashlib.sha256(verify_bytes).hexdigest()
            
            if verify_hash == st.session_state.reference_hash:
                st.success("File Unchanged — Integrity Verified")
                st.info("The current file hash matches the reference hash. The file contents appear unchanged.")
            else:
                st.error("File Modified — Hash Mismatch")
                st.info("The current file hash does not match the reference hash. The file contents have changed.")
        except Exception as e:
            st.error(f"An error occurred during verification: {e}")
