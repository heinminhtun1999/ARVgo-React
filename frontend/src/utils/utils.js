export function validateFile(files) {
    const fileArray = Array.from(files);

    if (fileArray.length === 0) return;

    // Check for file size limit (20MB)
    const validFiles = [];
    const invalidFiles = [];

    fileArray.forEach((file, i) => {
        if (file.size <= 20 * 1024 * 1024) {
            validFiles.push(file);
        } else {
            invalidFiles.push(file.name);
        }
    })

    return [validFiles, invalidFiles];
}

export function debounce(fn, delay) {
    let timeout;

    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
    }
}