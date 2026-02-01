const { uploadToCloudinary } = require('../config/multer');
const ORSPlan = require('../models/ORS');
// const ORSPlan = require('../models/orsModel');
// const { uploadToCloudinary } = require('../middleware/upload');

/**
 * Create new ORS Report with file attachments
 */
const createOrsReport = async (req, res) => {
  try {
    const { vehicle, roadWorthinessScore, overallTrafficScore, actionRequired, documents } = req.body;

    if (!vehicle || !roadWorthinessScore || !overallTrafficScore || !actionRequired) {
      return res.status(400).json({
        success: false,
        message: "Missing required text fields",
      });
    }

    // Parse documents metadata
    let parsedDocuments = [];
    if (documents) {
      parsedDocuments = typeof documents === "string" ? JSON.parse(documents) : documents;
    }

    // Prepare documents with empty attachments array
    const finalDocuments = parsedDocuments.map((doc) => ({
      label: doc.label?.trim() || "",
      description: doc.description?.trim() || "",
      attachments: [],
    }));

    // Upload ALL files (they come in order)
    let uploadedFiles = [];
    if (req.files && req.files.length > 0) {
      uploadedFiles = await uploadToCloudinary(req.files, "ors-reports");
    }

    // Distribute files sequentially to documents (cumulative index)
    let fileIndex = 0;
    for (let i = 0; i < finalDocuments.length; i++) {
      const doc = finalDocuments[i];

      // You can decide how many files per document you want to allow
      // Here: take all remaining files for this document? Or fixed number?
      // Simplest & most common → assign sequentially until next document

      // Option A: assign as many as were uploaded for this doc in frontend order
      // (since frontend appends in document order)

      while (
        fileIndex < uploadedFiles.length &&
        // you can add condition if you want to limit files per doc
        doc.attachments.length < 10 // example limit
      ) {
        doc.attachments.push(uploadedFiles[fileIndex]);
        fileIndex++;
      }
    }

    // If there are leftover files → you can either ignore or attach to last doc
    // Most apps just attach sequentially → leftover goes to last document

    const orsReport = new ORSPlan({
      vehicle: vehicle.trim(),
      roadWorthinessScore: roadWorthinessScore.trim(),
      overallTrafficScore: overallTrafficScore.trim(),
      actionRequired: actionRequired.trim(),
      documents: finalDocuments,
      // createdBy: req.user?._id,   // uncomment when auth is ready
    });

    await orsReport.save();

    res.status(201).json({
      success: true,
      message: "ORS Report created successfully",
      data: orsReport,
    });
  } catch (error) {
    console.error("Create ORS error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating report",
      error: error.message,
    });
  }
};

/**
 * Get all ORS Reports
 */
const getAllOrsReports = async (req, res) => {
  try {
    const orsReports = await ORSPlan.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orsReports.length,
      data: orsReports,
    });
  } catch (error) {
    console.error('Error fetching ORS Reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ORS Reports',
      error: error.message,
    });
  }
};

/**
 * Get single ORS Report by ID
 */
const getOrsReportById = async (req, res) => {
  try {
    const { id } = req.params;

    const orsReport = await ORSPlan.findById(id);

    if (!orsReport) {
      return res.status(404).json({
        success: false,
        message: 'ORS Report not found',
      });
    }

    res.status(200).json({
      success: true,
      data: orsReport,
    });
  } catch (error) {
    console.error('Error fetching ORS Report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ORS Report',
      error: error.message,
    });
  }
};

/**
 * Update ORS Report
 */
const updateOrsReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { vehicle, roadWorthinessScore, overallTrafficScore, actionRequired, documents } =
      req.body;

    // Find existing report
    const orsReport = await ORSPlan.findById(id);

    if (!orsReport) {
      return res.status(404).json({
        success: false,
        message: 'ORS Report not found',
      });
    }

    // Update fields
    if (vehicle) orsReport.vehicle = vehicle.trim();
    if (roadWorthinessScore) orsReport.roadWorthinessScore = roadWorthinessScore.trim();
    if (overallTrafficScore) orsReport.overallTrafficScore = overallTrafficScore.trim();
    if (actionRequired) orsReport.actionRequired = actionRequired.trim();

    // Handle document updates
    if (documents) {
      const parsedDocuments = typeof documents === 'string' ? JSON.parse(documents) : documents;
      orsReport.documents = parsedDocuments;
    }

    // Handle new file uploads
    if (req.files && req.files.length > 0) {
      const uploadedFiles = await uploadToCloudinary(req.files, 'ors-reports');

      // Add new files to existing documents or create new document entries
      if (orsReport.documents.length === 0) {
        uploadedFiles.forEach((file) => {
          orsReport.documents.push({
            label: file.originalName,
            description: '',
            attachments: [file],
          });
        });
      } else {
        orsReport.documents[0].attachments.push(...uploadedFiles);
      }
    }

    // Save updated report
    await orsReport.save();

    res.status(200).json({
      success: true,
      message: 'ORS Report updated successfully',
      data: orsReport,
    });
  } catch (error) {
    console.error('Error updating ORS Report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update ORS Report',
      error: error.message,
    });
  }
};

/**
 * Delete ORS Report
 */
const deleteOrsReport = async (req, res) => {
  try {
    const { id } = req.params;

    const orsReport = await ORSPlan.findByIdAndDelete(id);

    if (!orsReport) {
      return res.status(404).json({
        success: false,
        message: 'ORS Report not found',
      });
    }

    // Optionally: Delete files from Cloudinary
    // You can implement this if needed

    res.status(200).json({
      success: true,
      message: 'ORS Report deleted successfully',
      data: orsReport,
    });
  } catch (error) {
    console.error('Error deleting ORS Report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete ORS Report',
      error: error.message,
    });
  }
};

module.exports = {
  createOrsReport,
  getAllOrsReports,
  getOrsReportById,
  updateOrsReport,
  deleteOrsReport,
};
