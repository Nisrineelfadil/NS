/**
 * Mega.nz Backup Service for Nisrine School
 * Provides 20GB free storage with end-to-end encryption
 */

const { Storage } = require('megajs');
const fs = require('fs');
const path = require('path');

class MegaService {
    constructor() {
        this.email = process.env.MEGA_EMAIL;
        this.password = process.env.MEGA_PASSWORD;
        this.storage = null;
        this.isReady = false;
    }

    /**
     * Check if Mega is configured
     */
    isConfigured() {
        return !!this.email && !!this.password;
    }

    /**
     * Login to Mega and initialize storage
     */
    async login() {
        if (this.isReady && this.storage) {
            return this.storage;
        }

        if (!this.isConfigured()) {
            throw new Error('Mega not configured - missing email or password');
        }

        try {
            console.log('🔐 Logging into Mega.nz...');
            
            this.storage = await new Storage({
                email: this.email,
                password: this.password,
                autologin: true,
                autoload: true
            }).ready;

            this.isReady = true;
            console.log('✅ Mega.nz login successful');
            
            return this.storage;
        } catch (error) {
            console.error('❌ Mega login failed:', error.message);
            this.isReady = false;
            throw new Error(`Failed to login to Mega: ${error.message}`);
        }
    }

    /**
     * Ensure we're logged in
     */
    async ensureLoggedIn() {
        if (!this.isReady || !this.storage) {
            await this.login();
        }
        return this.storage;
    }

    /**
     * Find or create folder by path
     * @param {string} folderPath - Path like "/Nisrine School Registrations/2025/November"
     */
    async ensureFolderExists(folderPath) {
        const storage = await this.ensureLoggedIn();
        
        // Split path into parts
        const parts = folderPath.split('/').filter(p => p);
        let currentFolder = storage.root;

        for (const folderName of parts) {
            // Look for existing folder
            let found = false;
            
            for (const child of currentFolder.children) {
                if (child.name === folderName && child.directory) {
                    currentFolder = child;
                    found = true;
                    break;
                }
            }

            // Create folder if not found
            if (!found) {
                console.log(`📁 Creating folder: ${folderName}`);
                currentFolder = await currentFolder.mkdir(folderName);
                // Folder is ready immediately after creation
            }
        }

        return currentFolder;
    }

    /**
     * Upload student PDF to Mega with organized folder structure
     * Structure: /Nisrine School Registrations/YYYY/Month/Filename.pdf
     * @param {string|Buffer} pdfPathOrBuffer - File path or Buffer
     * @param {object} studentData - Student information
     */
    async uploadStudentPDF(pdfPathOrBuffer, studentData) {
        try {
            const storage = await this.ensureLoggedIn();

            // Handle both file path and buffer
            let fileBuffer;
            if (Buffer.isBuffer(pdfPathOrBuffer)) {
                fileBuffer = pdfPathOrBuffer;
            } else {
                if (!fs.existsSync(pdfPathOrBuffer)) {
                    return {
                        success: false,
                        message: 'PDF file not found',
                        error: `File does not exist: ${pdfPathOrBuffer}`
                    };
                }
                fileBuffer = fs.readFileSync(pdfPathOrBuffer);
            }
            
            // Get current date for folder organization
            const now = new Date();
            const year = now.getFullYear();
            const monthNames = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ];
            const monthName = monthNames[now.getMonth()];
            
            // Create organized folder path
            const folderPath = `/Nisrine School Registrations/${year}/${monthName}`;
            
            // Ensure folder exists
            const targetFolder = await this.ensureFolderExists(folderPath);
            
            // Create filename with CIN
            const fileName = `${studentData.fullName}_${studentData.cin}.pdf`;
            
            console.log(`📤 Uploading to Mega: ${folderPath}/${fileName}`);

            // Upload file to Mega
            const uploadedFile = await targetFolder.upload({
                name: fileName,
                size: fileBuffer.length
            }, fileBuffer).complete;

            console.log(`✅ Uploaded to Mega: ${folderPath}/${fileName}`);

            // Get shareable link
            let webViewLink = null;
            try {
                webViewLink = await uploadedFile.link();
                console.log(`🔗 Shareable link created: ${webViewLink}`);
            } catch (linkError) {
                console.warn('Could not create shareable link:', linkError.message);
            }

            return {
                success: true,
                fileId: uploadedFile.nodeId,
                fileName: uploadedFile.name,
                filePath: `${folderPath}/${fileName}`,
                folderPath: folderPath,
                year: year,
                month: monthName,
                webViewLink: webViewLink,
                uploadedAt: new Date().toISOString(),
                size: fileBuffer.length
            };

        } catch (error) {
            console.error('❌ Mega upload error:', error);
            
            let message = 'Failed to upload to Mega';
            let fix = 'Check your Mega configuration';
            
            if (error.message.includes('login')) {
                message = 'Mega login failed - invalid credentials';
                fix = 'Verify MEGA_EMAIL and MEGA_PASSWORD in .env file';
            } else if (error.message.includes('quota')) {
                message = 'Mega storage quota exceeded';
                fix = 'Free up space in your Mega account or upgrade plan';
            } else if (error.message.includes('network')) {
                message = 'Network error connecting to Mega';
                fix = 'Check your internet connection';
            }
            
            return {
                success: false,
                message: message,
                error: error.message,
                fix: fix
            };
        }
    }

    /**
     * Upload service request file to Mega
     * @param {Buffer} fileBuffer - File buffer
     * @param {string} megaPath - Path like "/ServiceRequests/cv/filename.pdf"
     */
    async uploadServiceFile(fileBuffer, megaPath) {
        try {
            const storage = await this.ensureLoggedIn();

            // Extract folder path and filename
            const lastSlash = megaPath.lastIndexOf('/');
            const folderPath = megaPath.substring(0, lastSlash);
            const fileName = megaPath.substring(lastSlash + 1);
            
            // Ensure folder exists
            const targetFolder = await this.ensureFolderExists(folderPath);

            console.log(`📤 Uploading service file to Mega: ${megaPath}`);

            // Upload file
            const uploadedFile = await targetFolder.upload({
                name: fileName,
                size: fileBuffer.length
            }, fileBuffer).complete;

            console.log(`✅ Service file uploaded to Mega: ${megaPath}`);

            return {
                success: true,
                fileId: uploadedFile.nodeId,
                fileName: uploadedFile.name,
                filePath: megaPath,
                size: fileBuffer.length
            };

        } catch (error) {
            console.error('❌ Mega upload error:', error);
            throw new Error(`Failed to upload file to Mega: ${error.message}`);
        }
    }

    /**
     * Download file from Mega
     * @param {string} megaPath - Full path to file
     */
    async downloadServiceFile(megaPath) {
        try {
            const storage = await this.ensureLoggedIn();

            // Navigate to file
            const parts = megaPath.split('/').filter(p => p);
            let current = storage.root;

            for (let i = 0; i < parts.length; i++) {
                const partName = parts[i];
                let found = false;

                for (const child of current.children) {
                    if (child.name === partName) {
                        current = child;
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    // List available files in current directory for debugging
                    const availableFiles = current.children
                        .filter(c => !c.directory)
                        .map(c => c.name)
                        .join(', ');
                    const availableFolders = current.children
                        .filter(c => c.directory)
                        .map(c => c.name)
                        .join(', ');
                    
                    console.error(`❌ File/folder not found: "${partName}"`);
                    console.error(`   Current path: /${parts.slice(0, i).join('/')}`);
                    console.error(`   Available folders: ${availableFolders || 'none'}`);
                    console.error(`   Available files: ${availableFiles || 'none'}`);
                    
                    throw new Error(`File not found: ${megaPath}`);
                }
            }

            // Check if it's a file (not a folder)
            if (current.directory) {
                throw new Error(`Path is a directory, not a file: ${megaPath}`);
            }

            // Download file
            console.log(`📥 Downloading from Mega: ${megaPath}`);
            const fileBuffer = await current.downloadBuffer();

            console.log(`✅ File downloaded from Mega: ${megaPath} (${current.size} bytes)`);

            return {
                success: true,
                fileBuffer: fileBuffer,
                fileName: current.name,
                fileSize: current.size
            };

        } catch (error) {
            console.error('❌ Mega download error:', error);
            throw new Error(`Failed to download file from Mega: ${error.message}`);
        }
    }

    /**
     * Test Mega connection
     */
    async testConnection() {
        try {
            const storage = await this.ensureLoggedIn();

            // Get account info
            const accountInfo = await storage.getAccountInfo();
            
            return {
                success: true,
                accountEmail: this.email,
                storageUsed: this.formatBytes(accountInfo.spaceUsed || 0),
                storageTotal: this.formatBytes(accountInfo.spaceTotal || 0),
                storageAvailable: this.formatBytes((accountInfo.spaceTotal || 0) - (accountInfo.spaceUsed || 0))
            };

        } catch (error) {
            let message = 'Failed to connect to Mega';
            let fix = 'Check your Mega configuration';
            
            if (error.message.includes('login') || error.message.includes('credentials')) {
                message = 'Mega login failed - invalid credentials';
                fix = 'Verify MEGA_EMAIL and MEGA_PASSWORD in .env file';
            } else if (error.message.includes('network') || error.code === 'ENOTFOUND') {
                message = 'Cannot connect to Mega - network error';
                fix = 'Check your internet connection';
            }
            
            return {
                success: false,
                message: message,
                error: error.message,
                fix: fix
            };
        }
    }

    /**
     * List files in a folder
     * @param {string} folderPath - Folder path
     */
    async listFiles(folderPath = '/Nisrine School Registrations') {
        try {
            const storage = await this.ensureLoggedIn();

            // Navigate to folder
            const parts = folderPath.split('/').filter(p => p);
            let currentFolder = storage.root;

            for (const folderName of parts) {
                let found = false;
                for (const child of currentFolder.children) {
                    if (child.name === folderName && child.directory) {
                        currentFolder = child;
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    return {
                        success: false,
                        message: `Folder not found: ${folderPath}`,
                        files: []
                    };
                }
            }

            // List children
            const files = currentFolder.children.map(entry => ({
                name: entry.name,
                path: `${folderPath}/${entry.name}`,
                size: entry.size || 0,
                modified: entry.timestamp ? new Date(entry.timestamp * 1000) : null,
                isFolder: entry.directory || false
            }));

            return {
                success: true,
                files: files
            };

        } catch (error) {
            return {
                success: false,
                message: 'Failed to list files',
                error: error.message,
                files: []
            };
        }
    }

    /**
     * Delete file from Mega
     * @param {string} filePath - Full path to file
     */
    async deleteFile(filePath) {
        try {
            const storage = await this.ensureLoggedIn();

            // Navigate to file
            const parts = filePath.split('/').filter(p => p);
            let current = storage.root;

            for (const partName of parts) {
                let found = false;
                for (const child of current.children) {
                    if (child.name === partName) {
                        current = child;
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    throw new Error(`File not found: ${filePath}`);
                }
            }

            // Delete file
            await current.delete();

            return {
                success: true,
                message: 'File deleted successfully'
            };

        } catch (error) {
            return {
                success: false,
                message: 'Failed to delete file',
                error: error.message
            };
        }
    }

    /**
     * Format bytes to human readable
     */
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
}

// Export singleton instance
module.exports = new MegaService();
