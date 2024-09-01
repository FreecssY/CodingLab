document.addEventListener('DOMContentLoaded', () => {
    createFormAndDragAndDropArea();
});

let errorTimeout; // Global variable to hold the timeout ID

function createFormAndDragAndDropArea() {
    // Create the form
    const form = document.createElement('form');
    form.id = 'uploadForm';
    form.onsubmit = handleSubmit;

    // Create container for custom input
    const container = document.createElement('div');
    container.classList.add('drag-image');

    // Create and setup the drag & drop label
    const label = document.createElement('h6');
    label.textContent = 'Drop your file here...';
    container.appendChild(label);

    // Create and setup the "OR" span
    const span = document.createElement('span');
    span.textContent = 'or';
    container.appendChild(span);

    // Create and setup the button
    const fileChooseButton = document.createElement('button');
    fileChooseButton.textContent = 'Choose a file';
    fileChooseButton.type = 'button';
    container.appendChild(fileChooseButton);

    // Create and setup the hidden file input
    const input = document.createElement('input');
    input.type = 'file';
    input.hidden = true;
    input.id = 'file';
    input.name = 'file';
    input.required = true;
    input.accept = '.csv, .xls, .xlsx, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    input.multiple = true; // Allow multiple files
    container.appendChild(input);

    // Button triggers hidden input
    fileChooseButton.onclick = () => {
        input.click();
    };

    // Event listeners for drag and drop
    addDragAndDropListeners(input, fileChooseButton);

    const fileNameDisplay = document.createElement('div');
    fileNameDisplay.id = 'fileNameDisplay';
    fileNameDisplay.classList.add('file-list-container');
    container.appendChild(fileNameDisplay);

    // Append the container to the form
    form.appendChild(container);

    // Create a button for downloading files
    const downloadButton = document.createElement('button');
    downloadButton.textContent = 'Download files';
    downloadButton.type = 'submit';
    downloadButton.style.marginTop = '20px';
    downloadButton.disabled = true; // Disable until files are uploaded
    form.appendChild(downloadButton);

    // Append the form to the body
    document.body.appendChild(form);

    // Modify the input's change event listener
    input.addEventListener('change', function () {
        handleFiles(this.files);
    });
}

function addDragAndDropListeners(fileInput, fileChooseButton) {
    const container = fileInput.closest('.drag-image'); // Get the custom container
    let dragDepth = 0; // This counter tracks the depth of the drag

    container.addEventListener('dragover', handleDragOver, false);
    container.addEventListener('drop', handleDrop, false);
    container.addEventListener('dragenter', handleDragEnter, false);
    container.addEventListener('dragleave', handleDragLeave, false);

    function handleDragOver(e) {
        e.preventDefault();
    }

    function handleDragEnter(e) {
        e.preventDefault();
        dragDepth++; // Increment drag depth counter
        container.classList.add('active'); // Visually indicate drag over
        container.querySelector('h6').textContent = 'Release to drop';
    }

    function handleDragLeave(e) {
        e.preventDefault();
        dragDepth--; // Decrement drag depth counter
        if (dragDepth === 0) { // Only deactivate if all drags have left the element
            container.classList.remove('active');
            container.querySelector('h6').textContent = 'Drop your file here...';
        }
    }

    function handleDrop(e) {
        e.preventDefault();
        dragDepth = 0;
        container.classList.remove('active');
        container.querySelector('h6').textContent = 'Drop your file here...';
        const files = e.dataTransfer.files;
        const items = e.dataTransfer.items;

        // Check if a folder is being dropped
        if (items[0].webkitGetAsEntry().isDirectory) {
            showError(container, 'Folders are not allowed.', fileChooseButton);
            return;
        }

        fileInput.files = files; // Assign dropped files to hidden input
        handleFiles(files);
    }
}

function handleFiles(files) {
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const acceptedExtensions = ['.csv', '.xls', '.xlsx'];
    const fileChooseButton = document.querySelector('button[type="button"]');

    let validFiles = [];
    let invalidFiles = false;

    Array.from(files).forEach(file => {
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        if (!acceptedExtensions.includes(fileExtension)) {
            invalidFiles = true;
        } else {
            validFiles.push(file);
        }
    });

    if (invalidFiles) {
        const container = document.querySelector('.drag-image');
        showError(container, 'Invalid file. Please upload a CSV or Excel file.', fileChooseButton);
        clearFileInput();
        updateFileListDisplay([]); // Clear file list display
        return;
    }

    // If valid files are imported while showing an error, clear the error timeout
    if (errorTimeout) {
        clearTimeout(errorTimeout);
        resetErrorDisplay(container, fileChooseButton);
    }

    updateFileListDisplay(validFiles);
}

function updateFileListDisplay(files) {
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const downloadButton = document.querySelector('button[type="submit"]');

    fileNameDisplay.innerHTML = ''; // Clear previous content

    if (files.length > 0) {
        // Show the number of files
        const fileCount = document.createElement('p');
        fileCount.textContent = `${files.length} files selected`;
        fileNameDisplay.appendChild(fileCount);

        // Create a container for the file list with a max height for scrolling
        const fileListContainer = document.createElement('div');
        fileListContainer.classList.add('file-list');

        files.forEach(file => {
            const fileItem = createFileItem(file);
            fileListContainer.appendChild(fileItem);
        });

        fileNameDisplay.appendChild(fileListContainer);
        downloadButton.disabled = false; // Enable the button when files are present
    } else {
        downloadButton.disabled = true; // Disable the button when no files are present
    }
}

function createFileItem(file) {
    const fileItem = document.createElement('div');
    fileItem.classList.add('file-item');

    const fileName = document.createElement('span');
    fileName.textContent = file.name;
    fileItem.appendChild(fileName);

    const removeButton = document.createElement('button');
    removeButton.textContent = 'x';
    removeButton.classList.add('remove-file-btn');
    removeButton.onclick = () => removeFile(file);
    fileItem.appendChild(removeButton);

    return fileItem;
}

function removeFile(fileToRemove) {
    const input = document.getElementById('file');
    const dataTransfer = new DataTransfer();

    Array.from(input.files).forEach(file => {
        if (file !== fileToRemove) {
            dataTransfer.items.add(file);
        }
    });

    input.files = dataTransfer.files;
    handleFiles(input.files);
}

function clearFileInput() {
    const input = document.getElementById('file');
    input.value = ''; // Clear the file input
}

function showError(container, message, fileChooseButton) {
    const originalText = container.querySelector('h6').textContent; // Save original text
    const errorIcon = '<i class="fas fa-exclamation-triangle"></i> '; // Danger icon using Font Awesome
    container.querySelector('h6').innerHTML = `${errorIcon}${message}`; // Set error message with icon
    container.style.borderColor = 'red'; // Set border color to red
    fileChooseButton.style.backgroundColor = '#e63946'; // Set "Choose a file" button to red

    // Set the timeout for resetting the error display
    errorTimeout = setTimeout(() => {
        resetErrorDisplay(container, fileChooseButton);
    }, 1500);

    // console.error(message); // Log error to console
}

function resetErrorDisplay(container, fileChooseButton) {
    container.style.borderColor = ''; // Reset border color
    container.querySelector('h6').textContent = 'Drop your file here...'; // Reset text to original
    fileChooseButton.style.backgroundColor = ''; // Reset button color
    errorTimeout = null; // Clear the error timeout
}

function handleSubmit(event) {
    event.preventDefault(); // Prevent the form from submitting normally

    const input = document.getElementById('file');
    if (input.files.length === 0) {
        return; // No files to download
    }
    downloadFiles(input.files);
}

function downloadFiles(files) {
    Array.from(files).forEach(file => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(file);
        a.download = file.name;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });
}
