import Document from "../models/Document.js";

// Get all documents of the authenticated patient
export const getPatientDocuments = async (req, res) => {
  try {
    const docs = await Document.find({
      patientId: req.user.id,
    }).sort({
      uploadDate: -1,
    });

    res.status(200).json(docs);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch medical documents.",
      error: error.message,
    });
  }
};

// Upload and save a new document
export const uploadDocument = async (req, res) => {
  try {
    // Check whether a file was uploaded
    if (!req.file) {
      return res.status(400).json({
        message: "Please upload a document.",
      });
    }

    const { name, type, doctorName } = req.body;

    // Create file URL/path
    const fileUrl = `/uploads/${req.file.filename}`;

    // Save document information in MongoDB
    const newDoc = new Document({
      patientId: req.user.id,
      name: name || req.file.originalname,
      type: type || "Uploaded Document",
      doctorName: doctorName || "Self Uploaded",
      fileUrl,
    });

    await newDoc.save();

    res.status(201).json({
      message: "Document uploaded successfully.",
      document: newDoc,
    });
  } catch (error) {
    res.status(500).json({
      message: "Document upload failed.",
      error: error.message,
    });
  }
};
