const express = require("express");
const router = express.Router();
const {
  searchUsers,
  getOnlineUsers,
  getUserById,
  updateUserProfile,
  uploadAvatar,
  blockUser,
  unblockUser,
  isBlocked,
  getAllUsers,
  setAdmin,
  createReport,
  getAllReports,
  deleteUser,
  banUser,
  unbanUser,
  upload,
  promoteToAdmin,
  listAdmins
} = require("../controllers/user.controller");
const verifyToken = require("../middelware/verifyToken");
const uploadMiddleware = require('../middelware/upload');

router.get("/search", verifyToken, searchUsers);
router.get("/online", getOnlineUsers);
router.get("/all", verifyToken, getAllUsers);
router.get("/:id", verifyToken, getUserById);
router.put("/:id", verifyToken, updateUserProfile);
// router.post("/:id/avatar", verifyToken, uploadAvatar);
router.post("/:id/avatar", verifyToken, uploadMiddleware.single('avatar'), uploadAvatar);
router.post("/:id/block", verifyToken, blockUser);
router.post("/:id/unblock", verifyToken, unblockUser);
router.get("/:id/is-blocked", verifyToken, isBlocked);
router.post('/:id/set-admin', verifyToken, setAdmin);
router.delete('/:id', verifyToken, deleteUser);
router.post('/:id/ban', verifyToken, banUser);
router.post('/:id/unban', verifyToken, unbanUser);
router.post('/report', verifyToken, createReport);
router.get('/reports', verifyToken, getAllReports);
router.post('/promote-admin', promoteToAdmin);
router.get('/list-admins', listAdmins);

module.exports = router;