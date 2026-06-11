const express = require('express')
const router  = express.Router()
const { getServerStats } = require('../controllers/serverStatsController')

router.get('/', getServerStats)

module.exports = router
