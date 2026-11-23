const { User } = require("../../models");
const logger = require('../utils/logger');
const { catchError } = require('../utils/errorHandler');
// API annuaire interne (réseau fermé). Non configurée => réponses vides.
// TLS and certificate options: see src/utils/peopleApi.js.
const { PEOPLE_API_URL, peopleRequest } = require('../utils/peopleApi');

const cookie = process.env.PEOPLE_API_COOKIE || "";

exports.getUserData = async (req, res) => {
  const username = req.params.username;
  if (!PEOPLE_API_URL) {
    res.status(200).json({ data: [] });
    return;
  }

  let search;
  try {
    search = await peopleRequest({
      method: "POST",
      path: "/search",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({
        query: username,
        hierarchies: [],
        dargot: [],
        exact: false,
        rules: [{ field: "name", operator: "contains", value: username }],
        ignoreReleased: false,
      }),
    });
  } catch (error) {
    logger.warn("Directory search failed", {
      username,
      originalError: error.message || error.code,
    });
    res.status(500).json({ error: "Failed to search user" });
    return;
  }

  try {
    const persons = JSON.parse(search.body) || [];

    if (persons.length === 0) {
      res.status(200).json({ data: [] });
      return;
    }

    const personsWithCourses = await Promise.all(
      persons.map(async (person) => {
        let basicCourse = null;
        try {
          const badgeResult = await peopleRequest({
            method: "GET",
            path: `/custom-badges?userId=${person._id}`,
            headers: {
              "Content-Type": "application/json",
              Cookie: cookie,
            },
            followRedirect: true,
          });
          if (badgeResult.body) {
            try {
              const badges = JSON.parse(badgeResult.body) || [];
              const courseBadge = badges.find((badge) =>
                badge.label && badge.label.includes("קורס")
              );
              if (courseBadge) {
                basicCourse = courseBadge.label;
              }
            } catch (e) {
              logger.debug("Couldn't parse badges", { personId: person._id });
            }
          }
        } catch (badgeError) {
          // Same as before: without badges, basicCourse stays null.
        }
        return {
          ...person,
          basicCourse: basicCourse,
        };
      })
    );

    res.status(200).json({
      data: personsWithCourses,
    });
  } catch (e) {
    res.status(400).json({ error: "Couldn't find this person!" });
  }
};

exports.getUserPhoto = (req, res) => {
  const username = req.params.username;

  // Rejects on network / TLS errors (handled by fetchPhoto().catch below), like before.
  const makeRequest = (options) => peopleRequest(options);

  const fetchPhoto = async () => {
    if (!PEOPLE_API_URL) {
      return res.status(404).json({ error: "People API not configured" });
    }
    const searchResult = await makeRequest({
      method: "POST",
      path: "/search",
      followRedirect: true,
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({
        query: username,
        hierarchies: [],
        dargot: [],
        exact: false,
        ignoreReleased: false,
      }),
    });

    if (searchResult.error) {
      /*   logger.error('Search request failed', {
          error: searchResult.error.message,
          code: searchResult.error.code,
          username,
          userId: req.headers['x-user-id']
        }); */
      logger.warn("Directory search request failed", {
        username,
        originalError: searchResult.error.message || searchResult.error.code,
      });
      return res.status(500).json({ error: "Failed to retrieve user full name" });
    }

    if (searchResult.response.statusCode !== 200 && searchResult.response.statusCode !== 201) {
      /*   logger.error('Search API error', {
          statusCode: searchResult.response.statusCode,
          statusMessage: searchResult.response.statusMessage,
          username,
          userId: req.headers['x-user-id']
        }); */
      return res.status(searchResult.response.statusCode).json({
        error: "Failed to search user",
        statusCode: searchResult.response.statusCode,
        statusMessage: searchResult.response.statusMessage,
      });
    }

    let photoId = "";
    try {
      const persons = JSON.parse(searchResult.body);
      const person = persons[0];
      photoId = person?._id;
    } catch (parseError) {
      /*   logger.error('Parse error in search response', {
          error: parseError.message,
          username,
          rawBody: searchResult.body?.substring?.(0, 100),
          userId: req.headers['x-user-id']
        }); */
      return res.status(400).json({
        error: "Couldn't find this person!",
        rawBody: searchResult.body,
        parseError: parseError.message,
      });
    }

    if (!photoId || photoId.length === 0) {
      /*   logger.warn('No photo ID found', {
          username,
          userId: req.headers['x-user-id']
        }); */
      return res.status(404).json({ error: "User not found or no photo ID" });
    }

    const photoResult = await makeRequest({
      method: "GET",
      path: `/user/image?userId=${photoId}`,
      followRedirect: true,
      headers: {
        Accept: "image/*,*/*;q=0.8",
        "accept-encoding": "gzip, deflate, br, zstd",
        "accept-language": "en-US,en;q=0.9",
        Cookie: cookie,
      },
      binary: true,
    });

    if (photoResult.error) {
      /*  logger.error('Photo request failed', {
         error: photoResult.error.message,
         code: photoResult.error.code,
         username,
         photoId,
         userId: req.headers['x-user-id']
       }); */
      logger.warn("Directory photo request failed", {
        username,
        photoId,
        originalError: photoResult.error.message || photoResult.error.code,
      });
      return res.status(500).json({ error: "Failed to retrieve user Photo" });
    }

    if (photoResult.response.statusCode !== 200) {
      /*  logger.error('Photo API error', {
         statusCode: photoResult.response.statusCode,
         statusMessage: photoResult.response.statusMessage,
         username,
         photoId,
         userId: req.headers['x-user-id']
       }); */
      return res.status(photoResult.response.statusCode).json({
        error: "Failed to retrieve user Photo",
        statusCode: photoResult.response.statusCode,
        message: photoResult.response.statusMessage,
      });
    }

    if (!photoResult.body || photoResult.body.length === 0) {
      /*   logger.warn('Received empty response from photo API', {
          username,
          photoId,
          userId: req.headers['x-user-id']
        }); */
      return res.status(404).json({
        error: "Photo not found or empty response from server",
      });
    }

    const contentType = (photoResult.response.headers["content-type"] || "").split(";")[0].trim();
    res.set("Content-Type", contentType);
    res.set("Content-Length", photoResult.body.length.toString());
    res.status(200).send(photoResult.body);
  };



  fetchPhoto().catch((err) => {


    /*   logger.error('Error in getUserPhoto', {
        error: err.message,
        username,
        userId: req.headers['x-user-id']
      }); */

    res.status(500).json({ error: "Internal server error" });
  });
};


exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (err) {
    catchError(err, req, res, { function: "user.getAllUsers" });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    catchError(err, req, res, { function: "user.getUserById" });
  }
};

exports.createUser = async (req, res) => {
  const { name, militaryid, username, password = "123", basicCourse = null } = req.body;

  try {
    if (!name || !username) {
      return res.status(400).json({ error: "Name and username are required" });
    }

    if (militaryid && !/^\d{7}$/.test(militaryid)) {
      logger.warn("createUser: militaryid is not 7 digits", { username });
    }

    const user = await User.findOne({
      where: {
        username: username,
      },
    });

    if (user) {
      return res.status(409).json({ msg: "User already exists" });
    }

    const newUser = await User.create({
      name,
      militaryid: militaryid || "0000000",
      username,
      password,
      basicCourse,
    });

    logger.info('User created', {
      userId: newUser.id,
      username: username,
      name: name,
      militaryid: militaryid,
      userId: req.headers['x-user-id']
    });

    res.status(201).json({ msg: "User created successfully!", newUser });
  } catch (error) {
    catchError(error, req, res, { function: "user.createUser", status: 400 });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { name, militaryid } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    await user.update({ name, militaryid });

    logger.info('User updated', {
      userId: req.params.id,
      previousData: previousData,
      newData: { name, militaryid },
      updatedFields: Object.keys(req.body),
      userId: req.headers['x-user-id']
    });

    res.json(user);
  } catch (err) {
    catchError(err, req, res, { function: "user.updateUser" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    logger.info('User deleted', {
      userId: req.params.id,
      username: user.username,
      name: user.name,
      userId: req.headers['x-user-id']
    });

    await user.destroy();
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    catchError(err, req, res, { function: "user.deleteUser" });
  }
};

exports.getUserByUsername = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({
      where: { username }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};