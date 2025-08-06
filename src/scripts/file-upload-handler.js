import backendApiService from './backend-api-service.js';

class FileUploadHandler {
    constructor() {
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.allowedTypes = [
            'image/jpeg',
            'image/png',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        this.allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx'];
        this.uploadQueue = [];
        this.uploadProgress = new Map();
    }

    // File Validation
    validateFile(file) {
        const errors = [];

        // Check file size
        if (file.size > this.maxFileSize) {
            errors.push(`File "${file.name}" is too large. Maximum size is ${this.formatFileSize(this.maxFileSize)}`);
        }

        // Check file type
        if (!this.allowedTypes.includes(file.type)) {
            const extension = '.' + file.name.split('.').pop().toLowerCase();
            if (!this.allowedExtensions.includes(extension)) {
                errors.push(`File "${file.name}" has an unsupported format. Allowed formats: ${this.allowedExtensions.join(', ')}`);
            }
        }

        // Check file name
        if (file.name.length > 255) {
            errors.push(`File name "${file.name}" is too long. Maximum 255 characters.`);
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // Single File Upload
    async uploadSingleFile(file, metadata = {}) {
        try {
            // Validate file
            const validation = this.validateFile(file);
            if (!validation.isValid) {
                throw new Error(validation.errors.join(', '));
            }

            // Create upload progress tracking
            const uploadId = this.generateUploadId();
            this.uploadProgress.set(uploadId, { progress: 0, status: 'starting' });

            // Show upload progress UI
            this.showUploadProgress(uploadId, file.name);

            // Prepare metadata
            const uploadMetadata = {
                ...metadata,
                file_name: file.name,
                file_size: file.size,
                file_type: file.type,
                upload_date: new Date().toISOString()
            };

            // Update progress
            this.updateUploadProgress(uploadId, 10, 'uploading');

            // Upload file
            const result = await this.uploadWithProgress(file, uploadMetadata, uploadId);

            if (result.success) {
                this.updateUploadProgress(uploadId, 100, 'completed');
                setTimeout(() => this.hideUploadProgress(uploadId), 2000);
                return result;
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            console.error('Single file upload error:', error);
            this.updateUploadProgress(uploadId, 0, 'error');
            this.showNotification(`Upload failed: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }

    // Multiple Files Upload
    async uploadMultipleFiles(files, metadata = {}) {
        const results = [];
        const errors = [];

        // Validate all files first
        for (const file of files) {
            const validation = this.validateFile(file);
            if (!validation.isValid) {
                errors.push(...validation.errors);
            }
        }

        if (errors.length > 0) {
            this.showNotification(`Upload validation failed:\n${errors.join('\n')}`, 'error');
            return { success: false, errors: errors };
        }

        // Upload files concurrently (max 3 at a time)
        const batchSize = 3;
        for (let i = 0; i < files.length; i += batchSize) {
            const batch = files.slice(i, i + batchSize);
            const batchPromises = batch.map(file => this.uploadSingleFile(file, metadata));
            
            try {
                const batchResults = await Promise.all(batchPromises);
                results.push(...batchResults);
            } catch (error) {
                console.error('Batch upload error:', error);
                errors.push(error.message);
            }
        }

        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);

        if (successful.length > 0) {
            this.showNotification(`${successful.length} file(s) uploaded successfully`, 'success');
        }

        if (failed.length > 0) {
            this.showNotification(`${failed.length} file(s) failed to upload`, 'error');
        }

        return {
            success: successful.length > 0,
            results: results,
            successful: successful,
            failed: failed
        };
    }

    // Upload with Progress Tracking
    async uploadWithProgress(file, metadata, uploadId) {
        return new Promise((resolve) => {
            const formData = new FormData();
            formData.append('file', file);
            
            // Add metadata to form data
            Object.keys(metadata).forEach(key => {
                formData.append(key, metadata[key]);
            });

            const xhr = new XMLHttpRequest();

            // Track upload progress
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const progress = Math.round((e.loaded / e.total) * 100);
                    this.updateUploadProgress(uploadId, progress, 'uploading');
                }
            });

            // Handle completion
            xhr.addEventListener('load', () => {
                try {
                    const response = JSON.parse(xhr.responseText);
                    if (xhr.status === 200 || xhr.status === 201) {
                        resolve({
                            success: true,
                            data: response
                        });
                    } else {
                        resolve({
                            success: false,
                            error: response.message || 'Upload failed'
                        });
                    }
                } catch (error) {
                    resolve({
                        success: false,
                        error: 'Invalid server response'
                    });
                }
            });

            // Handle errors
            xhr.addEventListener('error', () => {
                resolve({
                    success: false,
                    error: 'Network error during upload'
                });
            });

            // Handle abort
            xhr.addEventListener('abort', () => {
                resolve({
                    success: false,
                    error: 'Upload was cancelled'
                });
            });

            // Get auth token and make request
            const token = localStorage.getItem('token');
            xhr.open('POST', backendApiService.uploadsUrl);
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            
            xhr.send(formData);
        });
    }

    // File Deletion
    async deleteFile(fileId) {
        try {
            const result = await backendApiService.deleteFile(fileId);
            
            if (result.success) {
                this.showNotification('File deleted successfully', 'success');
                return result;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('File deletion error:', error);
            this.showNotification(`Failed to delete file: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }

    // Drag and Drop Support
    setupDragAndDrop(dropZone, callback) {
        if (typeof dropZone === 'string') {
            dropZone = document.querySelector(dropZone);
        }

        if (!dropZone) {
            console.warn('Drop zone element not found');
            return;
        }

        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        // Highlight drop zone on drag over
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.add('drag-over');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.remove('drag-over');
            });
        });

        // Handle dropped files
        dropZone.addEventListener('drop', (e) => {
            const files = Array.from(e.dataTransfer.files);
            if (callback) {
                callback(files);
            } else {
                this.uploadMultipleFiles(files);
            }
        });

        // Add CSS for drag over state
        this.addDragDropStyles();
    }

    addDragDropStyles() {
        if (document.querySelector('#drag-drop-styles')) return;

        const style = document.createElement('style');
        style.id = 'drag-drop-styles';
        style.textContent = `
            .drag-over {
                border: 2px dashed #525EB1 !important;
                background-color: #f0f2ff !important;
            }
            
            .file-drop-zone {
                border: 2px dashed #ddd;
                border-radius: 8px;
                padding: 40px;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .file-drop-zone:hover {
                border-color: #525EB1;
                background-color: #f9f9ff;
            }
        `;
        document.head.appendChild(style);
    }

    // Progress UI Management
    showUploadProgress(uploadId, fileName) {
        const progressContainer = this.getOrCreateProgressContainer();
        
        const progressItem = document.createElement('div');
        progressItem.id = `upload-${uploadId}`;
        progressItem.className = 'upload-progress-item';
        progressItem.innerHTML = `
            <div class="upload-file-name">${fileName}</div>
            <div class="upload-progress-bar">
                <div class="upload-progress-fill" style="width: 0%"></div>
            </div>
            <div class="upload-status">Starting...</div>
            <button class="upload-cancel" onclick="fileUploadHandler.cancelUpload('${uploadId}')" title="Cancel Upload">×</button>
        `;

        progressContainer.appendChild(progressItem);
        this.addProgressStyles();
    }

    updateUploadProgress(uploadId, progress, status) {
        const progressItem = document.getElementById(`upload-${uploadId}`);
        if (!progressItem) return;

        const progressFill = progressItem.querySelector('.upload-progress-fill');
        const statusElement = progressItem.querySelector('.upload-status');

        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }

        if (statusElement) {
            const statusText = {
                'starting': 'Starting...',
                'uploading': `${progress}%`,
                'completed': 'Completed',
                'error': 'Failed'
            };
            statusElement.textContent = statusText[status] || status;
        }

        // Update progress tracking
        this.uploadProgress.set(uploadId, { progress, status });

        // Change colors based on status
        if (status === 'completed') {
            progressFill.style.backgroundColor = '#28a745';
        } else if (status === 'error') {
            progressFill.style.backgroundColor = '#dc3545';
        }
    }

    hideUploadProgress(uploadId) {
        const progressItem = document.getElementById(`upload-${uploadId}`);
        if (progressItem) {
            progressItem.remove();
        }
        this.uploadProgress.delete(uploadId);

        // Hide container if no more uploads
        const container = document.getElementById('upload-progress-container');
        if (container && container.children.length === 0) {
            container.style.display = 'none';
        }
    }

    getOrCreateProgressContainer() {
        let container = document.getElementById('upload-progress-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'upload-progress-container';
            container.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                max-width: 400px;
                z-index: 10000;
            `;
            document.body.appendChild(container);
        }
        container.style.display = 'block';
        return container;
    }

    addProgressStyles() {
        if (document.querySelector('#upload-progress-styles')) return;

        const style = document.createElement('style');
        style.id = 'upload-progress-styles';
        style.textContent = `
            .upload-progress-item {
                background: white;
                border: 1px solid #ddd;
                border-radius: 8px;
                padding: 16px;
                margin-bottom: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                position: relative;
                font-family: 'Inter', sans-serif;
            }
            
            .upload-file-name {
                font-size: 14px;
                font-weight: 500;
                margin-bottom: 8px;
                color: #333;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            
            .upload-progress-bar {
                height: 6px;
                background: #f0f0f0;
                border-radius: 3px;
                overflow: hidden;
                margin-bottom: 8px;
            }
            
            .upload-progress-fill {
                height: 100%;
                background: #525EB1;
                transition: width 0.3s ease;
            }
            
            .upload-status {
                font-size: 12px;
                color: #666;
            }
            
            .upload-cancel {
                position: absolute;
                top: 8px;
                right: 8px;
                background: none;
                border: none;
                font-size: 20px;
                color: #999;
                cursor: pointer;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
            }
            
            .upload-cancel:hover {
                background: #f0f0f0;
                color: #666;
            }
        `;
        document.head.appendChild(style);
    }

    // Utility Methods
    generateUploadId() {
        return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            border-radius: 8px;
            color: white;
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            z-index: 10000;
            max-width: 400px;
            word-wrap: break-word;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;

        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };

        notification.style.backgroundColor = colors[type] || colors.info;
        notification.innerHTML = message.replace(/\n/g, '<br>');

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }

    cancelUpload(uploadId) {
        // This would need to be implemented with the actual XHR object
        // For now, just hide the progress
        this.hideUploadProgress(uploadId);
        this.showNotification('Upload cancelled', 'info');
    }

    // Initialize file upload handler
    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Handle file input changes
        document.addEventListener('change', (e) => {
            if (e.target.type === 'file' && e.target.hasAttribute('data-auto-upload')) {
                const files = Array.from(e.target.files);
                if (files.length > 0) {
                    this.uploadMultipleFiles(files);
                }
            }
        });

        // Handle file drop zones
        document.addEventListener('DOMContentLoaded', () => {
            const dropZones = document.querySelectorAll('[data-file-drop]');
            dropZones.forEach(dropZone => {
                this.setupDragAndDrop(dropZone);
            });
        });
    }
}

// Create singleton instance
const fileUploadHandler = new FileUploadHandler();

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => fileUploadHandler.init());
} else {
    fileUploadHandler.init();
}

// Make it globally available for inline event handlers
window.fileUploadHandler = fileUploadHandler;

export default fileUploadHandler;
export { FileUploadHandler };