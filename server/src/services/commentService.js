const commentRepository = require('../repositories/commentRepository');
const issueRepository = require('../repositories/issueRepository');
const activityService = require('./activityService');
const notificationService = require('./notificationService');
const ApiError = require('../utils/ApiError');

const commentService = {
  async list(issueId) {
    return commentRepository.findByIssue(issueId);
  },

  async create(issueId, authorId, content) {
    const issue = await issueRepository.findById(issueId);
    if (!issue) throw ApiError.notFound('Issue not found');

    const comment = await commentRepository.create({ issueId, authorId, content });
    await activityService.log({ issueId, userId: authorId, action: 'COMMENT_ADDED' });

    if (issue.assigneeId && issue.assigneeId !== authorId) {
      await notificationService.notify({
        userId: issue.assigneeId,
        type: 'COMMENTED',
        title: 'New comment on your issue',
        message: `${comment.author.name} commented on ${issue.title}`,
        issueId,
      });
    }
    return comment;
  },

  async update(commentId, userId, content) {
    const comment = await commentRepository.findById(commentId);
    if (!comment) throw ApiError.notFound('Comment not found');
    if (comment.authorId !== userId) throw ApiError.forbidden('You can only edit your own comments');
    return commentRepository.update(commentId, content);
  },

  async delete(commentId, user) {
    const comment = await commentRepository.findById(commentId);
    if (!comment) throw ApiError.notFound('Comment not found');
    if (comment.authorId !== user.id && user.role !== 'ADMIN') {
      throw ApiError.forbidden('You can only delete your own comments');
    }
    return commentRepository.delete(commentId);
  },
};

module.exports = commentService;
