# Unauthorized file detected
print('Suspicious script executed')


print("All files have been modified")

# make backup of all files
import shutil

shutil.copytree('test_files', 'test_files_backup')
