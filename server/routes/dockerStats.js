const express = require('express')
const router = express.Router()
const { getDockerStats } = require('../controllers/dockerStatsController')

router.get('/', getDockerStats)

module.exports = router
