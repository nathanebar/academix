const {
  createTag,
  getTagsByCourseId,
  updateTag,
  deleteTag,
  getTagsByTaskId,
} = require("../services/tag.service");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const logger = require("../utils/logger");

module.exports = {
  async getByCourseId(req, res) {
    const {
      //  userId,
      courseid,
    } = req.headers;
    try {
      const tags = await getTagsByCourseId(courseid);
      res.status(200).json(tags);
    } catch (error) {
      console.log(error);
      res.status(500).json(`An Error Occured ${error}`);
    }
  },

  async create(req, res) {
    const { courseid, name } = req.body;
    try {
      const tag = await createTag(courseid, name);

      if (tag?.error) {
        res.status(401).json(tag);
      } else {
        logger.info("Tag created", {
          tagId: tag?.id,
          courseId: courseid,
          name: name,
          userId: req.headers["x-user-id"],
        });

        res.status(200).json(tag);
      }
    } catch (err) {
      res.status(400).json({ error: "error: " + err.message });
    }
  },

  async update(req, res) {
    const { id, name } = req.body;
    try {
      const updatedTag = await updateTag(id, name);
      if (updatedTag?.error) {
        res.status(401).json(updatedTag);
      } else {
        logger.info("Tag updated", {
          tagId: id,
          name: name,
          userId: req.headers["x-user-id"],
        });

        res.status(200).json(updatedTag);
      }
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async delete(req, res) {
    const {
      //  userId,
      id,
    } = req.headers;
    try {
      const deletedTag = await deleteTag(id);
      if (deletedTag?.error) {
        res.status(401).json(deletedTag);
      } else {
        logger.info("Tag deleted", {
          tagId: id,
          userId: req.headers["x-user-id"],
        });

        res.status(200).json(deletedTag);
      }
    } catch (error) {
      console.log(error);
      res.status(500).json(`An Error Occured ${error}`);
    }
  },
  async getTagsByTaskId(req, res) {
    const {
      //  userId,
      taskid,
    } = req.headers;
    try {
      const tags = await getTagsByTaskId(taskid);
      res.status(200).json(tags);
    } catch (error) {
      console.log(error);
      res.status(500).json(`An Error Occured ${error}`);
    }
  },
};
