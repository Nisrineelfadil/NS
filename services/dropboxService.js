/**
 * Dropbox Backup Service for Nisrine School
 * With automatic token refresh for permanent access
 */

const { Dropbox } = require('dropbox');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

class DropboxService {
    constructor() {
        // Support both old access token and new refresh token
        this.accessToken = process.env.DROPBOX_ACCESS_TOKEN;
        this.refreshToken = process.env.DROPBOX_REFRESH_TOKEN;
        this.appKey = process.env.DROPBOX_APP_KEY;
        this.appSecret = process.env.DROPBOX_APP_SECRET;
        this.dbx = null;
        this.tokenExpiresAt = null;
        
        if (this.accessToken) {
            this.dbx = new Dropbox({ accessToken: this.accessToken });
        }
    }

    /**
     * Check if Dropbox is configured
     */
    isConfigured() {
        // Can use either access token or refresh token
        return (!!this.accessToken || !!this.refreshToken) && (this.refreshToken ? !!this.appKey && !!this.appSecret : true);
    }

    /**
     * Get a valid access token (refresh if needed)
     */
    async getValidAccessToken() {
        // If using refresh token system
        if (this.refreshToken && this.appKey && this.appSecret) {
            // Check if current token is expired or about to expire (within 5 minutes)
            const now = Date.now();
            if (!this.accessToken || !this.tokenExpiresAt || this.tokenExpiresAt - now < 5 * 60 * 1000) {
                console.log('🔄 Refreshing Dropbox access token...');
                await this.refreshAccessToken();
            }
            return this.accessToken;
        }
        
        // Using old static token
        return this.accessToken;
    }

    /**
     * Refresh access token using refresh token
     */
    async refreshAccessToken() {
        try {
            const response = await axios.post('https://api.dropboxapi.com/oauth2/token', null, {
                params: {
                    grant_type: 'refresh_token',
                    refresh_token: this.refreshToken,
                    client_id: this.appKey,
                    client_secret: this.appSecret
                }
            });

            this.accessToken = response.data.access_token;
            // Token expires in 4 hours (14400 seconds)
            this.tokenExpiresAt = Date.now() + (response.data.expires_in * 1000);
            
            // Update Dropbox instance with new token
            this.dbx = new Dropbox({ accessToken: this.accessToken });
            
            console.log('✅ Dropbox access token refreshed successfully');
            console.log(`   Expires at: ${new Date(this.tokenExpiresAt).toLocaleString()}`);
            
            return this.accessToken;
        } catch (error) {
            console.error('❌ Failed to refresh Dropbox token:', error.response?.data || error.message);
            throw new Error('Failed to refresh Dropbox access token');
        }
    }

    /**
     * Ensure we have a valid Dropbox client
     */
    async ensureValidClient() {
        if (!this.isConfigured()) {
            throw new Error('Dropbox not configured');
        }
        
        // Get valid token (will refresh if needed)
        await this.getValidAccessToken();
        
        // Ensure dbx is initialized
        if (!this.dbx) {
            this.dbx = new Dropbox({ accessToken: this.accessToken });
        }
    }

    /**
     * Upload student PDF to Dropbox with organized folder structure
     * Structure: /Nisrine School Registrations/YYYY/Month/Filename.pdf
     * @param {string|Buffer} pdfPathOrBuffer - File path or Buffer
     * @param {object} studentData - Student information
     */
    async uploadStudentPDF(pdfPathOrBuffer, studentData) {
        try {
            // Ensure we have a valid token
            await this.ensureValidClient();

            // Handle both file path and buffer
            let fileBuffer;
            if (Buffer.isBuffer(pdfPathOrBuffer)) {
                // Already a buffer
                fileBuffer = pdfPathOrBuffer;
            } else {
                // It's a file path
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
            
            // Ensure folder exists (create if needed)
            await this.ensureFolderExists(folderPath);
            
            // Create filename with CIN
            const fileName = `${studentData.fullName}_${studentData.cin}.pdf`;
            const dropboxPath = `${folderPath}/${fileName}`;

            // Upload to Dropbox
            const response = await this.dbx.filesUpload({
                path: dropboxPath,
                contents: fileBuffer,
                mode: 'overwrite',
                autorename: true
            });

            console.log(`✅ Uploaded to Dropbox: ${dropboxPath}`);

            // Get shareable link
            let webViewLink = null;
            try {
                const linkResponse = await this.dbx.sharingCreateSharedLinkWithSettings({
                    path: response.result.path_display
                });
                webViewLink = linkResponse.result.url;
            } catch (linkError) {
                // Link might already exist, try to get it
                try {
                    const existingLinks = await this.dbx.sharingListSharedLinks({
                        path: response.result.path_display
                    });
                    if (existingLinks.result.links.length > 0) {
                        webViewLink = existingLinks.result.links[0].url;
                    }
                } catch (e) {
                    console.warn('Could not create shareable link:', e.message);
                }
            }

            return {
                success: true,
                fileId: response.result.id,
                fileName: response.result.name,
                filePath: response.result.path_display,
                folderPath: folderPath,
                year: year,
                month: monthName,
                webViewLink: webViewLink,
                uploadedAt: new Date().toISOString()
            };

        } catch (error) {
            console.error('Dropbox upload error:', error);
            
            // Provide detailed error messages
            let message = 'Failed to upload to Dropbox';
            let fix = 'Check your Dropbox configuration';
            
            if (error.status === 401) {
                message = 'Dropbox access token is invalid or expired';
                fix = 'Generate a new access token at https://www.dropbox.com/developers/apps';
            } else if (error.status === 403) {
                message = 'Dropbox access denied - insufficient permissions';
                fix = 'Enable files.content.write permission in Dropbox App Console';
            } else if (error.status === 507) {
                message = 'Dropbox storage quota exceeded';
                fix = 'Free up space in your Dropbox account';
            } else if (error.status === 429) {
                message = 'Dropbox API rate limit exceeded';
                fix = 'Wait a few minutes before trying again';
            }
            
            return {
                success: false,
                message: message,
                error: error.message,
                errorCode: error.status || error.code,
                fix: fix
            };
        }
    }

    /**
     * Ensure folder path exists in Dropbox, create if needed
     * @param {string} folderPath - Full folder path to create
     */
    async ensureFolderExists(folderPath) {
        try {
            // Try to get folder metadata
            await this.dbx.filesGetMetadata({ path: folderPath });
            // Folder exists, no action needed
        } catch (error) {
            if (error.status === 409) {
                // Folder doesn't exist, create it
                try {
                    await this.dbx.filesCreateFolderV2({
                        path: folderPath,
                        autorename: false
                    });
                    console.log(`📁 Created folder: ${folderPath}`);
                } catch (createError) {
                    // Might fail if parent doesn't exist, create parent folders recursively
                    const parts = folderPath.split('/').filter(p => p);
                    let currentPath = '';
                    for (const part of parts) {
                        currentPath += '/' + part;
                        try {
                            await this.dbx.filesCreateFolderV2({
                                path: currentPath,
                                autorename: false
                            });
                            console.log(`📁 Created folder: ${currentPath}`);
                        } catch (e) {
                            // Folder might already exist, continue
                        }
                    }
                }
            }
        }
    }

    /**
     * Test Dropbox connection
     */
    async testConnection() {
        try {
            // Ensure we have a valid token
            await this.ensureValidClient();

            // Get account info to test connection
            const response = await this.dbx.usersGetCurrentAccount();
            
            return {
                success: true,
                accountName: response.result.name.display_name,
                accountEmail: response.result.email
            };

        } catch (error) {
            // Provide detailed error messages based on error type
            let message = 'Failed to connect to Dropbox';
            let fix = 'Check your Dropbox configuration';
            
            if (error.status === 401) {
                message = 'Dropbox access token is invalid or expired';
                fix = 'Generate a new access token at https://www.dropbox.com/developers/apps';
            } else if (error.status === 403) {
                message = 'Dropbox access denied - insufficient permissions';
                fix = 'Check app permissions in Dropbox App Console';
            } else if (error.status === 429) {
                message = 'Dropbox API rate limit exceeded';
                fix = 'Wait a few minutes before trying again';
            } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
                message = 'Cannot connect to Dropbox - network error';
                fix = 'Check your internet connection';
            }
            
            return {
                success: false,
                message: message,
                error: error.message,
                errorCode: error.status || error.code,
                fix: fix
            };
        }
    }

    /**
     * List files in Dropbox with organized folder structure
     */
    async listFiles(folderPath = '/Nisrine School Registrations') {
        try {
            // Ensure we have a valid token
            await this.ensureValidClient();

            const response = await this.dbx.filesListFolder({
                path: folderPath === '/' ? '' : folderPath,
                recursive: false
            });

            return {
                success: true,
                files: response.result.entries.map(entry => ({
                    name: entry.name,
                    path: entry.path_display,
                    size: entry.size,
                    modified: entry.server_modified,
                    isFolder: entry['.tag'] === 'folder'
                }))
            };

        } catch (error) {
            return {
                success: false,
                message: 'Failed to list files',
                error: error.message
            };
        }
    }

    /**
     * Get all registrations organized by year and month
     */
    async getOrganizedRegistrations() {
        try {
            // Ensure we have a valid token
            await this.ensureValidClient();

            const basePath = '/Nisrine School Registrations';
            const organized = {};

            // List years
            const yearsResponse = await this.dbx.filesListFolder({ path: basePath });
            
            for (const yearEntry of yearsResponse.result.entries) {
                if (yearEntry['.tag'] === 'folder') {
                    const year = yearEntry.name;
                    organized[year] = {};

                    // List months in this year
                    const monthsResponse = await this.dbx.filesListFolder({ 
                        path: yearEntry.path_display 
                    });

                    for (const monthEntry of monthsResponse.result.entries) {
                        if (monthEntry['.tag'] === 'folder') {
                            const month = monthEntry.name;

                            // List files in this month
                            const filesResponse = await this.dbx.filesListFolder({ 
                                path: monthEntry.path_display 
                            });

                            organized[year][month] = filesResponse.result.entries
                                .filter(entry => entry['.tag'] === 'file')
                                .map(file => ({
                                    name: file.name,
                                    path: file.path_display,
                                    size: file.size,
                                    modified: file.server_modified
                                }));
                        }
                    }
                }
            }

            return {
                success: true,
                organized: organized
            };

        } catch (error) {
            return {
                success: false,
                message: 'Failed to get organized registrations',
                error: error.message
            };
        }
    }

    /**
     * Delete file from Dropbox
     */
    async deleteFile(filePath) {
        try {
            // Ensure we have a valid token
            await this.ensureValidClient();

            await this.dbx.filesDeleteV2({ path: filePath });

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
     * Upload service request file to Dropbox
     */
    async uploadServiceFile(fileBuffer, dropboxPath) {
        try {
            // Ensure we have a valid token
            await this.ensureValidClient();

            // Extract folder path from full path
            const folderPath = dropboxPath.substring(0, dropboxPath.lastIndexOf('/'));
            
            // Ensure folder exists
            await this.ensureFolderExists(folderPath);

            // Upload file
            const response = await this.dbx.filesUpload({
                path: dropboxPath,
                contents: fileBuffer,
                mode: 'overwrite',
                autorename: true
            });

            console.log(`✅ Service file uploaded to Dropbox: ${dropboxPath}`);

            return {
                success: true,
                fileId: response.result.id,
                fileName: response.result.name,
                filePath: response.result.path_display
            };

        } catch (error) {
            console.error('❌ Dropbox upload error:', error);
            throw new Error(`Failed to upload file to Dropbox: ${error.message}`);
        }
    }

    /**
     * Download service request file from Dropbox
     */
    async downloadServiceFile(dropboxPath) {
        try {
            // Ensure we have a valid token
            await this.ensureValidClient();

            // Download file
            const response = await this.dbx.filesDownload({ path: dropboxPath });

            console.log(`✅ Service file downloaded from Dropbox: ${dropboxPath}`);

            return {
                success: true,
                fileBuffer: response.result.fileBinary,
                fileName: response.result.name,
                fileSize: response.result.size
            };

        } catch (error) {
            console.error('❌ Dropbox download error:', error);
            throw new Error(`Failed to download file from Dropbox: ${error.message}`);
        }
    }
}

// Export singleton instance
module.exports = new DropboxService();
