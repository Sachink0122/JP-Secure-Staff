/**
 * HR Controller
 * Handles HR module operations (Phase 6)
 * HR document generation, signing, and completion
 */

const Person = require('../models/Person');
const Department = require('../models/Department');
const Template = require('../models/Template');
const { logPersonAction } = require('../services/auditService');
const logger = require('../utils/logger');

/**
 * Helper: Check if user belongs to HR department
 */
const checkHRDepartment = async (userDepartmentId) => {
  const hrDepartment = await Department.findOne({
    $or: [
      { code: 'HR' },
      { name: { $regex: /^hr$/i } }
    ]
  });

  if (!hrDepartment) {
    return { valid: false, error: 'HR department not found. Please contact administrator.', department: null };
  }

  const userDepartment = await Department.findById(userDepartmentId);
  if (!userDepartment) {
    return { valid: false, error: 'User department not found', department: null };
  }

  if (userDepartment._id.toString() !== hrDepartment._id.toString()) {
    return { valid: false, error: 'Only users from HR department can perform this action', department: null };
  }

  return { valid: true, error: null, department: hrDepartment };
};

/**
 * Helper: Check if user can edit HR-stage person
 */
const checkHREditLock = async (person, userDepartmentId, req) => {
  const userDepartment = await Department.findById(userDepartmentId);
  if (!userDepartment) {
    return { locked: false, error: null };
  }

  // Check if person is in HR stage or completed
  const hrStages = ['HR_STAGE', 'HR_COMPLETED'];
  
  if (hrStages.includes(person.currentStatus)) {
    // Check if user is from Operation or Finance
    const operationDepartment = await Department.findOne({
      $or: [
        { code: 'OPERATION' },
        { name: { $regex: /^operation$/i } }
      ]
    });

    const financeDepartment = await Department.findOne({
      $or: [
        { code: 'FINANCE' },
        { name: { $regex: /^finance$/i } }
      ]
    });

    const isOperation = operationDepartment && userDepartment._id.toString() === operationDepartment._id.toString();
    const isFinance = financeDepartment && userDepartment._id.toString() === financeDepartment._id.toString();

    if (isOperation || isFinance) {
      // Audit log denied attempt
      await logPersonAction(
        'HR_UPDATE_ATTEMPT_DENIED',
        req.user.userId,
        person._id,
        {
          attemptedBy: req.user.userId,
          userDepartment: userDepartment.name,
          personStatus: person.currentStatus,
          reason: `${userDepartment.name} department cannot edit persons in ${person.currentStatus} stage`
        },
        {},
        req
      );

      return {
        locked: true,
        error: `${userDepartment.name} department cannot edit persons in ${person.currentStatus} stage`
      };
    }

    // HR cannot edit after HR_COMPLETED
    if (person.currentStatus === 'HR_COMPLETED') {
      const hrCheck = await checkHRDepartment(userDepartmentId);
      if (hrCheck.valid) {
        await logPersonAction(
          'HR_UPDATE_ATTEMPT_DENIED',
          req.user.userId,
          person._id,
          {
            attemptedBy: req.user.userId,
            userDepartment: userDepartment.name,
            personStatus: person.currentStatus,
            reason: 'HR cannot edit persons after HR completion'
          },
          {},
          req
        );

        return {
          locked: true,
          error: 'HR cannot edit persons after HR completion. Profile is read-only.'
        };
      }
    }
  }

  return { locked: false, error: null };
};

/**
 * Helper: Move status to HR_STAGE if needed
 */
const ensureHRStage = async (person, userId) => {
  if (person.currentStatus === 'EMPLOYEE_CODE_ASSIGNED') {
    person.currentStatus = 'HR_STAGE';
    person.statusHistory.push({
      status: 'HR_STAGE',
      changedBy: userId,
      changedAt: new Date()
    });
    await person.save();
  }
};

/**
 * Generate HR Document
 * POST /api/persons/:id/hr/generate
 */
const generateHRDocument = async (req, res, next) => {
  try {
    const personId = req.params.id;
    const { documentType, templateId } = req.body;

    // Find person
    const person = await Person.findById(personId)
      .populate('owningDepartment', 'name code');

    if (!person) {
      return res.status(404).json({
        success: false,
        error: 'Person not found'
      });
    }

    // Check user is from HR department
    const hrCheck = await checkHRDepartment(req.user.departmentId);
    if (!hrCheck.valid) {
      return res.status(403).json({
        success: false,
        error: hrCheck.error
      });
    }

    // Validate person status (must be EMPLOYEE_CODE_ASSIGNED or later)
    if (!['EMPLOYEE_CODE_ASSIGNED', 'HR_STAGE', 'HR_COMPLETED'].includes(person.currentStatus)) {
      return res.status(400).json({
        success: false,
        error: `Cannot generate HR document. Person status is ${person.currentStatus}. Only persons with status EMPLOYEE_CODE_ASSIGNED or later can have HR documents generated.`
      });
    }

    // Validate document type
    if (!['OFFER_LETTER', 'DECLARATION'].includes(documentType)) {
      return res.status(400).json({
        success: false,
        error: 'Document type must be OFFER_LETTER or DECLARATION'
      });
    }

    // Find template
    const template = await Template.findById(templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    // Validate template is published
    if (!template.isPublished) {
      return res.status(400).json({
        success: false,
        error: 'Template is not published. Only published templates can be used for document generation.'
      });
    }

    // Validate template type matches document type
    if (template.type !== documentType) {
      return res.status(400).json({
        success: false,
        error: `Template type (${template.type}) does not match document type (${documentType})`
      });
    }

    // Initialize hrDetails if not exists
    if (!person.hrDetails) {
      person.hrDetails = {
        offerLetter: {},
        declaration: {},
        hrCompleted: false,
        hrCompletedAt: null
      };
    }

    // Get document field name
    const docField = documentType === 'OFFER_LETTER' ? 'offerLetter' : 'declaration';

    // Check if document already generated
    if (person.hrDetails[docField] && person.hrDetails[docField].generatedFile) {
      return res.status(409).json({
        success: false,
        error: `${documentType} has already been generated for this person`
      });
    }

    // Store previous status for audit
    const previousStatus = person.currentStatus;

    // Generate document (in real implementation, this would use template engine)
    // For now, we'll store a placeholder file path
    const generatedFilePath = `/uploads/hr/${personId}/${documentType.toLowerCase()}-${Date.now()}.pdf`;

    // Initialize document object if not exists
    if (!person.hrDetails[docField]) {
      person.hrDetails[docField] = {};
    }

    // Set document details
    person.hrDetails[docField].templateId = templateId;
    person.hrDetails[docField].generatedFile = generatedFilePath;
    person.hrDetails[docField].status = 'GENERATED';
    person.hrDetails[docField].generatedAt = new Date();

    // Move to HR_STAGE if currently EMPLOYEE_CODE_ASSIGNED
    await ensureHRStage(person, req.user.userId);

    await person.save();

    const updatedPerson = await Person.findById(person._id)
      .populate('owningDepartment', 'name code')
      .populate('createdBy', 'fullName email')
      .populate(`hrDetails.${docField}.templateId`, 'name type');

    // Audit log
    await logPersonAction(
      'HR_DOCUMENT_GENERATED',
      req.user.userId,
      person._id,
      {
        previousStatus,
        newStatus: person.currentStatus,
        documentType,
        templateId: templateId.toString(),
        templateName: template.name,
        generatedFile: generatedFilePath
      },
      {},
      req
    );

    logger.info(`HR document ${documentType} generated for person ${person.email} (${person._id}) by user ${req.user.userId}`);

    res.status(200).json({
      success: true,
      data: { person: updatedPerson },
      message: `${documentType} generated successfully`
    });
  } catch (error) {
    logger.error('Generate HR document error:', error);
    next(error);
  }
};

/**
 * Upload Signed HR Document
 * POST /api/persons/:id/hr/upload
 */
const uploadSignedHRDocument = async (req, res, next) => {
  try {
    const personId = req.params.id;
    const { documentType, signedFile } = req.body;

    // Find person
    const person = await Person.findById(personId)
      .populate('owningDepartment', 'name code');

    if (!person) {
      return res.status(404).json({
        success: false,
        error: 'Person not found'
      });
    }

    // Check user is from HR department
    const hrCheck = await checkHRDepartment(req.user.departmentId);
    if (!hrCheck.valid) {
      return res.status(403).json({
        success: false,
        error: hrCheck.error
      });
    }

    // Validate person status
    if (!['EMPLOYEE_CODE_ASSIGNED', 'HR_STAGE', 'HR_COMPLETED'].includes(person.currentStatus)) {
      return res.status(400).json({
        success: false,
        error: `Cannot upload signed HR document. Person status is ${person.currentStatus}. Only persons with status EMPLOYEE_CODE_ASSIGNED or later can have signed documents uploaded.`
      });
    }

    // Validate document type
    if (!['OFFER_LETTER', 'DECLARATION'].includes(documentType)) {
      return res.status(400).json({
        success: false,
        error: 'Document type must be OFFER_LETTER or DECLARATION'
      });
    }

    // Initialize hrDetails if not exists
    if (!person.hrDetails) {
      person.hrDetails = {
        offerLetter: {},
        declaration: {},
        hrCompleted: false,
        hrCompletedAt: null
      };
    }

    // Get document field name
    const docField = documentType === 'OFFER_LETTER' ? 'offerLetter' : 'declaration';

    // Check if document was generated
    if (!person.hrDetails[docField] || !person.hrDetails[docField].generatedFile) {
      return res.status(400).json({
        success: false,
        error: `${documentType} must be generated before uploading signed version`
      });
    }

    // Check if already signed
    if (person.hrDetails[docField].status === 'SIGNED') {
      return res.status(409).json({
        success: false,
        error: `${documentType} has already been signed`
      });
    }

    // Store previous status for audit
    const previousStatus = person.currentStatus;

    // Update document with signed file
    person.hrDetails[docField].signedFile = signedFile.trim();
    person.hrDetails[docField].status = 'SIGNED';
    person.hrDetails[docField].signedAt = new Date();

    // Move to HR_STAGE if currently EMPLOYEE_CODE_ASSIGNED
    await ensureHRStage(person, req.user.userId);

    await person.save();

    const updatedPerson = await Person.findById(person._id)
      .populate('owningDepartment', 'name code')
      .populate('createdBy', 'fullName email')
      .populate(`hrDetails.${docField}.templateId`, 'name type');

    // Audit log
    await logPersonAction(
      'HR_DOCUMENT_SIGNED',
      req.user.userId,
      person._id,
      {
        previousStatus,
        newStatus: person.currentStatus,
        documentType,
        templateId: person.hrDetails[docField].templateId ? person.hrDetails[docField].templateId.toString() : null,
        signedFile: signedFile.trim()
      },
      {},
      req
    );

    logger.info(`HR document ${documentType} signed for person ${person.email} (${person._id}) by user ${req.user.userId}`);

    res.status(200).json({
      success: true,
      data: { person: updatedPerson },
      message: `${documentType} signed document uploaded successfully`
    });
  } catch (error) {
    logger.error('Upload signed HR document error:', error);
    next(error);
  }
};

/**
 * View HR Documents
 * GET /api/persons/:id/hr/documents
 */
const viewHRDocuments = async (req, res, next) => {
  try {
    const personId = req.params.id;

    // Find person
    const person = await Person.findById(personId)
      .populate('owningDepartment', 'name code')
      .populate('createdBy', 'fullName email')
      .populate('hrDetails.offerLetter.templateId', 'name type')
      .populate('hrDetails.declaration.templateId', 'name type');

    if (!person) {
      return res.status(404).json({
        success: false,
        error: 'Person not found'
      });
    }

    // Check if person is in EMPLOYEE_CODE_ASSIGNED or later (visibility rule)
    const visibleStages = ['EMPLOYEE_CODE_ASSIGNED', 'HR_STAGE', 'HR_COMPLETED'];
    if (!visibleStages.includes(person.currentStatus)) {
      return res.status(403).json({
        success: false,
        error: `Person profile is not visible. Current status is ${person.currentStatus}. Profiles are visible from EMPLOYEE_CODE_ASSIGNED onwards.`
      });
    }

    // Prepare response data
    const hrDocuments = {
      offerLetter: person.hrDetails?.offerLetter || null,
      declaration: person.hrDetails?.declaration || null,
      hrCompleted: person.hrDetails?.hrCompleted || false,
      hrCompletedAt: person.hrDetails?.hrCompletedAt || null
    };

    res.status(200).json({
      success: true,
      data: {
        person: {
          _id: person._id,
          fullName: person.fullName,
          email: person.email,
          employeeCode: person.employeeCode,
          currentStatus: person.currentStatus
        },
        hrDocuments
      }
    });
  } catch (error) {
    logger.error('View HR documents error:', error);
    next(error);
  }
};

/**
 * Complete HR Process
 * POST /api/persons/:id/hr/complete
 */
const completeHR = async (req, res, next) => {
  try {
    const personId = req.params.id;

    // Find person
    const person = await Person.findById(personId)
      .populate('owningDepartment', 'name code');

    if (!person) {
      return res.status(404).json({
        success: false,
        error: 'Person not found'
      });
    }

    // Check user is from HR department
    const hrCheck = await checkHRDepartment(req.user.departmentId);
    if (!hrCheck.valid) {
      return res.status(403).json({
        success: false,
        error: hrCheck.error
      });
    }

    // Validate person status
    if (!['EMPLOYEE_CODE_ASSIGNED', 'HR_STAGE'].includes(person.currentStatus)) {
      return res.status(400).json({
        success: false,
        error: `Cannot complete HR. Person status is ${person.currentStatus}. Only persons with status EMPLOYEE_CODE_ASSIGNED or HR_STAGE can be completed.`
      });
    }

    // Prevent duplicate completion
    if (person.hrDetails && person.hrDetails.hrCompleted === true) {
      return res.status(409).json({
        success: false,
        error: 'HR has already been completed for this person'
      });
    }

    // Validate employee code exists
    if (!person.employeeCode) {
      return res.status(400).json({
        success: false,
        error: 'Cannot complete HR. Employee code must be assigned before HR completion.'
      });
    }

    // Validate finance is completed
    if (!person.financeDetails || !person.financeDetails.kycCompleted) {
      return res.status(400).json({
        success: false,
        error: 'Cannot complete HR. Finance KYC must be completed before HR completion.'
      });
    }

    // Initialize hrDetails if not exists
    if (!person.hrDetails) {
      person.hrDetails = {
        offerLetter: {},
        declaration: {},
        hrCompleted: false,
        hrCompletedAt: null
      };
    }

    // Validate both documents are signed
    const missingSignatures = [];
    
    if (!person.hrDetails.offerLetter || person.hrDetails.offerLetter.status !== 'SIGNED') {
      missingSignatures.push('OFFER_LETTER');
    }

    if (!person.hrDetails.declaration || person.hrDetails.declaration.status !== 'SIGNED') {
      missingSignatures.push('DECLARATION');
    }

    if (missingSignatures.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot complete HR. All HR documents must be signed before completion.',
        missingSignatures
      });
    }

    // Store previous status for audit
    const previousStatus = person.currentStatus;

    // Complete HR
    person.hrDetails.hrCompleted = true;
    person.hrDetails.hrCompletedAt = new Date();
    person.currentStatus = 'HR_COMPLETED';

    // Append to status history
    person.statusHistory.push({
      status: 'HR_COMPLETED',
      changedBy: req.user.userId,
      changedAt: new Date()
    });

    await person.save();

    const updatedPerson = await Person.findById(person._id)
      .populate('owningDepartment', 'name code')
      .populate('createdBy', 'fullName email')
      .populate('statusHistory.changedBy', 'fullName email')
      .populate('hrDetails.offerLetter.templateId', 'name type')
      .populate('hrDetails.declaration.templateId', 'name type');

    // Audit log
    await logPersonAction(
      'HR_COMPLETED',
      req.user.userId,
      person._id,
      {
        previousStatus,
        newStatus: 'HR_COMPLETED',
        hrCompletedAt: person.hrDetails.hrCompletedAt,
        hrCompleted: true
      },
      {},
      req
    );

    logger.info(`HR completed for person ${person.email} (${person._id}) by user ${req.user.userId}`);

    res.status(200).json({
      success: true,
      data: { person: updatedPerson },
      message: 'HR process completed successfully'
    });
  } catch (error) {
    logger.error('Complete HR error:', error);
    next(error);
  }
};

module.exports = {
  generateHRDocument,
  uploadSignedHRDocument,
  viewHRDocuments,
  completeHR
};

