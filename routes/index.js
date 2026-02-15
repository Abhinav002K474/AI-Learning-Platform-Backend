const express = require('express');
const router = express.Router();

// Mount all modular routes
// Note: server.js sets up the base path '/api' or others. 
// This index file can be used to aggregate them if desired.

router.use("/user", require("./user.routes.js"));
router.use("/", require("./summarizer.routes"));
router.use("/", require("./modulator.rag.routes"));
router.use("/", require("./questionBank.routes.js"));
router.use("/admin", require("./admin.questionBank.routes.js"));
router.use("/admin", require("./admin.routes.js"));
router.use("/", require("./assessment.routes.js"));
router.use("/ai", require("./ai.routes"));
router.use("/", require("./materials.routes.js"));
router.use("/", require("./auth.routes.js"));

module.exports = router;
