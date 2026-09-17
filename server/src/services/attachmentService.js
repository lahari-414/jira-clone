const fs = require('fs/promises');
const path = require('path');
const attachmentRepository = require('../repositories/attachmentRepository');
const ApiError = require('../utils/ApiError');

module.exports = {
  list: (issueId) => attachmentRepository.list(issueId),
  async create(issueId, userId, file) {
    if (!file) throw ApiError.badRequest('Choose a file to upload');
    return attachmentRepository.create({
      issueId, uploadedById: userId, fileName: file.originalname, fileUrl: `/uploads/${file.filename}`,
      fileSize: file.size, mimeType: file.mimetype,
    });
  },
  async remove(id, user) {
    const attachment = await attachmentRepository.findById(id);
    if (!attachment) throw ApiError.notFound('Attachment not found');
    if (attachment.uploadedById !== user.id && user.role !== 'ADMIN') throw ApiError.forbidden('You can only delete your own attachments');
    await attachmentRepository.remove(id);
    await fs.unlink(path.join(process.cwd(), attachment.fileUrl)).catch(() => {});
  },
};
