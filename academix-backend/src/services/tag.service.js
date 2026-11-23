const { Tags, TaskTags } = require("../../models");
const Sequelize = require("sequelize");
const logger = require("../utils/logger");
const { Op, fn, col } = Sequelize;

async function createTag(courseId, name) {
  try {
    const existTag = await Tags.findOne({
      where: {
        course_id: courseId,
        tagName: name,
      },
    });
    if (existTag) {
      return { error: "there is already this tag in this course!" };
    }
    const tag = await Tags.create({
      course_id: courseId,
      tagName: name,
    });
    return tag;
  } catch (error) {
    logger.error("tag.service.createTag failed", { originalError: error.message, stack: error.stack });
    return;
  }
}

async function getTagsByCourseId(courseId) {
  try {
    const tags = await Tags.findAll({
      where: {
        course_id: courseId,
      },
    });
    return tags;
  } catch (error) {
    logger.error("tag.service.getTagsByCourseId failed", { originalError: error.message, stack: error.stack });
  }
}

async function deleteTag(id) {
  try {
    const existTag = await Tags.findOne({
      where: {
        id: id,
      },
    });
    if (!existTag) {
      return { error: "there is not tag with that id!" };
    }

    const deletedTag = await Tags.destroy({
      where: {
        id: id,
      },
    });

    if (deletedTag > 0) {
      return { data: { success: true } };
    }
    return { error: "error in delete tag!" };
  } catch (error) {
    logger.error("tag.service.deleteTag failed", { originalError: error.message, stack: error.stack });
    return { error: "An error occurred while deleting the tag" };
  }
}

async function updateTag(id, newName) {
  try {
    const existTag = await Tags.findOne({
      where: {
        id: id,
      },
    });
    if (!existTag) {
      return { error: "there is no tag with this id!" };
    }
    const updatedTag = await Tags.update(
      {
        tagName: newName,
      },
      {
        where: {
          id: id,
        },
      }
    );
    if (updatedTag?.[0] > 0) {
      return { data: { success: true } };
    }
    return { error: "error in update tag!" };
  } catch (error) {
    logger.error("tag.service.updateTag failed", { originalError: error.message, stack: error.stack });
    return;
  }
}
async function getTagsByTaskId(taskId) {
  try {
    const filesRecord = await TaskTags.findAll({
      where: {
        task_id: taskId,
      },
    });

    return filesRecord;
  } catch (error) {
    logger.error("tag.service.getTagsByTaskId failed", { originalError: error.message, stack: error.stack });
  }
}
module.exports = {
  createTag,
  getTagsByCourseId,
  deleteTag,
  updateTag,
  getTagsByTaskId,
};
