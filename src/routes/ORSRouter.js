const express = require('express');
// const { uploadMultiple } = require('../middleware/upload');
const {
  createOrsReport,
  getAllOrsReports,
  getOrsReportById,
  updateOrsReport,
  deleteOrsReport,
} = require('../controllers/ORSController');
const { uploadMultiple } = require('../config/multer');

const OrsRouter = express.Router();

// Create ORS Report with file uploads
OrsRouter.post('/create-ors-report', uploadMultiple, createOrsReport);

// Get all ORS Reports
OrsRouter.get('/ors-reports', getAllOrsReports);

// Get single ORS Report
OrsRouter.get('/ors-reports/:id', getOrsReportById);

// Update ORS Report
OrsRouter.put('/ors-reports/:id', uploadMultiple, updateOrsReport);

// Delete ORS Report
OrsRouter.delete('/ors-reports/:id', deleteOrsReport);

module.exports = OrsRouter;
