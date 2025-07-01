const express = require("express");
const router = express.Router();
const { searchUsers, getOnlineUsers, getUserById, updateUserProfile, uploadAvatar, blockUser, unblockUser, isBlocked, getAllUsers, setAdmin, createReport, getAllReports, deleteUser, banUser, unbanUser } = require("../controllers/user.controller");
const verifyToken = require("../middelware/verifyToken");

router.get("/search", verifyToken, searchUsers);
router.get("/online", getOnlineUsers);
router.get("/all", verifyToken, getAllUsers);
router.get("/:id", verifyToken, getUserById);
router.put("/:id", verifyToken, updateUserProfile);
router.post("/:id/avatar", verifyToken, uploadAvatar);
router.post("/:id/block", verifyToken, blockUser);
router.post("/:id/unblock", verifyToken, unblockUser);
router.get("/:id/is-blocked", verifyToken, isBlocked);
router.post('/:id/set-admin', verifyToken, setAdmin);
router.delete('/:id', verifyToken, deleteUser);
router.post('/:id/ban', verifyToken, banUser);
router.post('/:id/unban', verifyToken, unbanUser);
router.post('/report', verifyToken, createReport);
router.get('/reports', verifyToken, getAllReports);

module.exports = router;